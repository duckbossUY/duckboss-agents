import os
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
WORKSPACE_ROOT = BASE_DIR.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

CHROMA_DIR = DATA_DIR / "chroma"
CHROMA_DIR.mkdir(parents=True, exist_ok=True)

UPLOADS_DIR = DATA_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = DATA_DIR / "duckboss.sqlite3"
WEB_UI_DIST = WORKSPACE_ROOT / "web-ui" / "dist"

class Settings(BaseModel):
    app_name: str = "DuckBoss Agent Platform"
    app_version: str = "2.0.0"
    base_dir: Path = BASE_DIR
    workspace_root: Path = WORKSPACE_ROOT
    web_ui_dist: Path = WEB_UI_DIST
    data_dir: Path = DATA_DIR
    chroma_dir: Path = CHROMA_DIR
    uploads_dir: Path = UPLOADS_DIR
    db_path: Path = DB_PATH
    
    # LLM API Keys
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    
    # Defaults
    default_model_provider: str = os.getenv("DEFAULT_MODEL_PROVIDER", "gemini")
    default_gemini_model: str = os.getenv("DEFAULT_GEMINI_MODEL", "gemini-2.5-flash")
    default_anthropic_model: str = os.getenv("DEFAULT_ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
    default_openai_model: str = os.getenv("DEFAULT_OPENAI_MODEL", "gpt-4o")

settings = Settings()
