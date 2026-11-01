"""
Root WSGI Entry Point for Cloud Deployment (Render / Railway / Vercel)
Redirects cleanly to the backend application module.
"""
import sys
import importlib.util
from pathlib import Path

# Add backend directory to sys.path so route & config imports resolve cleanly
backend_dir = Path(__file__).resolve().parent / 'backend'
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

spec = importlib.util.spec_from_file_location("backend_app", backend_dir / "app.py")
backend_module = importlib.util.module_from_spec(spec)
sys.modules["backend_app"] = backend_module
spec.loader.exec_module(backend_module)

app = backend_module.app

if __name__ == '__main__':
    from config import Config
    app.run(host='0.0.0.0', port=Config.PORT, debug=Config.DEBUG)
