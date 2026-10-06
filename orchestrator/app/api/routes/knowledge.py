import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.db.database import get_db
from app.memory.chroma_service import chroma_memory

router = APIRouter(prefix="/api/knowledge", tags=["Knowledge & Memory"])

class DocumentCreate(BaseModel):
    title: str
    content: str
    category: Optional[str] = "general"

class PreferenceUpdate(BaseModel):
    key: str
    value: str
    category: Optional[str] = "general"
    description: Optional[str] = ""

@router.get("/documents")
async def list_documents():
    return chroma_memory.list_documents()

@router.post("/documents")
async def create_document(doc: DocumentCreate):
    if not doc.title.strip() or not doc.content.strip():
        raise HTTPException(status_code=400, detail="El título y el contenido no pueden estar vacíos")
    
    doc_id = chroma_memory.add_document(
        title=doc.title,
        content=doc.content,
        category=doc.category or "general"
    )
    return {"status": "success", "doc_id": doc_id, "title": doc.title}

@router.get("/preferences")
async def list_preferences():
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM user_preferences ORDER BY category, key")
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        await db.close()

@router.post("/preferences")
async def save_preference(pref: PreferenceUpdate):
    db = await get_db()
    try:
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        await db.execute("""
            INSERT INTO user_preferences (key, value, category, description, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET
                value = excluded.value,
                category = excluded.category,
                description = excluded.description,
                updated_at = excluded.updated_at
        """, (pref.key, pref.value, pref.category, pref.description, now))
        await db.commit()
        return {"status": "success", "key": pref.key}
    finally:
        await db.close()
