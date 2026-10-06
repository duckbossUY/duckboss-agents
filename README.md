# 🦆 DuckBoss: Plataforma Modular de Hosting y Observabilidad de Agentes de IA

DuckBoss es una plataforma de orquestación y observabilidad en tiempo real diseñada para alojar, ejecutar y monitorear agentes autónomos de Inteligencia Artificial bajo una arquitectura desacoplada basada en contratos de datos (`manifest.json`) y streaming asíncrono con **Server-Sent Events (SSE)**.

---

## 🏗️ Arquitectura del Sistema

```mermaid
flowchart TD
    User([Usuario / Desarrollador]) -->|Interactúa / Configura| WebUI[Frontend React + Vite SPA]
    WebUI -->|REST: /api/agents & /api/run| FastAPI[Backend Orquestador FastAPI]
    WebUI -->|SSE: /api/executions/{id}/events| FastAPISSE[Streaming en Tiempo Real]
    
    subgraph Orquestador ["DuckBoss Orchestrator (Google Cloud Run)"]
        FastAPI --> Discovery[Discovery Service]
        FastAPI --> Runner[Subprocess Runner]
        FastAPISSE --> Runner
    end
    
    subgraph FileSystem ["Carpeta Modular /agents"]
        Discovery -.->|Escanea y valida manifest.json| AgentDir[Directorio de Agentes]
        Runner -->|Inicia subprocess con inputs| Entrypoint[entrypoint.py]
        Entrypoint -->|Captura continua stdout/stderr| Runner
        Entrypoint -->|Emite bloques estructurados| Output[__DUCKBOSS_OUTPUT_BEGIN__]
    end
```

---

## ☁️ Decisión de Infraestructura: Cloud Run vs. Firebase

| Criterio | Firebase Functions | **Google Cloud Run (Seleccionado)** |
| :--- | :--- | :--- |
| **Workload** | Serverless efímero (<9 min), sistema de archivos de solo lectura | **Contenedores Docker completos**, soporte nativo de subprocesos Python |
| **Streaming SSE** | Limitado en Cloud Functions v2 | **Nativo y persistente**: hasta 60 minutos con `text/event-stream` |
| **Aislamiento** | Dependencias globales complejas | **Aislado**: dependencias en imagen o virtualenvs modulares |
| **Costo en Reposo**| Facturación por invocación | **Escala a 0 instancias** ($0 en reposo cuando no hay ejecuciones) |

> **Rol complementario de Firebase**: Si requieres autenticación de usuarios por roles en el dashboard, puedes conectar **Firebase Auth** al frontend de forma transparente.

---

## 📁 Estructura del Repositorio

```
duckboss-agents/
├── agents/                                 # Directorio de agentes modulares
│   ├── _template/                          # Plantilla base para clonar nuevos agentes
│   │   ├── manifest.json                   # Contrato de metadata, inputs y triggers
│   │   ├── entrypoint.py                   # Script de ejecución estándar
│   │   ├── requirements.txt                # Dependencias opcionales del agente
│   │   └── README.md
│   └── example_agent/                      # Agente demostrativo de investigación de mercado
│       ├── manifest.json
│       ├── entrypoint.py
│       └── requirements.txt
├── orchestrator/                           # Backend FastAPI
│   ├── app/
│   │   ├── main.py                         # App FastAPI, CORS y fallback SPA
│   │   ├── config.py                       # Configuración y paths
│   │   ├── models/                         # Modelos Pydantic (Manifest y Execution)
│   │   ├── services/                       # Discovery (scanner) y Runner (async subprocess + SSE)
│   │   └── api/routes/                     # Endpoints /api/agents y /api/executions
│   ├── requirements.txt
│   └── run.py                              # Entrypoint local con Uvicorn
├── web-ui/                                 # Frontend SPA moderno (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/                     # Navbar, AgentCard, DynamicInputForm, LiveLogConsole, OutputViewer
│   │   ├── pages/                          # Dashboard y AgentDetail
│   │   ├── services/api.ts                 # Cliente HTTP y EventSource (SSE)
│   │   └── index.css                       # Tokens de diseño dark mode y animaciones
│   └── dist/                               # Bundle compilado de producción
├── Dockerfile                              # Multi-stage build para Google Cloud Run
└── README.md
```

