from fastapi import APIRouter
from app.mcp.builtin_servers.executive_tools import STATE

router = APIRouter(prefix="/api/executive", tags=["Executive Assistant Tools"])

@router.get("/calendar")
async def get_calendar_events():
    return {"events": STATE["calendar_events"]}

@router.get("/emails")
async def get_inbox_emails():
    return {"emails": STATE["emails"]}

@router.get("/debtors")
async def get_debtors():
    debtors = STATE["debtor_clients"]
    total = sum(d["amount_due"] for d in debtors)
    return {
        "debtors": debtors,
        "total_overdue": total,
        "critical_count": sum(1 for d in debtors if d["days_overdue"] > 15)
    }
