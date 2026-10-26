"""
Suppliers API Routes
Maps supplier catalog queries to 07_supplier_products.sql
"""

import logging
from flask import Blueprint, request, jsonify
from services.query_service import (
    get_supplier_products,
    get_suppliers_list,
    create_supplier,
    update_supplier,
    delete_supplier
)

logger = logging.getLogger(__name__)
suppliers_bp = Blueprint('suppliers', __name__)

@suppliers_bp.route('', methods=['GET'])
def list_suppliers_with_products():
    """
    GET /api/suppliers or GET /api/reports/suppliers
    Executes 07_supplier_products.sql
    
    Query Parameters:
      supplier_id (int, optional): Filter by supplier ID
      search / product_search (str, optional): Filter by product name or SKU
    """
    try:
        supplier_id_param = request.args.get('supplier_id')
        supplier_id = int(supplier_id_param) if supplier_id_param and supplier_id_param.isdigit() else None
        
        product_search = request.args.get('search') or request.args.get('product_search') or None
        
        results = get_supplier_products(
            supplier_id=supplier_id,
            product_search=product_search
        )
        
        return jsonify({
            'success': True,
            'count': len(results),
            'filters': {
                'supplier_id': supplier_id,
                'product_search': product_search
            },
            'data': results
        }), 200
        
    except ConnectionError as e:
        return jsonify({
            'success': False,
            'error': 'Database Connection Error',
            'message': str(e)
        }), 503
    except Exception as e:
        logger.error(f"Error fetching supplier products: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Query Execution Error',
            'message': 'Failed to execute supplier products query.'
        }), 500

@suppliers_bp.route('/list', methods=['GET'])
def list_suppliers_directory():
    """
    GET /api/suppliers/list
    Fetch basic supplier directory for dropdown filters.
    """
    try:
        suppliers = get_suppliers_list()
        return jsonify({
            'success': True,
            'count': len(suppliers),
            'data': suppliers
        }), 200
    except Exception as e:
        logger.error(f"Error fetching suppliers list: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Database Error',
            'message': str(e)
        }), 500

@suppliers_bp.route('', methods=['POST'])
def add_supplier():
    """POST /api/suppliers - Register a new supplier."""
    try:
        data = request.get_json() or {}
        new_supplier = create_supplier(data)
        return jsonify({
            'success': True,
            'message': f"Supplier '{new_supplier['supplier_name']}' created successfully.",
            'data': new_supplier
        }), 201
    except ValueError as e:
        return jsonify({'success': False, 'error': 'Validation Error', 'message': str(e)}), 400
    except Exception as e:
        logger.error(f"Error creating supplier: {str(e)}")
        return jsonify({'success': False, 'error': 'Database Error', 'message': str(e)}), 500

@suppliers_bp.route('/<int:supplier_id>', methods=['PUT', 'PATCH'])
def edit_supplier(supplier_id):
    """PUT /api/suppliers/<id> - Update supplier contact details."""
    try:
        data = request.get_json() or {}
        updated = update_supplier(supplier_id, data)
        return jsonify({
            'success': True,
            'message': f"Supplier #{supplier_id} updated successfully.",
            'data': updated
        }), 200
    except ValueError as e:
        status_code = 404 if 'not found' in str(e).lower() else 400
        return jsonify({'success': False, 'error': 'Request Error', 'message': str(e)}), status_code
    except Exception as e:
        logger.error(f"Error updating supplier #{supplier_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Database Error', 'message': str(e)}), 500

@suppliers_bp.route('/<int:supplier_id>', methods=['DELETE'])
def remove_supplier(supplier_id):
    """
    DELETE /api/suppliers/<id> - Delete supplier.
    Checks for purchase order dependencies to ensure transaction integrity.
    """
    try:
        deleted = delete_supplier(supplier_id)
        return jsonify({
            'success': True,
            'message': f"Supplier '{deleted['supplier_name']}' deleted successfully.",
            'data': deleted
        }), 200
    except ValueError as e:
        return jsonify({'success': False, 'error': 'Not Found', 'message': str(e)}), 404
    except PermissionError as e:
        return jsonify({'success': False, 'error': 'Dependency Conflict', 'message': str(e)}), 409
    except Exception as e:
        logger.error(f"Error deleting supplier #{supplier_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Database Error', 'message': str(e)}), 500