---

## 🚀 Inicio Rápido (Local)

### Requisitos Previos
- **Python 3.10+** (probado con Python 3.12)
- **Node.js 18+** y **npm**

### 1. Levantar el Backend Orquestador
```bash
# Crear y activar entorno virtual
python -m venv .venv
# En Windows:
.venv\Scripts\activate
# En Linux/macOS:
source .venv/bin/activate

# Instalar dependencias
pip install -r orchestrator/requirements.txt

# Iniciar el orquestador
python orchestrator/run.py
```
El backend estará disponible en `http://localhost:8000`.

### 2. Levantar el Frontend Web UI (Modo Desarrollo)
En otra terminal:
```bash
cd web-ui
npm install
npm run dev
```
La interfaz estará accesible en `http://localhost:5173`.

> **Nota de Producción**: Al compilar el frontend con `npm run build` dentro de `web-ui/`, el propio backend FastAPI en el puerto 8000 sirve la aplicación completa automáticamente.

---

## 🛠️ Cómo Crear y Añadir un Nuevo Agente

1. **Duplica la carpeta plantilla**:
   ```bash
   cp -r agents/_template agents/mi_nuevo_agente
   ```
2. **Edita `manifest.json`**:
   Configura el identificador, título, descripción y los parámetros de entrada que renderizará la UI:
   ```json
   {
     "id": "mi_nuevo_agente",
     "name": "Generador de Reportes",
     "version": "1.0.0",
     "category": "automation",
     "runtime": { "type": "python", "entrypoint": "entrypoint.py" },
     "inputs": [
       {
         "name": "report_type",
         "label": "Tipo de Reporte",
         "type": "select",
         "options": ["diario", "semanal", "mensual"],
         "default": "diario"
       }
     ]
   }
   ```
3. **Escribe la lógica en `entrypoint.py`**:
   - Lee los inputs con `parse_agent_input()`.
   - Emite logs en tiempo real con `print(..., flush=True)`.
   - Emite el entregable final con el delimitador:
     ```python
     emit_output({"metric": 100, "status": "ok"})
     ```
4. **¡Listo!** El orquestador detectará automáticamente tu nuevo agente sin necesidad de reiniciar el servidor.

---

## 📡 Especificación de la API

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Estado del backend y versión |
| `GET` | `/api/agents` | Lista de agentes descubiertos y su estado actual (`idle`, `running`) |
| `GET` | `/api/agents/{id}` | Manifiesto y detalles de un agente específico |
| `POST` | `/api/agents/{id}/run` | Inicia la ejecución asíncrona inyectando los inputs |
| `GET` | `/api/executions/{id}` | Resumen y resultado final de la ejecución |
| `GET` | `/api/executions/{id}/logs` | Historial de logs acumulados en formato JSON |
| `GET` | `/api/executions/{id}/events` | **SSE Stream** (`text/event-stream`) de eventos `log`, `status` y `output` |
| `POST` | `/api/executions/{id}/stop` | Envía señal para cancelar y detener el subproceso |

---

## 🚢 Despliegue en Google Cloud Run

Para construir y desplegar en Cloud Run con un solo comando:

```bash
# 1. Configurar tu proyecto de GCP
gcloud config set project TU_PROYECTO_ID

# 2. Compilar y desplegar con Cloud Build y Cloud Run
gcloud run deploy duckboss-platform \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 1800
```
Cloud Run compilará el `Dockerfile` multi-stage, empaquetará la UI y el orquestador FastAPI, y te entregará una URL HTTPS segura con soporte nativo para streaming SSE.
