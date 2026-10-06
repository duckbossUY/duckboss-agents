import sys
import os
import io
import uvicorn
from pathlib import Path

# Add orchestrator to sys.path so app can be imported
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from app.core.config import settings

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    elif sys.platform == "win32":
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

    app_dir = str(BASE_DIR / "app")
    print(f"🚀 Iniciando DuckBoss Orchestrator v2 en http://{HOST}:{PORT}")
    print(f"📁 Modo reload activo en: {app_dir}")
    loop_factory = "asyncio.windows_events:ProactorEventLoop" if sys.platform == "win32" else "auto"
    uvicorn.run(
        "app.main:app",
        host=HOST,
        port=PORT,
        reload=True,
        loop=loop_factory,
        reload_dirs=[app_dir],
        reload_excludes=[
            "*.pyc",
            "*__pycache__*",
            "*.sqlite3*",
            "*.log",
            "*.tmp",
            "data/*"
        ]
    )
