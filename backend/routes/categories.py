"""
Categories API Routes
Provides CRUD endpoints for product categories with safety checks on product references.
Endpoints:
- GET    /api/categories
- POST   /api/categories
- PUT    /api/categories/<id>
- DELETE /api/categories/<id>
"""

import logging
from flask import Blueprint, request, jsonify
from services.query_service import (
    get_categories_list,
    create_category,
    update_category,
    delete_category
)

logger = logging.getLogger(__name__)
categories_bp = Blueprint('categories', __name__)

@categories_bp.route('', methods=['GET'])
def list_categories():
    """GET /api/categories - List all categories with product counts."""
    try:
        categories = get_categories_list()
        return jsonify({
            'success': True,
            'count': len(categories),
            'data': categories
        }), 200
    except Exception as e:
        logger.error(f"Error fetching categories: {str(e)}")
        return jsonify({'success': False, 'error': 'Database Error', 'message': str(e)}), 500

@categories_bp.route('', methods=['POST'])
def add_category():
    """POST /api/categories - Create a new product category."""
    try:
        data = request.get_json() or {}
        name = data.get('category_name') or data.get('name')
        if not name:
            return jsonify({'success': False, 'error': 'Validation Error', 'message': 'Category name is required.'}), 400
            
        created = create_category(name)
        return jsonify({
            'success': True,
            'message': f"Category '{created['category_name']}' created successfully.",
            'data': created
        }), 201
    except ValueError as e:
        return jsonify({'success': False, 'error': 'Bad Request', 'message': str(e)}), 400
    except Exception as e:
        logger.error(f"Error creating category: {str(e)}")
        return jsonify({'success': False, 'error': 'Database Error', 'message': str(e)}), 500

@categories_bp.route('/<int:category_id>', methods=['PUT', 'PATCH'])
def edit_category(category_id):
    """PUT /api/categories/<id> - Edit category name."""
    try:
        data = request.get_json() or {}
        name = data.get('category_name') or data.get('name')
        if not name:
            return jsonify({'success': False, 'error': 'Validation Error', 'message': 'Category name is required.'}), 400
            
        updated = update_category(category_id, name)
        return jsonify({
            'success': True,
            'message': f"Category #{category_id} updated to '{updated['category_name']}'.",
            'data': updated
        }), 200
    except ValueError as e:
        status_code = 404 if 'not found' in str(e).lower() else 400
        return jsonify({'success': False, 'error': 'Request Error', 'message': str(e)}), status_code
    except Exception as e:
        logger.error(f"Error updating category #{category_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Database Error', 'message': str(e)}), 500

@categories_bp.route('/<int:category_id>', methods=['DELETE'])
def remove_category(category_id):
    """
    DELETE /api/categories/<id> - Delete category.
    Rejects with 409 Conflict if products still reference this category.
    """
    try:
        deleted = delete_category(category_id)
        return jsonify({
            'success': True,
            'message': f"Category '{deleted['category_name']}' deleted successfully.",
            'data': deleted
        }), 200
    except ValueError as e:
        return jsonify({'success': False, 'error': 'Not Found', 'message': str(e)}), 404
    except PermissionError as e:
        return jsonify({'success': False, 'error': 'Dependency Conflict', 'message': str(e)}), 409
    except Exception as e:
        logger.error(f"Error deleting category #{category_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Database Error', 'message': str(e)}), 500
