import json
import uuid
import asyncio
import datetime
from typing import Dict, Any, List, Optional
from app.db.database import get_db
from app.llm.provider import llm_provider
from app.mcp.client import executive_tools
from app.memory.chroma_service import chroma_memory

# In-memory registry for waiting execution events and SSE event queues
EXECUTION_QUEUES: Dict[str, List[asyncio.Queue]] = {}
INTERVENTION_EVENTS: Dict[str, asyncio.Event] = {}
INTERVENTION_RESOLUTIONS: Dict[str, Dict[str, Any]] = {}

class AgentRunner:
    @staticmethod
    def register_listener(execution_id: str) -> asyncio.Queue:
        queue = asyncio.Queue()
        if execution_id not in EXECUTION_QUEUES:
            EXECUTION_QUEUES[execution_id] = []
        EXECUTION_QUEUES[execution_id].append(queue)
        return queue

    @staticmethod
    def unregister_listener(execution_id: str, queue: asyncio.Queue):
        if execution_id in EXECUTION_QUEUES and queue in EXECUTION_QUEUES[execution_id]:
            EXECUTION_QUEUES[execution_id].remove(queue)
            if not EXECUTION_QUEUES[execution_id]:
                del EXECUTION_QUEUES[execution_id]

    @staticmethod
    async def emit_event(execution_id: str, event_type: str, data: Dict[str, Any]):
        """Transmite un evento por SSE a todos los clientes suscritos a esta ejecución"""
        payload = {
            "type": event_type,
            "data": data,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        if execution_id in EXECUTION_QUEUES:
            for q in list(EXECUTION_QUEUES[execution_id]):
                await q.put(payload)

    @classmethod
    async def run_execution(cls, execution_id: str, agent_id: str, prompt: str):
        """Ejecuta el ciclo ReAct del agente con soporte de Observabilidad y Human-in-the-Loop"""
        db = await get_db()
        try:
            # 1. Recuperar agente
            cursor = await db.execute("SELECT * FROM agents WHERE id = ?", (agent_id,))
            agent_row = await cursor.fetchone()
            if not agent_row:
                raise ValueError(f"Agente {agent_id} no encontrado")
            
            agent = dict(agent_row)
            await db.execute("UPDATE agents SET status = 'running' WHERE id = ?", (agent_id,))
            await db.execute("UPDATE executions SET status = 'running' WHERE id = ?", (execution_id,))
            await db.commit()

            await cls.emit_event(execution_id, "status_change", {"status": "running", "agent": agent["name"]})

            # 2. Recuperar preferencias del usuario y contexto de memoria
            pref_cursor = await db.execute("SELECT key, value, category FROM user_preferences")
            prefs_rows = await pref_cursor.fetchall()
            user_prefs_text = "\n".join([f"- {r['key']} ({r['category']}): {r['value']}" for r in prefs_rows])

            relevant_docs = chroma_memory.query_relevant_documents(prompt, n_results=2)
            context_text = "\n".join([f"[{d['title']}]: {d['content']}" for d in relevant_docs]) if relevant_docs else "Sin documentos específicos."

            past_corrections = chroma_memory.query_corrections(agent_id, prompt, n_results=2)
            if past_corrections:
                context_text += "\n\nREGLAS Y CORRECCIONES PREVIAS DEL USUARIO:\n"
                for c in past_corrections:
                    context_text += f"- Corrección recordada: {c.get('correction')}\n"

            # 3. Iniciar Ciclo ReAct
            max_turns = 8
            turn = 0
            execution_history: List[Dict[str, Any]] = []

            while turn < max_turns:
                turn += 1
                
                # Turno del LLM
                response = await llm_provider.generate_turn(
                    agent=agent,
                    user_prompt=prompt,
                    execution_history=execution_history,
                    available_tools=json.loads(agent.get("tools", "[]")),
                    relevant_context=context_text,
                    user_preferences=user_prefs_text
                )

                # Registrar y emitir Pensamiento (Thought)
                if response.thought:
                    step_now = datetime.datetime.now(datetime.timezone.utc).isoformat()
                    await db.execute("""
                        INSERT INTO execution_steps (execution_id, step_number, step_type, title, content, metadata, timestamp)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (execution_id, turn, "thought", "Pensamiento del Agente", response.thought, "{}", step_now))
                    await db.commit()

                    step_data = {"step_number": turn, "step_type": "thought", "title": "Razonamiento", "content": response.thought}
                    execution_history.append(step_data)
                    await cls.emit_event(execution_id, "step", step_data)
                    await asyncio.sleep(0.3)  # Pausa visual estética para el streaming

                # Si hay llamada a herramienta
                if response.tool_call:
                    tool_name = response.tool_call.get("name")
                    tool_args = response.tool_call.get("arguments", {})
                    
                    # Chequear si la herramienta es SENSIBLE -> Human-in-the-Loop
                    if executive_tools.is_tool_sensitive(tool_name):
                        intervention_id = f"hitl_{uuid.uuid4().hex[:8]}"
                        interv_now = datetime.datetime.now(datetime.timezone.utc).isoformat()
                        
                        title = f"Autorización requerida para {tool_name}"
                        reason = f"La acción '{tool_name}' tiene impacto externo directo o comercial sobre clientes."
                        proposed_action = f"Ejecutar {tool_name} con los argumentos preparados."

                        await db.execute("""
                            INSERT INTO interventions (id, execution_id, agent_id, title, reason, proposed_action, context_data, status, created_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
                        """, (intervention_id, execution_id, agent_id, title, reason, proposed_action, json.dumps(tool_args), interv_now))
                        
                        await db.execute("UPDATE executions SET status = 'waiting_for_human' WHERE id = ?", (execution_id,))
                        await db.execute("UPDATE agents SET status = 'blocked' WHERE id = ?", (agent_id,))
                        await db.commit()

                        # Registrar paso en historial
                        await db.execute("""
                            INSERT INTO execution_steps (execution_id, step_number, step_type, title, content, metadata, timestamp)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        """, (execution_id, turn, "human_request", "Intervención Humana Solicitada", reason, json.dumps(tool_args), interv_now))
                        await db.commit()

                        interv_payload = {
                            "intervention_id": intervention_id,
                            "execution_id": execution_id,
                            "agent_id": agent_id,
                            "title": title,
                            "reason": reason,
                            "tool_name": tool_name,
                            "tool_args": tool_args
                        }
                        await cls.emit_event(execution_id, "human_intervention_required", interv_payload)

                        # Pausar ejecución esperando resolución humana
                        event = asyncio.Event()
                        INTERVENTION_EVENTS[intervention_id] = event
                        
                        # Esperar hasta que el usuario resuelva vía API
                        await event.wait()

                        # Recuperar resolución
                        resolution = INTERVENTION_RESOLUTIONS.pop(intervention_id, {"decision": "rejected"})
                        decision = resolution.get("decision", "rejected")
                        user_note = resolution.get("user_response", "")

                        # Registrar respuesta humana
                        res_now = datetime.datetime.now(datetime.timezone.utc).isoformat()
                        await db.execute("""
                            INSERT INTO execution_steps (execution_id, step_number, step_type, title, content, metadata, timestamp)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        """, (execution_id, turn, "human_response", f"Resolución Humana: {decision.upper()}", user_note or decision, "{}", res_now))
                        
                        step_human = {
                            "step_number": turn,
                            "step_type": "human_response",
                            "title": f"Resolución Humana: {decision.upper()}",
                            "content": user_note or decision
                        }
                        execution_history.append(step_human)
                        await cls.emit_event(execution_id, "step", step_human)

                        # Si el usuario corrigió o dio feedback, lo guardamos en la memoria semántica de ChromaDB!
                        if user_note:
                            chroma_memory.add_user_correction(
                                agent_id=agent_id,
                                context=f"Acción {tool_name} con args {json.dumps(tool_args)}",
                                correction=user_note
                            )

                        await db.execute("UPDATE executions SET status = 'running' WHERE id = ?", (execution_id,))
                        await db.execute("UPDATE agents SET status = 'running' WHERE id = ?", (agent_id,))
                        await db.commit()
                        await cls.emit_event(execution_id, "status_change", {"status": "running"})

                        if decision == "rejected":
                            step_data = {
                                "step_number": turn,
                                "step_type": "tool_result",
                                "title": f"Acción {tool_name} Rechazada por el Usuario",
                                "content": f"El usuario rechazó esta acción con la siguiente nota: '{user_note}'"
                            }
                            execution_history.append(step_data)
                            await cls.emit_event(execution_id, "step", step_data)
                            continue  # Siguiente ciclo para que el agente replantee
                        
                        elif decision == "modified":
                            # Si modificó argumentos
                            if "modified_args" in resolution:
                                tool_args = resolution["modified_args"]

                    # Ejecución de la herramienta
                    step_call = {
                        "step_number": turn,
                        "step_type": "tool_call",
                        "title": f"Invocando herramienta MCP: {tool_name}",
                        "content": json.dumps(tool_args, indent=2)
                    }
                    execution_history.append(step_call)
                    await cls.emit_event(execution_id, "step", step_call)
                    
                    tool_result = await executive_tools.execute_tool(tool_name, tool_args)
                    await asyncio.sleep(0.4)

                    step_result = {
                        "step_number": turn,
                        "step_type": "tool_result",
                        "title": f"Resultado de {tool_name}",
                        "content": json.dumps(tool_result, indent=2)
                    }
                    execution_history.append(step_result)
                    await cls.emit_event(execution_id, "step", step_result)

                    step_now = datetime.datetime.now(datetime.timezone.utc).isoformat()
                    await db.execute("""
                        INSERT INTO execution_steps (execution_id, step_number, step_type, title, content, metadata, timestamp)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (execution_id, turn, "tool_result", f"Resultado {tool_name}", json.dumps(tool_result), "{}", step_now))
                    await db.commit()

                # Si hay respuesta final sintetizada
                if response.final_answer:
                    finished_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
                    await db.execute("""
                        UPDATE executions SET status = 'completed', result = ?, finished_at = ? WHERE id = ?
                    """, (response.final_answer, finished_at, execution_id))
                    await db.execute("UPDATE agents SET status = 'idle' WHERE id = ?", (agent_id,))
                    await db.commit()

                    final_step = {
                        "step_number": turn,
                        "step_type": "final_answer",
                        "title": "Entregable Final",
                        "content": response.final_answer
                    }
                    await cls.emit_event(execution_id, "step", final_step)
                    await cls.emit_event(execution_id, "finished", {"result": response.final_answer, "status": "completed"})
                    break

        except Exception as e:
            err_msg = str(e)
            print(f"[AgentRunner] Error en ejecución {execution_id}: {err_msg}")
            finished_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
            await db.execute("UPDATE executions SET status = 'failed', result = ?, finished_at = ? WHERE id = ?", (err_msg, finished_at, execution_id))
            await db.execute("UPDATE agents SET status = 'idle' WHERE id = ?", (agent_id,))
            await db.commit()
            await cls.emit_event(execution_id, "finished", {"status": "failed", "error": err_msg})
        finally:
            await db.close()

    @classmethod
    async def resolve_intervention(cls, intervention_id: str, decision: str, user_response: str = "", modified_args: Optional[Dict[str, Any]] = None):
        """Resuelve un bloqueo Human-in-the-Loop y reanuda el ciclo del agente"""
        db = await get_db()
        try:
            resolved_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
            await db.execute("""
                UPDATE interventions
                SET status = ?, user_response = ?, resolved_at = ?
                WHERE id = ?
            """, (decision, user_response, resolved_at, intervention_id))
            await db.commit()

            INTERVENTION_RESOLUTIONS[intervention_id] = {
                "decision": decision,
                "user_response": user_response,
                "modified_args": modified_args
            }

            event = INTERVENTION_EVENTS.get(intervention_id)
            if event:
                event.set()
                del INTERVENTION_EVENTS[intervention_id]

            return {"status": "success", "intervention_id": intervention_id, "decision": decision}
        finally:
            await db.close()
