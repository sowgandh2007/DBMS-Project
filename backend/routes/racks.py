"""
Racks & Shelves API Routes
Provides CRUD endpoints for warehouse racks and shelves.
Prevents deletion when products are currently stored in a rack or shelf.
Endpoints:
- GET    /api/racks            -> List racks and shelves
- POST   /api/racks            -> Create new rack
- PUT    /api/racks/<id>       -> Edit rack
- DELETE /api/racks/<id>       -> Delete rack (rejects if products assigned)
- POST   /api/shelves          -> Create new shelf
- PUT    /api/shelves/<id>     -> Edit shelf
- DELETE /api/shelves/<id>     -> Delete shelf (rejects if products assigned)
"""

import logging
from flask import Blueprint, request, jsonify
from db import get_db_cursor, serialize_rows
from services.query_service import (
    get_racks_and_shelves,
    create_rack,
    update_rack,
    delete_rack,
    create_shelf,
    update_shelf,
    delete_shelf
)

logger = logging.getLogger(__name__)
racks_bp = Blueprint('racks', __name__)
shelves_bp = Blueprint('shelves', __name__)

# --- RACK ENDPOINTS ---

@racks_bp.route('', methods=['GET'])
def list_racks():
    """GET /api/racks - Fetch racks with shelves and product counts."""
    try:
        racks = get_racks_and_shelves()
        return jsonify({
            'success': True,
            'count': len(racks),
            'data': racks
        }), 200
    except Exception as e:
        logger.error(f"Error fetching racks: {str(e)}")
        return jsonify({'success': False, 'error': 'Database Error', 'message': str(e)}), 500

@racks_bp.route('', methods=['POST'])
def add_rack():
    """POST /api/racks - Create a new physical storage rack."""
    try:
        data = request.get_json() or {}
        new_rack = create_rack(data)
        return jsonify({
            'success': True,
            'message': f"Rack '{new_rack['rack_code']}' created successfully.",
            'data': new_rack
        }), 201
    except ValueError as e:
        return jsonify({'success': False, 'error': 'Validation Error', 'message': str(e)}), 400
    except Exception as e:
        logger.error(f"Error creating rack: {str(e)}")
        return jsonify({'success': False, 'error': 'Database Error', 'message': str(e)}), 500

@racks_bp.route('/<int:rack_id>', methods=['PUT', 'PATCH'])
def edit_rack(rack_id):
    """PUT /api/racks/<id> - Update rack code or aisle location."""
    try:
        data = request.get_json() or {}
        updated = update_rack(rack_id, data)
        return jsonify({
            'success': True,
            'message': f"Rack #{rack_id} updated successfully.",
            'data': updated
        }), 200
    except ValueError as e:
        status_code = 404 if 'not found' in str(e).lower() else 400
        return jsonify({'success': False, 'error': 'Request Error', 'message': str(e)}), status_code
    except Exception as e:
        logger.error(f"Error updating rack #{rack_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Database Error', 'message': str(e)}), 500

@racks_bp.route('/<int:rack_id>', methods=['DELETE'])
def remove_rack(rack_id):
    """
    DELETE /api/racks/<id> - Delete rack.
    Rejects with 409 Conflict if products are currently stored on shelves in this rack.
    """
    try:
        deleted = delete_rack(rack_id)
        return jsonify({
            'success': True,
            'message': f"Rack '{deleted['rack_code']}' deleted successfully.",
            'data': deleted
        }), 200
    except ValueError as e:
        return jsonify({'success': False, 'error': 'Not Found', 'message': str(e)}), 404
    except PermissionError as e:
        return jsonify({'success': False, 'error': 'Dependency Conflict', 'message': str(e)}), 409
    except Exception as e:
        logger.error(f"Error deleting rack #{rack_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Database Error', 'message': str(e)}), 500

# --- SHELF ENDPOINTS ---

@shelves_bp.route('', methods=['GET'])
def list_shelves():
    """GET /api/shelves - List all shelves."""
    try:
        with get_db_cursor(commit=False) as cursor:
            cursor.execute("""
                SELECT s.shelf_id, s.shelf_number, s.rack_id, r.rack_code, r.aisle,
                       COUNT(p.product_id) AS product_count
                FROM shelf s
                JOIN rack r ON r.rack_id = s.rack_id
                LEFT JOIN product p ON p.shelf_id = s.shelf_id AND p.is_active = TRUE
                GROUP BY s.shelf_id, s.shelf_number, s.rack_id, r.rack_code, r.aisle
                ORDER BY r.rack_code, s.shelf_number;
            """)
            shelves = cursor.fetchall()
            return jsonify({'success': True, 'count': len(shelves), 'data': serialize_rows(shelves)}), 200
    except Exception as e:
        logger.error(f"Error listing shelves: {str(e)}")
        return jsonify({'success': False, 'error': 'Database Error', 'message': str(e)}), 500

@shelves_bp.route('', methods=['POST'])
def add_shelf():
    """POST /api/shelves - Add a shelf inside a rack."""
    try:
        data = request.get_json() or {}
        new_shelf = create_shelf(data)
        return jsonify({
            'success': True,
            'message': f"Shelf '{new_shelf['shelf_number']}' created in Rack #{new_shelf['rack_id']}.",
            'data': new_shelf
        }), 201
    except ValueError as e:
        return jsonify({'success': False, 'error': 'Validation Error', 'message': str(e)}), 400
    except Exception as e:
        logger.error(f"Error creating shelf: {str(e)}")
        return jsonify({'success': False, 'error': 'Database Error', 'message': str(e)}), 500

@shelves_bp.route('/<int:shelf_id>', methods=['PUT', 'PATCH'])
def edit_shelf(shelf_id):
    """PUT /api/shelves/<id> - Update shelf number or rack assignment."""
    try:
        data = request.get_json() or {}
        updated = update_shelf(shelf_id, data)
        return jsonify({
            'success': True,
            'message': f"Shelf #{shelf_id} updated successfully.",
            'data': updated
        }), 200
    except ValueError as e:
        status_code = 404 if 'not found' in str(e).lower() else 400
        return jsonify({'success': False, 'error': 'Request Error', 'message': str(e)}), status_code
    except Exception as e:
        logger.error(f"Error updating shelf #{shelf_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Database Error', 'message': str(e)}), 500

@shelves_bp.route('/<int:shelf_id>', methods=['DELETE'])
def remove_shelf(shelf_id):
    """
    DELETE /api/shelves/<id> - Delete shelf.
    Rejects with 409 Conflict if products are currently stored on this shelf.
    """
    try:
        deleted = delete_shelf(shelf_id)
        return jsonify({
            'success': True,
            'message': f"Shelf #{shelf_id} deleted successfully.",
            'data': deleted
        }), 200
    except ValueError as e:
        return jsonify({'success': False, 'error': 'Not Found', 'message': str(e)}), 404
    except PermissionError as e:
        return jsonify({'success': False, 'error': 'Dependency Conflict', 'message': str(e)}), 409
    except Exception as e:
        logger.error(f"Error deleting shelf #{shelf_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Database Error', 'message': str(e)}), 500
