"""
Database Connection & Execution Module
Manages direct PostgreSQL connections to Supabase using psycopg2.
Executes raw SQL queries directly without an ORM.
"""

import logging
from contextlib import contextmanager
from decimal import Decimal
from datetime import date, datetime
import psycopg2
from psycopg2.extras import RealDictCursor
from config import Config

logger = logging.getLogger(__name__)

def serialize_row(row):
    """
    Convert PostgreSQL Decimal, Date, and DateTime objects
    into standard JSON-serializable Python data types.
    """
    if not isinstance(row, dict):
        return row
    serialized = {}
    for key, val in row.items():
        if isinstance(val, Decimal):
            # Convert to float or int for clean JSON numbers
            serialized[key] = float(val) if '.' in str(val) else int(val)
        elif isinstance(val, (date, datetime)):
            serialized[key] = val.isoformat()
        else:
            serialized[key] = val
    return serialized

def serialize_rows(rows):
    """Serialize a list of database rows."""
    if not rows:
        return []
    return [serialize_row(r) for r in rows]

def get_connection():
    """
    Create a new direct database connection using psycopg2.
    Appropriate for Supabase PostgreSQL with SSL support.
    """
    conn_info = Config.get_connection_info()
    if not conn_info:
        raise ConnectionError(
            "Database connection parameters are not configured. "
            "Please set DATABASE_URL in backend/.env with your Supabase connection string."
        )
    
    if isinstance(conn_info, str):
        # Full URI
        return psycopg2.connect(conn_info)
    else:
        # Dict of parameters
        return psycopg2.connect(**conn_info)

@contextmanager
def get_db_cursor(commit=False):
    """
    Context manager that yields a RealDictCursor.
    Handles commit/rollback and ensures the connection is closed.
    """
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        yield cursor
        if commit:
            conn.commit()
    except Exception as e:
        if conn and commit:
            conn.rollback()
        raise e
    finally:
        if conn:
            cursor.close()
            conn.close()

def check_connection():
    """
    Check if PostgreSQL database is reachable.
    Returns (status: bool, message: str)
    """
    conn_info = Config.get_connection_info()
    if not conn_info:
        return False, "DATABASE_URL is not set in backend/.env"
    
    try:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT 1 AS health_check;")
            row = cursor.fetchone()
            if row and row['health_check'] == 1:
                return True, "Connected to Supabase PostgreSQL database successfully."
        return False, "Database responded with unexpected result."
    except psycopg2.OperationalError as e:
        error_msg = str(e).strip()
        logger.warning(f"Database connection error: {error_msg}")
        return False, f"Could not connect to Supabase: {error_msg}"
    except Exception as e:
        logger.error(f"Unexpected error testing database connection: {str(e)}")
        return False, f"Database error: {str(e)}"
