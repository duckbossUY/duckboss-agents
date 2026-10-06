import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Dict, Any, List, Optional
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# Define sensitive tools that require Human-in-the-Loop intervention
SENSITIVE_TOOLS = [
    "send_payment_reminder_email"
]

class MCPClientManager:
    def __init__(self, server_script_path: str):
        self.server_script_path = server_script_path
        self._session: Optional[ClientSession] = None
        self._exit_stack = None

    async def connect(self):
        """Connect to the MCP server via stdio"""
        server_params = StdioServerParameters(
            command=sys.executable,
            args=[self.server_script_path],
            env=os.environ.copy()
        )
        # For simplicity in this implementation, we will connect per request or manage it carefully.
        # A full implementation would keep this open.
        pass

    @staticmethod
    def is_tool_sensitive(tool_name: str) -> bool:
        return tool_name in SENSITIVE_TOOLS

    async def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Ejecuta una herramienta a través del protocolo MCP"""
        server_params = StdioServerParameters(
            command=sys.executable,
            args=[self.server_script_path],
            env=os.environ.copy()
        )
        
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                result = await session.call_tool(tool_name, arguments=arguments)
                
                # Assuming the MCP server returns a JSON string or similar in the content
                if result.content and len(result.content) > 0:
                    text_result = result.content[0].text
                    # The server returns a dict, but MCP protocol returns TextContent
                    # FastMCP automatically converts dict returns to JSON strings
                    import json
                    try:
                        return json.loads(text_result)
                    except:
                        return {"status": "success", "result": text_result}
                return {"status": "error", "message": "No content returned"}

# Singleton instance for the builtin executive tools server
BASE_DIR = Path(__file__).resolve().parent.parent.parent
server_path = str(BASE_DIR / "app" / "mcp" / "builtin_servers" / "executive_tools.py")
executive_tools = MCPClientManager(server_path)
