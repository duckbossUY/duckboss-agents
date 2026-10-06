import os
import sys
import asyncio
from pathlib import Path

# Add orchestrator to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR / "orchestrator"))

from app.core.config import settings
from app.db.database import init_db, get_db
from app.mcp.client import executive_tools
from app.memory.chroma_service import chroma_memory
from app.engine.agent_runner import AgentRunner
from app.llm.provider import llm_provider

async def test_database_initialization_and_seeding():
    await init_db()
    db = await get_db()
    try:
        # Check agents
        cursor = await db.execute("SELECT id, name, squad, role FROM agents")
        agents = await cursor.fetchall()
        agent_ids = [a["id"] for a in agents]
        assert "executive_assistant" in agent_ids
        assert "cybersecurity_auditor" in agent_ids
        assert "ux_architect" in agent_ids
        assert "financial_advisor" in agent_ids
        assert "growth_marketer" in agent_ids

        # Check preferences
        pref_cursor = await db.execute("SELECT key, value FROM user_preferences")
        prefs = await pref_cursor.fetchall()
        pref_keys = [p["key"] for p in prefs]
        assert "working_hours" in pref_keys
        assert "collection_tone" in pref_keys
    finally:
        await db.close()

async def test_chroma_vector_memory():
    # Test document addition and semantic retrieval
    doc_id = chroma_memory.add_document(
        title="Directiva de Facturación TechCorp",
        content="TechCorp Solutions cuenta con un acuerdo marco de pago a 15 días con penalidad del 2% diario a partir del día 16.",
        category="finanzas"
    )
    assert doc_id is not None

    results = chroma_memory.query_relevant_documents("acuerdo marco penalidad de mora TechCorp", n_results=1)
    assert len(results) > 0
    assert "TechCorp" in results[0]["content"]

    # Test user correction memory
    corr_id = chroma_memory.add_user_correction(
        agent_id="executive_assistant",
        context="Cobro a cliente TechCorp",
        correction="No amenazar con suspender el servicio hasta superar los 30 días de mora."
    )
    assert corr_id is not None
    corrections = chroma_memory.query_corrections("executive_assistant", "suspensión de servicio por mora", n_results=1)
    assert len(corrections) > 0
    assert "30 días" in corrections[0]["text"]

async def test_executive_mcp_tools():
    # Test calendar tool
    events = await executive_tools.execute_tool("list_upcoming_events", {"days_ahead": 7})
    assert events["status"] == "success"
    assert events["count"] > 0

    # Test debtor clients tool
    debtors = await executive_tools.execute_tool("list_debtor_clients", {"min_overdue_days": 5})
    assert debtors["status"] == "success"
    assert debtors["total_overdue_usd"] > 0

    # Check sensitivity
    assert executive_tools.is_tool_sensitive("send_payment_reminder_email") is True
    assert executive_tools.is_tool_sensitive("list_upcoming_events") is False

import uuid

async def test_human_in_the_loop_execution_flow():
    await init_db()
    exec_id = f"test_hitl_{uuid.uuid4().hex[:8]}"
    db = await get_db()
    try:
        await db.execute("""
            INSERT INTO executions (id, agent_id, prompt, status, created_at)
            VALUES (?, 'executive_assistant', 'Cobrar a clientes deudores', 'pending', '2026-10-04T12:00:00Z')
        """, (exec_id,))
        await db.commit()
    finally:
        await db.close()

    # Launch execution task in background
    task = asyncio.create_task(AgentRunner.run_execution(exec_id, "executive_assistant", "Cobrar factura a TechCorp"))

    # Wait briefly for agent to reach WAITING_FOR_HUMAN
    for _ in range(25):
        await asyncio.sleep(0.2)
        db = await get_db()
        try:
            cursor = await db.execute("SELECT status FROM executions WHERE id = ?", (exec_id,))
            row = await cursor.fetchone()
            if row and row["status"] == "waiting_for_human":
                break
        finally:
            await db.close()

    # Verify intervention record was created
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id, status, proposed_action FROM interventions WHERE execution_id = ?", (exec_id,))
        interv = await cursor.fetchone()
        assert interv is not None
        assert interv["status"] == "pending"
        interv_id = interv["id"]
    finally:
        await db.close()

    # Simulate human approval with modified note
    res = await AgentRunner.resolve_intervention(
        intervention_id=interv_id,
        decision="approved",
        user_response="Aprobado por el usuario: dar 48 horas hábiles."
    )
    assert res["status"] == "success"

    # Await completion of execution
    await asyncio.wait_for(task, timeout=10.0)

    # Verify final execution state
    db = await get_db()
    try:
        cursor = await db.execute("SELECT status, result FROM executions WHERE id = ?", (exec_id,))
        final_row = await cursor.fetchone()
        assert final_row["status"] == "completed"
        assert "TechCorp" in final_row["result"]
    finally:
        await db.close()

if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    asyncio.run(test_database_initialization_and_seeding())
    asyncio.run(test_chroma_vector_memory())
    asyncio.run(test_executive_mcp_tools())
    asyncio.run(test_human_in_the_loop_execution_flow())
    print("\n[SUCCESS] TODOS LOS TESTS PASARON EXITOSAMENTE!")
