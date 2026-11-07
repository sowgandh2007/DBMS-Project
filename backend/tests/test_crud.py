"""
Comprehensive CRUD & Safety Constraint Tests
Verifies full CRUD operations, validation, foreign key constraints,
and safety guards across all entities.
"""

import sys
from pathlib import Path
import pytest

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app import create_app

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

class TestProductCRUD:
    def test_product_update_and_validation(self, client):
        # 1. Update product with invalid negative price -> 400
        res = client.put('/api/products/101', json={'unit_price': -50})
        assert res.status_code == 400
        assert 'negative' in res.get_json()['message'].lower()

        # 2. Update product successfully
        res = client.put('/api/products/101', json={
            'product_name': 'Wireless Mouse Updated',
            'unit_price': 520.00,
            'reorder_level': 12
        })
        assert res.status_code == 200
        data = res.get_json()
        assert data['success'] is True
        assert data['data']['product_name'] == 'Wireless Mouse Updated'
        assert float(data['data']['unit_price']) == 520.00

        # Reset back
        client.put('/api/products/101', json={'product_name': 'Wireless Mouse', 'unit_price': 495.00, 'reorder_level': 10})

    def test_product_complete_delete_and_lifecycle(self, client):
        # 1. Create a product with custom selling price
        create_res = client.post('/api/products', json={
            'product_name': 'Test Mechanical Numpad',
            'sku': 'TEST-NUM-999',
            'unit_price': 750.00,
            'category_id': 1
        })
        assert create_res.status_code == 201
        new_prod = create_res.get_json()['data']
        prod_id = new_prod['product_id']
        assert float(new_prod['unit_price']) == 750.00

        # 2. Verify search returns the exact selling price (750.00)
        search_res = client.get(f'/api/products?search=TEST-NUM-999')
        assert search_res.status_code == 200
        found = search_res.get_json()['data']
        assert len(found) >= 1
        assert float(found[0]['unit_price']) == 750.00

        # 3. Completely delete product from database
        del_res = client.delete(f'/api/products/{prod_id}')
        assert del_res.status_code == 200
        assert del_res.get_json()['success'] is True

        # 4. Verify product is completely removed from database (no lingering row)
        verify_res = client.get(f'/api/products?search=TEST-NUM-999')
        assert len(verify_res.get_json()['data']) == 0

        # 5. Re-entering a product with the same SKU now succeeds with no constraint conflict!
        recreate_res = client.post('/api/products', json={
            'product_name': 'Test Mechanical Numpad Reborn',
            'sku': 'TEST-NUM-999',
            'unit_price': 800.00,
            'category_id': 1
        })
        assert recreate_res.status_code == 201
        recreated_id = recreate_res.get_json()['data']['product_id']

        # Clean up
        client.delete(f'/api/products/{recreated_id}')

class TestCategoryCRUD:
    def test_category_lifecycle_and_foreign_key_guard(self, client):
        # 1. Create a temporary category
        create_res = client.post('/api/categories', json={'category_name': 'Test New Category'})
        assert create_res.status_code == 201
        new_cat = create_res.get_json()['data']
        cat_id = new_cat['category_id']

        # 2. Edit category
        edit_res = client.put(f'/api/categories/{cat_id}', json={'category_name': 'Test Category Renamed'})
        assert edit_res.status_code == 200
        assert edit_res.get_json()['data']['category_name'] == 'Test Category Renamed'

        # 3. Delete empty category -> should succeed (200)
        del_res = client.delete(f'/api/categories/{cat_id}')
        assert del_res.status_code == 200

        # 4. Attempt to delete Category 1 (Electronics) which has products -> must be blocked with 409
        del_conflict = client.delete('/api/categories/1')
        assert del_conflict.status_code == 409
        assert 'referenced by' in del_conflict.get_json()['message'].lower()

    def test_category_validation(self, client):
        # Empty name -> 400
        res = client.post('/api/categories', json={'category_name': ''})
        assert res.status_code == 400

class TestSupplierCRUD:
    def test_supplier_lifecycle_and_po_guard(self, client):
        # 1. Create temporary supplier
        create_res = client.post('/api/suppliers', json={
            'supplier_name': 'Apex Wholesale Ltd',
            'email': 'orders@apexwholesale.com'
        })
        assert create_res.status_code == 201
        sup_id = create_res.get_json()['data']['supplier_id']

        # 2. Update supplier
        edit_res = client.put(f'/api/suppliers/{sup_id}', json={
            'email': 'support@apexwholesale.com'
        })
        assert edit_res.status_code == 200
        assert edit_res.get_json()['data']['email'] == 'support@apexwholesale.com'

        # 3. Delete supplier with no purchase orders -> should succeed
        del_res = client.delete(f'/api/suppliers/{sup_id}')
        assert del_res.status_code == 200

        # 4. Attempt to delete Supplier 1 which has purchase orders -> must be blocked with 409
        del_conflict = client.delete('/api/suppliers/1')
        assert del_conflict.status_code == 409
        assert 'purchase order' in del_conflict.get_json()['message'].lower()

class TestRackAndShelfCRUD:
    def test_rack_and_shelf_lifecycle_and_assignment_guard(self, client):
        # 1. Create temporary rack
        create_res = client.post('/api/racks', json={
            'rack_code': 'R-TEST99',
            'aisle': 'Z',
            'shelves_count': 1
        })
        assert create_res.status_code == 201
        rack_id = create_res.get_json()['data']['rack_id']

        # 2. Add shelf to rack
        shelf_res = client.post('/api/shelves', json={
            'rack_id': rack_id,
            'shelf_number': 'S9'
        })
        assert shelf_res.status_code == 201
        shelf_id = shelf_res.get_json()['data']['shelf_id']

        # 3. Delete shelf (no products assigned) -> 200
        del_shelf = client.delete(f'/api/shelves/{shelf_id}')
        assert del_shelf.status_code == 200

        # 4. Delete rack (empty) -> 200
        del_rack = client.delete(f'/api/racks/{rack_id}')
        assert del_rack.status_code == 200

        # 5. Attempt to delete Rack 1 (which holds active products) -> 409
        conflict_res = client.delete('/api/racks/1')
        assert conflict_res.status_code == 409
        assert 'assigned' in conflict_res.get_json()['message'].lower()

class TestPurchaseOrderAndSalesSafety:
    def test_received_po_cannot_be_deleted_or_modified(self, client):
        # PO 201 is 'Received' -> attempting to delete must be blocked with 400
        del_res = client.delete('/api/purchases/201')
        assert del_res.status_code == 400
        assert 'corrupt' in del_res.get_json()['message'].lower()

        # Attempting to change status of Received PO must also be blocked
        put_res = client.put('/api/purchases/201', json={'status': 'Pending'})
        assert put_res.status_code == 400
        assert 'already been' in put_res.get_json()['message'].lower()

    def test_completed_sale_deletion_guard(self, client):
        # Sale 301 is a confirmed fiscal transaction -> delete must be blocked with 400
        del_res = client.delete('/api/sales/301')
        assert del_res.status_code == 400
        assert 'integrity' in del_res.get_json()['message'].lower() or 'confirmed' in del_res.get_json()['message'].lower()
