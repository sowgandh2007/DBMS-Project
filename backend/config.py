"""
Application Configuration Module
Loads settings and database credentials from environment variables using python-dotenv.
Never hardcodes passwords or sensitive keys.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory for backend
BASE_DIR = Path(__file__).resolve().parent

# Load .env file from backend directory if present, otherwise from parent
env_path = BASE_DIR / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

class Config:
    """Application configuration parameters."""
    
    # Supabase PostgreSQL Connection String
    # Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
    DATABASE_URL = os.getenv('DATABASE_URL')
    
    # Optional individual PostgreSQL connection parameters fallback
    PGHOST = os.getenv('PGHOST')
    PGPORT = os.getenv('PGPORT', '5432')
    PGDATABASE = os.getenv('PGDATABASE', 'postgres')
    PGUSER = os.getenv('PGUSER', 'postgres')
    PGPASSWORD = os.getenv('PGPASSWORD')
    PGSSLMODE = os.getenv('PGSSLMODE', 'require')
    
    # Server settings
    PORT = int(os.getenv('PORT', 5000))
    DEBUG = os.getenv('FLASK_DEBUG', '1').lower() in ('1', 'true', 'yes')
    
    # CORS Origin configuration
    # By default allows Vite frontend running on localhost:5173 or localhost:3000
    CORS_ORIGINS = [
        origin.strip() 
        for origin in os.getenv('CORS_ORIGIN', '*,null,http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000').split(',')
        if origin.strip()
    ]
    
    # Queries directory path
    QUERIES_DIR = BASE_DIR / 'queries'

    @classmethod
    def get_connection_info(cls):
        """Returns connection parameter or URI for psycopg2."""
        if cls.DATABASE_URL:
            return cls.DATABASE_URL
        if cls.PGHOST and cls.PGPASSWORD:
            return {
                'host': cls.PGHOST,
                'port': cls.PGPORT,
                'dbname': cls.PGDATABASE,
                'user': cls.PGUSER,
                'password': cls.PGPASSWORD,
                'sslmode': cls.PGSSLMODE
            }
        return None
