"""
Test Suite para Meta-Agent Builder y Creación Autónoma de Agentes en DuckBoss.
"""
import asyncio
import sys
import unittest
import shutil
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from orchestrator.app.services.discovery import discovery_service
from orchestrator.app.services.runner import runner_service
from orchestrator.app.models.execution import ExecutionStatus
from agents.meta_agent_builder.tools import (
    validate_manifest_schema,
    write_agent_files,
    execute_agent_dry_run,
    cleanup_agent
)

class TestMetaAgentBuilder(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.test_agent_id = "test_generated_sentiment_agent"
        # Limpieza preventiva
        cleanup_agent(self.test_agent_id)

    def tearDown(self):
        # Limpiar agente de prueba para no ensuciar el repositorio
        cleanup_agent(self.test_agent_id)

    def test_tools_validation_and_dry_run(self):
        """Valida que las herramientas de scaffolding y dry-run funcionen correctamente."""
        manifest = {
            "id": self.test_agent_id,
            "name": "Test Sentiment Agent",
            "version": "1.0.0",
            "description": "Agente temporal de prueba",
            "category": "analysis",
            "runtime": {
                "type": "python",
                "entrypoint": "entrypoint.py"
            },
            "inputs": [
                {
                    "name": "text",
                    "label": "Texto",
                    "type": "string",
                    "required": True,
                    "default": "DuckBoss es excelente"
                }
            ],
            "triggers": ["manual"],
            "output": {"type": "json", "description": "Resultado de prueba"}
        }

        # 1. Probar validador de esquema
        val_res = validate_manifest_schema(manifest)
        self.assertTrue(val_res.get("valid"), f"Esquema debe ser válido: {val_res}")

        # 2. Probar escritura de archivos
        code = '''
import sys
import json
import time

def main():
    print('{"timestamp": "2026-01-01T00:00:00Z", "level": "INFO", "message": "Corriendo prueba"}', flush=True)
    print('\\n__DUCKBOSS_OUTPUT_BEGIN__', flush=True)
    print(json.dumps({"sentiment": "positive", "score": 0.99}), flush=True)
    print('__DUCKBOSS_OUTPUT_END__', flush=True)

if __name__ == "__main__":
    main()
'''
        write_res = write_agent_files(
            agent_id=self.test_agent_id,
            manifest=manifest,
            entrypoint_code=code,
            requirements_txt="# test",
            readme_md="# Test README"
        )
        self.assertTrue(write_res.get("success"), f"Escritura debe tener éxito: {write_res}")

        # 3. Probar dry-run en subproceso
        dry_res = execute_agent_dry_run(self.test_agent_id, {"text": "Prueba"})
        self.assertTrue(dry_res.get("success"), f"Dry-run debe tener éxito: {dry_res}")
        self.assertEqual(dry_res.get("exit_code"), 0)
        self.assertIsNotNone(dry_res.get("extracted_output"))
        self.assertEqual(dry_res["extracted_output"].get("sentiment"), "positive")

    def test_meta_agent_discovery(self):
        """Valida que DuckBoss descubra automáticamente a meta_agent_builder."""
        agents = discovery_service.discover_agents()
        self.assertIn("meta_agent_builder", agents, "meta_agent_builder debe ser descubierto")
        
        meta_agent = agents["meta_agent_builder"]
        self.assertEqual(meta_agent.manifest.category, "developer")
        self.assertGreaterEqual(len(meta_agent.manifest.inputs), 3)

    async def test_meta_agent_runner_autonomous_flow(self):
        """Ejecuta el Meta-Agent Builder de punta a punta a través de runner_service y verifica la creación de un nuevo agente."""
        inputs = {
            "agent_idea": "Agente analizador de reviews y feedback con cálculo de NPS",
            "agent_id": self.test_agent_id,
            "category": "analysis",
            "iterations": 4
        }

        # 1. Iniciar ejecución
        exec_ctx = await runner_service.start_execution("meta_agent_builder", inputs)
        self.assertIsNotNone(exec_ctx.execution_id)

        # 2. Esperar finalización
        for _ in range(120): # hasta 12 segundos
            if exec_ctx.status in [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED]:
                break
            await asyncio.sleep(0.1)

        self.assertEqual(exec_ctx.status, ExecutionStatus.COMPLETED, f"La ejecución falló: {exec_ctx.error}")
        self.assertEqual(exec_ctx.exit_code, 0)
        self.assertIsNotNone(exec_ctx.output)
        self.assertEqual(exec_ctx.output.get("status"), "success")
        self.assertEqual(exec_ctx.output.get("agent_id"), self.test_agent_id)

        # 3. Verificar que el NUEVO agente ahora es inmediatamente descubierto por DuckBoss
        fresh_agents = discovery_service.discover_agents()
        self.assertIn(
            self.test_agent_id,
            fresh_agents,
            "El nuevo agente creado por el Meta-Agent debe ser descubierto por DuckBoss"
        )
        
        new_agent_info = fresh_agents[self.test_agent_id]
        self.assertEqual(new_agent_info.manifest.category, "analysis")
        self.assertGreater(len(new_agent_info.manifest.inputs), 0)

        # 4. Probar que el nuevo agente creado puede ser ejecutado por runner_service
        new_exec_ctx = await runner_service.start_execution(self.test_agent_id, {})
        for _ in range(80):
            if new_exec_ctx.status in [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED]:
                break
            await asyncio.sleep(0.1)

        self.assertEqual(new_exec_ctx.status, ExecutionStatus.COMPLETED)
        self.assertEqual(new_exec_ctx.exit_code, 0)
        self.assertIsNotNone(new_exec_ctx.output)

if __name__ == "__main__":
    unittest.main()
