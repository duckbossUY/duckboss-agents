import datetime
from mcp.server.mcpserver import MCPServer

mcp = MCPServer("Executive Tools")

STATE = {
    "calendar_events": [
        {
            "id": "evt_001",
            "title": "Revisión de Arquitectura DuckBoss v2",
            "start": "2026-10-06T11:00:00-03:00",
            "end": "2026-10-06T12:00:00-03:00",
            "attendees": ["santi@example.com", "tech-lead@duckboss.io"],
            "location": "Google Meet"
        },
        {
            "id": "evt_002",
            "title": "Demo y Validación de UX con Usuarios",
            "start": "2026-10-07T15:30:00-03:00",
            "end": "2026-10-07T16:15:00-03:00",
            "attendees": ["santi@example.com", "design-team@duckboss.io"],
            "location": "Google Meet"
        },
        {
            "id": "evt_003",
            "title": "Comité de Finanzas y Control de Morosidad",
            "start": "2026-10-08T10:00:00-03:00",
            "end": "2026-10-08T11:00:00-03:00",
            "attendees": ["santi@example.com", "cfo@duckboss.io"],
            "location": "Sala Principal"
        }
    ],
    "emails": [
        {
            "id": "mail_vip_01",
            "sender": "investors@venturehorizon.vc",
            "subject": "Propuesta de Coinversión y Expansión Serie A",
            "date": "2026-10-04T14:20:00-03:00",
            "snippet": "Hola Santi, revisamos la tracción del ecosistema de agentes y queremos agendar una llamada esta semana...",
            "category": "VIP",
            "is_read": False
        },
        {
            "id": "mail_notif_02",
            "sender": "billing@googlecloud.com",
            "subject": "Notificación de Facturación Cloud Run - Ciclo Septiembre",
            "date": "2026-10-04T09:15:00-03:00",
            "snippet": "Su factura mensual de Google Cloud Platform está disponible para descarga por un total de $42.50 USD...",
            "category": "Operacional",
            "is_read": False
        },
        {
            "id": "mail_spm_03",
            "sender": "crypto-profits@instant-returns-daily.net",
            "subject": "Gana 500% diario con IA de Trading Automático!",
            "date": "2026-10-04T07:45:00-03:00",
            "snippet": "Descubre el secreto que los bancos no quieren que sepas sobre algoritmos cuánticos...",
            "category": "Spam",
            "is_read": False
        }
    ],
    "debtor_clients": [
        {
            "client_id": "cli_001",
            "client_name": "TechCorp Solutions",
            "contact_email": "pagos@techcorp.io",
            "invoice_id": "INV-2026-089",
            "amount_due": 4850.0,
            "currency": "USD",
            "due_date": "2026-09-16",
            "days_overdue": 18,
            "status": "overdue",
            "notes": "Cliente corporativo habitual. Suele demorar aprobaciones internas pero nunca dejó de pagar."
        },
        {
            "client_id": "cli_002",
            "client_name": "Digital Vanguard Media",
            "contact_email": "facturacion@vanguardmedia.co",
            "invoice_id": "INV-2026-094",
            "amount_due": 1600.0,
            "currency": "USD",
            "due_date": "2026-09-28",
            "days_overdue": 6,
            "status": "grace_period",
            "notes": "Atraso menor, dentro del rango tolerable."
        },
        {
            "client_id": "cli_003",
            "client_name": "Logix Logistics Latam",
            "contact_email": "contabilidad@logixlatam.com",
            "invoice_id": "INV-2026-072",
            "amount_due": 3200.0,
            "currency": "USD",
            "due_date": "2026-08-30",
            "days_overdue": 35,
            "status": "critical",
            "notes": "Mora prolongada. Requiere intimación formal."
        }
    ]
}

@mcp.tool()
async def list_upcoming_events(days_ahead: int = 7) -> dict:
    """Obtiene la lista de compromisos y reuniones programadas en Google Calendar."""
    return {
        "status": "success",
        "count": len(STATE["calendar_events"]),
        "events": STATE["calendar_events"]
    }

@mcp.tool()
async def create_calendar_event(title: str, start_time: str, end_time: str, description: str) -> dict:
    """Agrega una nueva reunión al calendario con horarios y asistentes especificados."""
    new_event = {
        "id": f"evt_{len(STATE['calendar_events']) + 1:03d}",
        "title": title or "Reunión sin título",
        "start": start_time,
        "end": end_time,
        "attendees": ["santi@example.com"],
        "location": description or "Google Meet"
    }
    STATE["calendar_events"].append(new_event)
    return {"status": "success", "created_event": new_event}

@mcp.tool()
async def list_inbox_emails(unread_only: bool = True, limit: int = 10) -> dict:
    """Lista correos entrantes de la bandeja de Gmail."""
    res = [e for e in STATE["emails"] if not unread_only or not e["is_read"]][:limit]
    return {"status": "success", "count": len(res), "emails": res}

@mcp.tool()
async def classify_and_triage_email(email_id: str, category: str, reason: str) -> dict:
    """Clasifica un correo como VIP, Operacional o Spam con una justificación."""
    for e in STATE["emails"]:
        if e["id"] == email_id:
            e["category"] = category
            e["is_read"] = True
            return {"status": "success", "updated_email": e}
    return {"status": "error", "message": f"Email {email_id} no encontrado"}

@mcp.tool()
async def delete_or_archive_spam(email_id: str) -> dict:
    """Elimina o manda a la papelera un correo detectado como spam o publicitario."""
    STATE["emails"] = [e for e in STATE["emails"] if e["id"] != email_id]
    return {"status": "success", "message": f"Correo basura {email_id} eliminado exitosamente"}

@mcp.tool()
async def list_debtor_clients(min_overdue_days: int = 1) -> dict:
    """Consulta la base de cuentas por cobrar y clientes con facturas impagas y días de mora."""
    debtors = [c for c in STATE["debtor_clients"] if c["days_overdue"] >= min_overdue_days]
    return {
        "status": "success",
        "count": len(debtors),
        "total_overdue_usd": sum(c["amount_due"] for c in debtors),
        "debtors": debtors
    }

@mcp.tool()
async def generate_payment_reminder(client_id: str, invoice_id: str, amount_due: float, days_overdue: int, tone: str) -> dict:
    """Genera el borrador de un comunicado o correo de intimación de pago para un cliente en mora."""
    return {
        "status": "success",
        "draft": {
            "client_id": client_id,
            "invoice_id": invoice_id,
            "amount_due": amount_due,
            "days_overdue": days_overdue,
            "subject": f"Aviso de Factura Vencida: {invoice_id} - DuckBoss",
            "preview": f"Estimado cliente,\nLe recordamos que registra un saldo vencido de ${amount_due} con {days_overdue} días de mora..."
        }
    }

@mcp.tool()
async def send_payment_reminder_email(client_id: str, invoice_id: str, recipient_email: str, reminder_body: str) -> dict:
    """Envía el correo electrónico de cobro directamente al cliente deudor. ACCIÓN SENSIBLE CON IMPACTO COMERCIAL."""
    for c in STATE["debtor_clients"]:
        if c["client_id"] == client_id:
            c["last_notice_sent"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
            c["status"] = "notice_delivered"
    return {
        "status": "delivered",
        "recipient": recipient_email,
        "invoice_id": invoice_id,
        "delivered_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

if __name__ == "__main__":
    mcp.run()
