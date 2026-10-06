import json
import uuid
import asyncio
import datetime
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.db.database import get_db
from app.engine.agent_runner import AgentRunner

router = APIRouter(prefix="/api", tags=["Executions"])

class RunAgentRequest(BaseModel):
    prompt: str

@router.post("/agents/{agent_id}/run")
async def run_agent(agent_id: str, req: RunAgentRequest, bg_tasks: BackgroundTasks):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM agents WHERE id = ?", (agent_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Agente no encontrado")
            
        execution_id = f"exec_{uuid.uuid4().hex[:10]}"
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        await db.execute("""
            INSERT INTO executions (id, agent_id, prompt, status, created_at)
            VALUES (?, ?, ?, 'pending', ?)
        """, (execution_id, agent_id, req.prompt, now))
        await db.commit()

        # Launch async execution task in background
        bg_tasks.add_task(AgentRunner.run_execution, execution_id, agent_id, req.prompt)

        return {
            "status": "started",
            "execution_id": execution_id,
            "agent_id": agent_id,
            "created_at": now
        }
    finally:
        await db.close()

@router.get("/executions")
async def list_executions(limit: int = 20):
    db = await get_db()
    try:
        cursor = await db.execute("""
            SELECT e.*, a.name as agent_name, a.role as agent_role, a.avatar as agent_avatar
            FROM executions e
            JOIN agents a ON e.agent_id = a.id
            ORDER BY e.created_at DESC
            LIMIT ?
        """, (limit,))
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        await db.close()

@router.get("/executions/{execution_id}")
async def get_execution(execution_id: str):
    db = await get_db()
    try:
        cursor = await db.execute("""
            SELECT e.*, a.name as agent_name, a.role as agent_role, a.avatar as agent_avatar
            FROM executions e
            JOIN agents a ON e.agent_id = a.id
            WHERE e.id = ?
        """, (execution_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Ejecución no encontrada")
            
        execution = dict(row)
        
        # Steps
        steps_cursor = await db.execute("""
            SELECT * FROM execution_steps
            WHERE execution_id = ?
            ORDER BY id ASC
        """, (execution_id,))
        steps_rows = await steps_cursor.fetchall()
        execution["steps"] = [dict(s) for s in steps_rows]

        # Interventions
        interv_cursor = await db.execute("""
            SELECT * FROM interventions
            WHERE execution_id = ?
            ORDER BY created_at ASC
        """, (execution_id,))
        interv_rows = await interv_cursor.fetchall()
        execution["interventions"] = [dict(i) for i in interv_rows]

        return execution
    finally:
        await db.close()

@router.get("/executions/{execution_id}/events")
async def stream_execution_events(execution_id: str):
    """Server-Sent Events (SSE) para streaming en vivo del razonamiento y herramientas"""
    queue = AgentRunner.register_listener(execution_id)

    async def event_generator():
        try:
            # Yield initial connect event
            yield f"event: ping\ndata: {json.dumps({'message': 'Connected to live stream', 'execution_id': execution_id})}\n\n"
            
            while True:
                try:
                    # Wait for next event with a timeout for keepalive
                    event = await asyncio.wait_for(queue.get(), timeout=15.0)
                    event_type = event.get("type", "message")
                    event_data = json.dumps(event)
                    yield f"event: {event_type}\ndata: {event_data}\n\n"

                    if event_type == "finished":
                        break
                except asyncio.TimeoutError:
                    yield f"event: keepalive\ndata: {json.dumps({'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()})}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            AgentRunner.unregister_listener(execution_id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
