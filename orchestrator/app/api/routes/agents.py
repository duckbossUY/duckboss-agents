import json
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.db.database import get_db

router = APIRouter(prefix="/api/agents", tags=["Agents"])

class AgentUpdate(BaseModel):
    model_provider: Optional[str] = None
    model_name: Optional[str] = None
    system_prompt: Optional[str] = None

@router.get("")
async def list_agents():
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM agents ORDER BY squad ASC, name ASC")
        rows = await cursor.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["tools"] = json.loads(d["tools"])
            result.append(d)
        return result
    finally:
        await db.close()

@router.get("/{agent_id}")
async def get_agent(agent_id: str):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM agents WHERE id = ?", (agent_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Agente no encontrado")
        d = dict(row)
        d["tools"] = json.loads(d["tools"])
        return d
    finally:
        await db.close()

@router.patch("/{agent_id}")
async def update_agent(agent_id: str, update: AgentUpdate):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM agents WHERE id = ?", (agent_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Agente no encontrado")
            
        fields = []
        values = []
        if update.model_provider is not None:
            fields.append("model_provider = ?")
            values.append(update.model_provider)
        if update.model_name is not None:
            fields.append("model_name = ?")
            values.append(update.model_name)
        if update.system_prompt is not None:
            fields.append("system_prompt = ?")
            values.append(update.system_prompt)
            
        if fields:
            values.append(agent_id)
            query = f"UPDATE agents SET {', '.join(fields)} WHERE id = ?"
            await db.execute(query, tuple(values))
            await db.commit()
            
        return {"status": "success", "message": "Agente actualizado correctamente"}
    finally:
        await db.close()
