import json
import datetime
import aiosqlite
from typing import List, Dict, Any, Optional
from app.core.config import settings

INIT_SQL = """
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    squad TEXT NOT NULL,
    role TEXT NOT NULL,
    description TEXT NOT NULL,
    model_provider TEXT NOT NULL,
    model_name TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'idle',
    tools TEXT NOT NULL DEFAULT '[]',
    avatar TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS executions (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    prompt TEXT NOT NULL,
    status TEXT NOT NULL,
    result TEXT,
    created_at TEXT NOT NULL,
    finished_at TEXT,
    FOREIGN KEY(agent_id) REFERENCES agents(id)
);

CREATE TABLE IF NOT EXISTS execution_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    execution_id TEXT NOT NULL,
    step_number INTEGER NOT NULL,
    step_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT DEFAULT '{}',
    timestamp TEXT NOT NULL,
    FOREIGN KEY(execution_id) REFERENCES executions(id)
);

CREATE TABLE IF NOT EXISTS interventions (
    id TEXT PRIMARY KEY,
    execution_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    title TEXT NOT NULL,
    reason TEXT NOT NULL,
    proposed_action TEXT NOT NULL,
    context_data TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending',
    user_response TEXT,
    created_at TEXT NOT NULL,
    resolved_at TEXT,
    FOREIGN KEY(execution_id) REFERENCES executions(id),
    FOREIGN KEY(agent_id) REFERENCES agents(id)
);

CREATE TABLE IF NOT EXISTS user_preferences (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    updated_at TEXT NOT NULL
);
"""

DEFAULT_AGENTS = [
    {
        "id": "executive_assistant",
        "name": "Asistente Ejecutivo",
        "squad": "executive",
        "role": "Chief of Staff & Automatización de Rutina",
        "description": "Gestiona calendario, prioriza inbox clasificando mails importantes vs basura y ejecuta recordatorios de pago para clientes con saldos vencidos.",
        "model_provider": "gemini",
        "model_name": "gemini-2.5-flash",
        "system_prompt": "Eres el Asistente Ejecutivo personal de DuckBoss. Tu misión es organizar la agenda, filtrar el correo priorizando VIPs y mantener las cuentas al día cobrando con tacto y firmeza. Ante acciones sensibles (enviar correos externos o cobrar), debes consultar y solicitar autorización previa al usuario.",
        "status": "idle",
        "tools": json.dumps([
            "list_upcoming_events", "create_calendar_event",
            "list_inbox_emails", "classify_and_triage_email", "delete_or_archive_spam",
            "list_debtor_clients", "generate_payment_reminder", "send_payment_reminder_email"
        ]),
        "avatar": "briefcase"
    },
    {
        "id": "cybersecurity_auditor",
        "name": "Auditor de Ciberseguridad",
        "squad": "tech",
        "role": "SecOps & Guardián de Código",
        "description": "Analiza repositorios en busca de credenciales expuestas, vulnerabilidades OWASP, inyecciones SQL y configuraciones débiles en Docker y Cloud.",
        "model_provider": "gemini",
        "model_name": "gemini-2.5-flash",
        "system_prompt": "Eres un experto en Ciberseguridad Ofensiva y Defensiva. Analizas código fuente, librerías y contratos de API. Si encuentras un fallo crítico, detallas el impacto CVE, la línea afectada y la mitigación precisa.",
        "status": "idle",
        "tools": json.dumps(["scan_code_vulnerabilities", "audit_dependencies", "check_secret_leaks"]),
        "avatar": "shield-check"
    },
    {
        "id": "ux_architect",
        "name": "Arquitecto de Software & UX",
        "squad": "tech",
        "role": "Arquitectura y Calidad de Experiencia",
        "description": "Supervisa la arquitectura distribuida, evalúa patrones de diseño y audita la accesibilidad y usabilidad de las interfaces de usuario.",
        "model_provider": "gemini",
        "model_name": "gemini-2.5-flash",
        "system_prompt": "Eres un Arquitecto de Software Principal y Consultor Senior de UX/UI. Guías las decisiones de escalabilidad, microservicios vs monolitos modulares y garantizas interfaces limpias y sin fricción.",
        "status": "idle",
        "tools": json.dumps(["evaluate_architecture", "audit_ui_ux", "recommend_design_system"]),
        "avatar": "layout"
    },
    {
        "id": "financial_advisor",
        "name": "Asesor Financiero y Operaciones",
        "squad": "business",
        "role": "CFO & Analista Operacional",
        "description": "Monitorea flujos de caja, márgenes de ganancia, optimización de costos en la nube y modelado de escenarios financieros.",
        "model_provider": "gemini",
        "model_name": "gemini-2.5-flash",
        "system_prompt": "Eres el Asesor Financiero Estratégico. Analizas balances, presupuestos y gastos operativos para maximizar el margen de utilidad y evitar sorpresas de liquidez.",
        "status": "idle",
        "tools": json.dumps(["calculate_cashflow_burn", "forecast_runway", "analyze_unit_economics"]),
        "avatar": "trending-up"
    },
    {
        "id": "growth_marketer",
        "name": "Estratega de Growth & Marketing",
        "squad": "business",
        "role": "Marketing Digital & Adquisición",
        "description": "Diseña campañas de atracción, optimiza copys de venta, analiza tasas de conversión y estructura embudos comerciales.",
        "model_provider": "gemini",
        "model_name": "gemini-2.5-flash",
        "system_prompt": "Eres un estratega de Marketing Digital enfocado en métricas reales de conversión, posicionamiento de marca y copywriting persuasivo.",
        "status": "idle",
        "tools": json.dumps(["create_campaign_copy", "audit_funnel_conversion", "analyze_seo_keywords"]),
        "avatar": "sparkles"
    }
]

