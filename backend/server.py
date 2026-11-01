"""
Production WSGI Server Runner (Waitress)
Runs the Retail Inventory Flask app reliably in the background on Windows without console dependency.
"""
import os
import sys
from pathlib import Path

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app import app
from config import Config
from waitress import serve

if __name__ == '__main__':
    port = Config.PORT or 5000
    serve(app, host='0.0.0.0', port=port, threads=6)
