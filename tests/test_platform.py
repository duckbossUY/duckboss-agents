import asyncio
import sys
import unittest
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from orchestrator.app.services.discovery import discovery_service
from orchestrator.app.services.runner import runner_service
from orchestrator.app.models.execution import ExecutionStatus

class TestDuckBossPlatform(unittest.IsolatedAsyncioTestCase):
    def test_discovery_service(self):
        """Test que el servicio de descubrimiento encuentra example_agent y valida el manifest."""
        agents = discovery_service.discover_agents(include_templates=False)
        self.assertIn("example_agent", agents, "example_agent debería estar presente")
        
        agent = agents["example_agent"]
        self.assertEqual(agent.manifest.name, "Market Researcher & Analyst")
        self.assertEqual(agent.manifest.category, "analysis")
        self.assertEqual(len(agent.manifest.inputs), 4)

        # Test que _template no se incluye por defecto pero sí si include_templates=True
        self.assertNotIn("_template", agents)
        all_agents = discovery_service.discover_agents(include_templates=True)
        self.assertIn("_template", all_agents)

    async def test_runner_execution_and_streaming(self):
        """Test que ejecuta el agente asíncronamente y captura logs, estado y entregable."""
        inputs = {
            "topic": "Unit Test AI",
            "depth": "superficial",
            "iterations": 1,
            "include_sources": False
        }

        exec_ctx = await runner_service.start_execution("example_agent", inputs)
        self.assertIsNotNone(exec_ctx.execution_id)
        self.assertEqual(exec_ctx.agent_id, "example_agent")

        # Escuchar eventos SSE
        logs_received = []
        statuses_received = []
        output_received = None

        async for raw_event in runner_service.subscribe_events(exec_ctx.execution_id):
            if "event: log" in raw_event:
                logs_received.append(raw_event)
            elif "event: status" in raw_event:
                statuses_received.append(raw_event)
            elif "event: output" in raw_event:
                output_received = raw_event

            # Cuando termine la ejecución, el generador saldrá solo
            if exec_ctx.status in [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED]:
                break

        # Esperar confirmación de salida
        for _ in range(50):
            if exec_ctx.status == ExecutionStatus.COMPLETED:
                break
            await asyncio.sleep(0.1)

        self.assertEqual(exec_ctx.status, ExecutionStatus.COMPLETED)
        self.assertEqual(exec_ctx.exit_code, 0)
        self.assertGreater(len(exec_ctx.logs), 3, "Debe haber múltiples logs emitidos")
        self.assertIsNotNone(exec_ctx.output, "El agente debe haber emitido un bloque de salida estructurado")
        self.assertIn("executive_summary", exec_ctx.output)
        self.assertEqual(exec_ctx.output["topic"], "Unit Test AI")

if __name__ == "__main__":
    unittest.main()
