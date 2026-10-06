from fastapi import APIRouter
from .agents import router as agents_router
from .executions import router as executions_router

api_router = APIRouter()
api_router.include_router(agents_router, prefix="/agents", tags=["Agents"])
api_router.include_router(executions_router, prefix="/executions", tags=["Executions"])
