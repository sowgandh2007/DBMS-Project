"""
Flask Application Entry Point
Retail Inventory and Rack Management System Backend
Integrates with Supabase PostgreSQL and executes raw parameterized SQL queries.
"""

import logging
from pathlib import Path
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from config import Config
from db import check_connection

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable universal CORS for both browser file:/// (null origin) and Vite dev server
    CORS(app, resources={r"/*": {"origins": "*"}})

    @app.after_request
    def add_cors_headers(response):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
        return response

    from routes.products import products_bp
    from routes.categories import categories_bp
    from routes.inventory import inventory_bp
    from routes.purchases import purchases_bp
    from routes.sales import sales_bp
    from routes.suppliers import suppliers_bp
    from routes.reports import reports_bp
    from routes.dashboard import dashboard_bp
    from routes.racks import racks_bp, shelves_bp

    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(categories_bp, url_prefix='/api/categories')
    app.register_blueprint(inventory_bp, url_prefix='/api/inventory')
    app.register_blueprint(inventory_bp, url_prefix='/api/alerts', name='alerts_alias')
    app.register_blueprint(purchases_bp, url_prefix='/api/purchases')
    app.register_blueprint(purchases_bp, url_prefix='/api/purchase-orders', name='purchase_orders_alias')
    app.register_blueprint(sales_bp, url_prefix='/api/sales')
    app.register_blueprint(suppliers_bp, url_prefix='/api/suppliers')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(racks_bp, url_prefix='/api/racks')
    app.register_blueprint(shelves_bp, url_prefix='/api/shelves')

    # Health check & DB status endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        db_ok, db_message = check_connection()
        return jsonify({
            'status': 'online',
            'database': {
                'connected': db_ok,
                'message': db_message
            },
            'server': {
                'port': Config.PORT,
                'debug': Config.DEBUG
            }
        }), (200 if db_ok else 503)

    # Root welcome / API info or serve standalone app directly
    @app.route('/', methods=['GET'])
    @app.route('/standalone', methods=['GET'])
    @app.route('/dashboard', methods=['GET'])
    def index():
        accept = request.headers.get('Accept', '')
        if 'text/html' in accept or request.path in ('/standalone', '/dashboard'):
            root_dir = Path(__file__).resolve().parent.parent
            standalone_file = root_dir / 'standalone.html'
            if standalone_file.exists():
                return send_from_directory(root_dir, 'standalone.html')

        return jsonify({
            'name': 'Retail Inventory & Rack Management System API',
            'version': '1.0.0',
            'endpoints': {
                'health': '/api/health',
                'products_search': '/api/products',
                'low_stock': '/api/inventory/low-stock',
                'current_inventory': '/api/inventory',
                'stock_value_report': '/api/reports/stock-value',
                'purchases_report': '/api/reports/purchases',
                'sales_report': '/api/reports/sales',
                'suppliers_report': '/api/reports/suppliers'
            }
        }), 200

    # Global Error Handlers
    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({
            'success': False,
            'error': 'Not Found',
            'message': 'The requested endpoint was not found on this server.'
        }), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            'success': False,
            'error': 'Internal Server Error',
            'message': 'An unexpected server error occurred.'
        }), 500

    return app

app = create_app()

if __name__ == '__main__':
    logger.info(f"Starting Retail Inventory API server on port {Config.PORT}...")
    app.run(host='0.0.0.0', port=Config.PORT, debug=Config.DEBUG)
