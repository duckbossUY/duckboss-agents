import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings
from app.db.database import init_db
from app.api.routes import agents, executions, interventions, knowledge, executive

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database and default agents/preferences
    await init_db()
    print("[DuckBoss Orchestrator] Base de datos y agentes inicializados correctamente.")
    yield

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Plataforma de Hosting, Observabilidad y Asesoría con Agentes Autónomos y MCP",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(agents.router)
app.include_router(executions.router)
app.include_router(interventions.router)
app.include_router(knowledge.router)
app.include_router(executive.router)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.app_version,
        "platform": "DuckBoss v2"
    }

# Serve Frontend static assets if built
DIST_DIR = settings.base_dir / "web-ui" / "dist"
if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = DIST_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(DIST_DIR / "index.html")
