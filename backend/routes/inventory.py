"""
Inventory API Routes
Maps inventory, stock locations, and low-stock alerts to SQL queries:
- GET /api/inventory           -> 03_current_stock_location.sql
- GET /api/inventory/low-stock -> 02_low_stock.sql
"""

import logging
from flask import Blueprint, request, jsonify
from services.query_service import (
    get_current_stock_location,
    get_low_stock_products,
    get_racks_and_shelves
)

logger = logging.getLogger(__name__)
inventory_bp = Blueprint('inventory', __name__)

@inventory_bp.route('', methods=['GET'])
@inventory_bp.route('/locations', methods=['GET'])
def get_inventory():
    """
    GET /api/inventory
    Executes 03_current_stock_location.sql
    
    Query Parameters:
      include_inactive (bool, optional): Include inactive products (default False)
    """
    try:
        include_inactive_param = request.args.get('include_inactive', 'false').lower()
        include_inactive = include_inactive_param in ('true', '1', 'yes')
        
        results = get_current_stock_location(include_inactive=include_inactive)
        
        return jsonify({
            'success': True,
            'count': len(results),
            'filters': {
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
        logger.error(f"Error fetching current stock locations: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Query Execution Error',
            'message': 'Failed to execute current stock location query.'
        }), 500

@inventory_bp.route('/low-stock', methods=['GET'])
def get_low_stock():
    """
    GET /api/inventory/low-stock
    Executes 02_low_stock.sql
    
    Query Parameters:
      include_inactive (bool, optional): Include inactive products (default False)
    """
    try:
        include_inactive_param = request.args.get('include_inactive', 'false').lower()
        include_inactive = include_inactive_param in ('true', '1', 'yes')
        
        results = get_low_stock_products(include_inactive=include_inactive)
        
        return jsonify({
            'success': True,
            'count': len(results),
            'filters': {
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
        logger.error(f"Error fetching low-stock items: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Query Execution Error',
            'message': 'Failed to execute low stock query.'
        }), 500

@inventory_bp.route('/racks', methods=['GET'])
def get_racks():
    """
    GET /api/inventory/racks
    Fetch warehouse racks and shelves layout.
    """
    try:
        racks = get_racks_and_shelves()
        return jsonify({
            'success': True,
            'count': len(racks),
            'data': racks
        }), 200
    except Exception as e:
        logger.error(f"Error fetching racks: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Database Error',
            'message': str(e)
        }), 500
