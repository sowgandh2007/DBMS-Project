"""
Backend Automated Unit & Integration Tests
Tests Flask routes, SQL query file loading, parameter adapter, and error handling.
"""

import sys
from pathlib import Path
import pytest

# Ensure backend root is in python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app import create_app
from services.query_service import (
    load_query_file,
    adapt_postgresql_placeholders,
    get_sales_summary
)

@pytest.fixture
def client():
    """Create Flask test client."""
    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

class TestSQLQueryFiles:
    """Verifies all required SQL query files exist and are intact."""
    
    def test_query_files_exist(self):
        query_files = [
            '01_product_search.sql',
            '02_low_stock.sql',
            '03_current_stock_location.sql',
            '04_stock_value_by_category.sql',
            '05_purchase_order_summary.sql',
            '06_sales_summary.sql',
            '07_supplier_products.sql',
        ]
        for qf in query_files:
            content = load_query_file(qf)
            assert content is not None
            assert len(content.strip()) > 0
            assert 'SELECT' in content.upper()

    def test_parameter_adapter_mapping(self):
        """Verifies that $1, $2 are translated safely without string concatenation."""
        raw_sql = "WHERE ($3::boolean OR p.is_active = TRUE) AND ($1::text = '' OR pl.name ILIKE $1) AND ($2 IS NULL OR p.category_id = $2)"
        params = ['rice', 2, False]
        
        adapted_sql, param_dict = adapt_postgresql_placeholders(raw_sql, params)
        
        # Verify placeholders replaced
        assert '$1' not in adapted_sql
        assert '$2' not in adapted_sql
        assert '$3' not in adapted_sql
        assert '%(_p_1)s' in adapted_sql
        assert '%(_p_2)s' in adapted_sql
        assert '%(_p_3)s' in adapted_sql
        
        # Verify dictionary mapping
        assert param_dict['_p_1'] == 'rice'
        assert param_dict['_p_2'] == 2
        assert param_dict['_p_3'] is False

class TestFlaskEndpoints:
    """Tests API routes and expected HTTP response formats."""
    
    def test_root_endpoint(self, client):
        response = client.get('/')
        assert response.status_code == 200
        data = response.get_json()
        assert 'name' in data
        assert 'endpoints' in data
        assert data['endpoints']['products_search'] == '/api/products'

    def test_health_endpoint(self, client):
        response = client.get('/api/health')
        assert response.status_code in (200, 503)
        data = response.get_json()
        assert data['status'] == 'online'
        assert 'database' in data
        assert 'connected' in data['database']

    def test_404_handler(self, client):
        response = client.get('/api/non-existent-endpoint')
        assert response.status_code == 404
        data = response.get_json()
        assert data['success'] is False
        assert 'not found' in data['message'].lower()

    def test_graceful_database_connection_handling(self, client):
        """
        When database credentials are not yet configured, endpoints should return 503
        with clear JSON error messages rather than unhandled server crashes (500).
        """
        endpoints = [
            '/api/products',
            '/api/inventory',
            '/api/inventory/low-stock',
            '/api/reports/stock-value',
            '/api/purchases',
            '/api/reports/sales',
            '/api/suppliers',
            '/api/dashboard/stats'
        ]
        for ep in endpoints:
            response = client.get(ep)
            assert response.status_code in (200, 503)
            data = response.get_json()
            assert 'success' in data
            if response.status_code == 503:
                assert 'error' in data
                assert 'Connection' in data['error'] or 'Database' in data['error']
