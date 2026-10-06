@echo off
title DuckBoss v2 - Launcher
echo ==============================================
echo 🦆 DuckBoss v2 - Iniciando Servicios...
echo ==============================================

echo.
echo [1/2] Iniciando Backend Orchestrator (FastAPI)...
start "Orchestrator (Backend)" cmd /k "call .venv\Scripts\activate.bat && python orchestrator\run.py"

echo [2/2] Iniciando Web UI (Vite + React)...
start "Web UI (Frontend)" cmd /k "cd web-ui && npm run dev"

echo.
echo Servidores iniciados en ventanas separadas.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Cierra las ventanas individuales para detener los servicios.
pause
