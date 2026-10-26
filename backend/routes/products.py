"""
Products API Routes
Maps frontend product catalog and search requests to 01_product_search.sql
"""

import logging
from flask import Blueprint, request, jsonify
from services.query_service import (
    search_products,
    get_categories_list,
    create_product,
    update_product,
    delete_product
)

logger = logging.getLogger(__name__)
products_bp = Blueprint('products', __name__)

@products_bp.route('', methods=['GET'])
def get_products():
    """
    GET /api/products
    Executes 01_product_search.sql
    
    Query Parameters:
      search (str): Name or SKU search text (default '')
      category_id (int, optional): Filter by category ID
      include_inactive (bool, optional): Include inactive products (default False)
    """
    try:
        search_text = request.args.get('search') or request.args.get('q') or ''
        
        category_id_param = request.args.get('category_id')
        category_id = int(category_id_param) if category_id_param and category_id_param.isdigit() else None
        
        include_inactive_param = request.args.get('include_inactive', 'false').lower()
        include_inactive = include_inactive_param in ('true', '1', 'yes')
        
        results = search_products(
            search_text=search_text,
            category_id=category_id,
            include_inactive=include_inactive
        )
        
        return jsonify({
            'success': True,
            'count': len(results),
            'filters': {
                'search': search_text,
                'category_id': category_id,
                'include_inactive': include_inactive
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
        logger.error(f"Error executing product search: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Query Execution Error',
            'message': 'Failed to execute product search query.'
        }), 500

@products_bp.route('/categories', methods=['GET'])
def get_categories():
    """
    GET /api/products/categories
    Fetch list of product categories for dropdown filters.
    """
    try:
        categories = get_categories_list()
        return jsonify({
            'success': True,
            'count': len(categories),
            'data': categories
        }), 200
    except Exception as e:
        logger.error(f"Error fetching categories: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Database Error',
            'message': str(e)
        }), 500

@products_bp.route('', methods=['POST'])
def add_product():
    """
    POST /api/products
    Insert a new product into Supabase PostgreSQL database.
    """
    try:
        data = request.get_json() or {}
        if not data.get('product_name') and not data.get('name'):
            return jsonify({
                'success': False,
                'error': 'Validation Error',
                'message': 'Product name is required.'
            }), 400

        new_product = create_product(data)
        return jsonify({
            'success': True,
            'message': 'Product created successfully in database.',
            'data': new_product
        }), 201
    except Exception as e:
        logger.error(f"Error creating product: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Database Insert Error',
            'message': str(e)
        }), 500

@products_bp.route('/<int:product_id>', methods=['PUT', 'PATCH'])
def edit_product(product_id):
    """
    PUT /api/products/<id>
    Update an existing product in Supabase PostgreSQL database.
    Allows modifying: product_name, sku, category_id, shelf_id, unit_price, reorder_level, is_active.
    """
    try:
        data = request.get_json() or {}
        updated = update_product(product_id, data)
        return jsonify({
            'success': True,
            'message': f"Product '{updated['product_name']}' (#{product_id}) updated successfully.",
            'data': updated
        }), 200
    except ValueError as e:
        status_code = 404 if 'not found' in str(e).lower() else 400
        return jsonify({
            'success': False,
            'error': 'Validation Error' if status_code == 400 else 'Not Found',
            'message': str(e)
        }), status_code
    except Exception as e:
        logger.error(f"Error updating product #{product_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Database Update Error',
            'message': str(e)
        }), 500

@products_bp.route('/<int:product_id>', methods=['DELETE'])
def remove_product(product_id):
    """
    DELETE /api/products/<id>
    Deactivate or remove a product from Supabase PostgreSQL database.
    Query Parameters:
      hard (bool): If true, attempts permanent delete if no historic orders reference it.
    """
    try:
        hard_delete = request.args.get('hard', 'false').lower() in ('true', '1')
        deleted = delete_product(product_id, hard_delete=hard_delete)
        action_desc = "permanently deleted" if deleted.get('action') == 'hard_deleted' else "deactivated"
        return jsonify({
            'success': True,
            'message': f"Product #{product_id} successfully {action_desc}.",
            'data': deleted
        }), 200
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': 'Not Found',
            'message': str(e)
        }), 404
    except PermissionError as e:
        return jsonify({
            'success': False,
            'error': 'Dependency Conflict',
            'message': str(e)
        }), 409
    except Exception as e:
        logger.error(f"Error deleting product #{product_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Database Delete Error',
            'message': str(e)
        }), 500

