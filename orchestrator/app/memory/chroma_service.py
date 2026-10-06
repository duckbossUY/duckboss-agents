import uuid
import datetime
from typing import List, Dict, Any, Optional
import chromadb
from app.core.config import settings

class ChromaMemoryService:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=str(settings.chroma_dir))
        self.docs_collection = self.client.get_or_create_collection(
            name="vault_documents",
            metadata={"description": "Documentos subidos y políticas de la empresa"}
        )
        self.corrections_collection = self.client.get_or_create_collection(
            name="user_corrections",
            metadata={"description": "Correcciones y feedback del usuario en intervenciones"}
        )

    def add_document(self, title: str, content: str, category: str = "general") -> str:
        doc_id = str(uuid.uuid4())
        # Split into manageable chunks (simple chunking by paragraphs / ~500 chars)
        chunks = [c.strip() for c in content.split("\n\n") if c.strip()]
        if not chunks:
            chunks = [content]

        ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
        metadatas = [
            {
                "doc_id": doc_id,
                "title": title,
                "category": category,
                "chunk_index": i,
                "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            for i in range(len(chunks))
        ]
        
        self.docs_collection.add(
            ids=ids,
            documents=chunks,
            metadatas=metadatas
        )
        return doc_id

    def query_relevant_documents(self, query: str, n_results: int = 3) -> List[Dict[str, Any]]:
        count = self.docs_collection.count()
        if count == 0:
            return []
        
        limit = min(n_results, count)
        results = self.docs_collection.query(
            query_texts=[query],
            n_results=limit
        )
        
        output = []
        if results and results.get("documents") and len(results["documents"]) > 0:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(docs)
            for doc, meta in zip(docs, metas):
                output.append({
                    "content": doc,
                    "title": meta.get("title", "Sin título"),
                    "category": meta.get("category", "general"),
                    "doc_id": meta.get("doc_id", "")
                })
        return output

    def add_user_correction(self, agent_id: str, context: str, correction: str) -> str:
        corr_id = str(uuid.uuid4())
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        full_text = f"Contexto de la intervención: {context}\nInstrucción o corrección del usuario: {correction}"
        self.corrections_collection.add(
            ids=[corr_id],
            documents=[full_text],
            metadatas=[{
                "agent_id": agent_id,
                "correction": correction,
                "created_at": now
            }]
        )
        return corr_id

    def query_corrections(self, agent_id: str, query: str, n_results: int = 2) -> List[Dict[str, Any]]:
        count = self.corrections_collection.count()
        if count == 0:
            return []
            
        limit = min(n_results, count)
        results = self.corrections_collection.query(
            query_texts=[query],
            n_results=limit,
            where={"agent_id": agent_id} if agent_id else None
        )
        
        output = []
        if results and results.get("documents") and len(results["documents"]) > 0:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(docs)
            for doc, meta in zip(docs, metas):
                output.append({
                    "text": doc,
                    "correction": meta.get("correction", ""),
                    "agent_id": meta.get("agent_id", "")
                })
        return output

    def list_documents(self) -> List[Dict[str, Any]]:
        # Get distinct documents
        data = self.docs_collection.get()
        seen = {}
        if data and data.get("metadatas"):
            for meta in data["metadatas"]:
                doc_id = meta.get("doc_id")
                if doc_id and doc_id not in seen:
                    seen[doc_id] = {
                        "id": doc_id,
                        "title": meta.get("title"),
                        "category": meta.get("category"),
                        "created_at": meta.get("created_at")
                    }
        return list(seen.values())

chroma_memory = ChromaMemoryService()