DEFAULT_PREFERENCES = [
    {
        "key": "user_name",
        "value": "Santi",
        "category": "profile",
        "description": "Nombre con el que los agentes se dirigen a ti"
    },
    {
        "key": "timezone",
        "value": "America/Argentina/Buenos_Aires",
        "category": "schedule",
        "description": "Zona horaria principal para la gestión de calendario"
    },
    {
        "key": "working_hours",
        "value": "09:00 - 18:00 (Lunes a Viernes)",
        "category": "schedule",
        "description": "Horarios disponibles para agendar reuniones de trabajo"
    },
    {
        "key": "collection_grace_period_days",
        "value": "5",
        "category": "finance",
        "description": "Días de gracia antes de emitir un primer recordatorio de pago"
    },
    {
        "key": "collection_tone",
        "value": "Cortés y cooperativo para atrasos de 1 a 10 días; firme y con aviso de suspensión de servicio para atrasos mayores a 15 días.",
        "category": "finance",
        "description": "Tono de comunicación para los correos de cobranzas"
    },
    {
        "key": "vip_senders",
        "value": "inversores, clientes premium, socios fundadores",
        "category": "email",
        "description": "Remitentes que nunca deben enviarse a spam y siempre generan notificación"
    }
]

async def get_db() -> aiosqlite.Connection:
    conn = await aiosqlite.connect(settings.db_path)
    conn.row_factory = aiosqlite.Row
    return conn

async def init_db():
    async with aiosqlite.connect(settings.db_path) as db:
        await db.executescript(INIT_SQL)
        await db.commit()
        
        # Check if agents are seeded
        cursor = await db.execute("SELECT COUNT(*) FROM agents")
        row = await cursor.fetchone()
        if row and row[0] == 0:
            now = datetime.datetime.now(datetime.timezone.utc).isoformat()
            for agent in DEFAULT_AGENTS:
                await db.execute("""
                    INSERT INTO agents (id, name, squad, role, description, model_provider, model_name, system_prompt, status, tools, avatar, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    agent["id"], agent["name"], agent["squad"], agent["role"], agent["description"],
                    agent["model_provider"], agent["model_name"], agent["system_prompt"], agent["status"],
                    agent["tools"], agent["avatar"], now
                ))
            await db.commit()
            
        # Check if preferences are seeded
        cursor = await db.execute("SELECT COUNT(*) FROM user_preferences")
        row = await cursor.fetchone()
        if row and row[0] == 0:
            now = datetime.datetime.now(datetime.timezone.utc).isoformat()
            for pref in DEFAULT_PREFERENCES:
                await db.execute("""
                    INSERT INTO user_preferences (key, value, category, description, updated_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (pref["key"], pref["value"], pref["category"], pref["description"], now))
            await db.commit()
