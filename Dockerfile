# Multi-stage Dockerfile for DuckBoss AI Agent Platform on Google Cloud Run
# Stage 1: Build Frontend SPA
FROM node:20-slim AS frontend-builder
WORKDIR /app/web-ui
COPY web-ui/package*.json ./
RUN npm ci
COPY web-ui/ ./
RUN npm run build

# Stage 2: Python Runtime & Orchestrator
FROM python:3.12-slim
WORKDIR /app

# Prevent Python from writing .pyc and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONIOENCODING=utf-8
ENV PYTHONUTF8=1
ENV DUCKBOSS_HOST=0.0.0.0
ENV DUCKBOSS_PORT=8080

# Install dependencies
COPY orchestrator/requirements.txt ./orchestrator/
RUN pip install --no-cache-dir -r orchestrator/requirements.txt

# Copy Orchestrator and Agents
COPY orchestrator/ ./orchestrator/
COPY agents/ ./agents/

# Copy built frontend from Stage 1 into web-ui/dist
COPY --from=frontend-builder /app/web-ui/dist ./web-ui/dist

# Expose default Cloud Run port
EXPOSE 8080

# Start Uvicorn orchestrator
CMD ["sh", "-c", "python -m uvicorn orchestrator.app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
