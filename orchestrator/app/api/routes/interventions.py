import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.db.database import get_db
from app.engine.agent_runner import AgentRunner

router = APIRouter(prefix="/api/interventions", tags=["Interventions"])

class ResolveInterventionRequest(BaseModel):
    decision: str  # "approved", "rejected", "modified"
    user_response: Optional[str] = ""
    modified_args: Optional[Dict[str, Any]] = None

@router.get("")
async def list_pending_interventions():
    """Lista las intervenciones pendientes que requieren atención o desbloqueo del usuario"""
    db = await get_db()
    try:
        cursor = await db.execute("""
            SELECT i.*, a.name as agent_name, a.avatar as agent_avatar, a.role as agent_role
            FROM interventions i
            JOIN agents a ON i.agent_id = a.id
            WHERE i.status = 'pending'
            ORDER BY i.created_at DESC
        """)
        rows = await cursor.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["context_data"] = json.loads(d["context_data"])
            result.append(d)
        return result
    finally:
        await db.close()

@router.post("/{intervention_id}/resolve")
async def resolve_intervention(intervention_id: str, req: ResolveInterventionRequest):
    """Resuelve la intervención (Aprobar, Rechazar o Modificar) y reanuda el ciclo del agente"""
    if req.decision not in ["approved", "rejected", "modified"]:
        raise HTTPException(status_code=400, detail="Decisión inválida. Debe ser approved, rejected o modified.")

    res = await AgentRunner.resolve_intervention(
        intervention_id=intervention_id,
        decision=req.decision,
        user_response=req.user_response or "",
        modified_args=req.modified_args
    )
    return res
