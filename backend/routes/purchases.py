"""
Purchases API Routes
Maps purchase order reporting and receiving to:
- GET /api/purchases           -> 05_purchase_order_summary.sql
- GET /api/reports/purchases   -> 05_purchase_order_summary.sql
"""

import logging
from flask import Blueprint, request, jsonify
from services.query_service import (
    get_purchase_order_summary,
    create_purchase_order,
    update_purchase_order,
    delete_purchase_order
)
from db import get_db_cursor

logger = logging.getLogger(__name__)
purchases_bp = Blueprint('purchases', __name__)

@purchases_bp.route('', methods=['GET'])
def list_purchases():
    """
    GET /api/purchases
    Executes 05_purchase_order_summary.sql
    
    Query Parameters:
      status (str, optional): 'Pending', 'Received', 'Cancelled'
      supplier_id (int, optional): Filter by supplier ID
      start_date (str, optional): Start order date (YYYY-MM-DD)
      end_date (str, optional): End order date (YYYY-MM-DD)
    """
    try:
        status = request.args.get('status')
        if status and status.upper() == 'ALL':
            status = None
            
        supplier_id_param = request.args.get('supplier_id')
        supplier_id = int(supplier_id_param) if supplier_id_param and supplier_id_param.isdigit() else None
        
        start_date = request.args.get('start_date') or request.args.get('from_date')
        end_date = request.args.get('end_date') or request.args.get('to_date')
        
        results = get_purchase_order_summary(
            status=status,
            supplier_id=supplier_id,
            start_date=start_date,
            end_date=end_date
        )
        
        return jsonify({
            'success': True,
            'count': len(results),
            'filters': {
                'status': status,
                'supplier_id': supplier_id,
                'start_date': start_date,
                'end_date': end_date
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
        logger.error(f"Error fetching purchase orders: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Query Execution Error',
            'message': 'Failed to execute purchase order summary query.'
        }), 500

@purchases_bp.route('/<int:po_id>/receive', methods=['POST'])
def receive_purchase_order(po_id):
    """
    POST /api/purchases/<po_id>/receive
    Updates PO status to 'Received' and sets received_date = CURRENT_DATE.
    
    BUSINESS RULE:
    Only POs with status 'Received' contribute to product_stock view.
    Updating status to 'Received' makes items immediately visible in product_stock!
    """
    try:
        with get_db_cursor(commit=True) as cursor:
            cursor.execute(
                """
                UPDATE purchase_order
                SET status = 'Received', received_date = CURRENT_DATE
                WHERE po_id = %s
                RETURNING po_id, supplier_id, status, order_date, received_date;
                """,
                (po_id,)
            )
            updated = cursor.fetchone()
            if not updated:
                return jsonify({'success': False, 'message': f'Purchase order #{po_id} not found.'}), 404
            
            return jsonify({
                'success': True,
                'message': f'Purchase order #{po_id} marked as Received. Stock updated in views.',
                'data': updated
            }), 200
    except Exception as e:
        logger.error(f"Error receiving purchase order #{po_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Database Error',
            'message': str(e)
        }), 500

@purchases_bp.route('', methods=['POST'])
def add_purchase_order():
    """POST /api/purchases - Create a purchase order with line items in transaction."""
    try:
        data = request.get_json() or {}
        new_po = create_purchase_order(data)
        return jsonify({
            'success': True,
            'message': f"Purchase order #{new_po['po_id']} created successfully.",
            'data': new_po
        }), 201
    except ValueError as e:
        return jsonify({'success': False, 'error': 'Validation Error', 'message': str(e)}), 400
    except Exception as e:
        logger.error(f"Error creating purchase order: {str(e)}")
        return jsonify({'success': False, 'error': 'Database Error', 'message': str(e)}), 500

@purchases_bp.route('/<int:po_id>', methods=['PUT', 'PATCH'])
def edit_purchase_order(po_id):
    """
    PUT /api/purchases/<id> - Edit purchase order.
    SAFETY GUARD: Prevents modifying an already 'Received' purchase order.
    """
    try:
        data = request.get_json() or {}
        updated = update_purchase_order(po_id, data)
        return jsonify({
            'success': True,
            'message': f"Purchase order #{po_id} updated successfully.",
            'data': updated
        }), 200
    except ValueError as e:
        return jsonify({'success': False, 'error': 'Not Found', 'message': str(e)}), 404
    except PermissionError as e:
        return jsonify({'success': False, 'error': 'Safety Guard Violation', 'message': str(e)}), 400
    except Exception as e:
        logger.error(f"Error updating purchase order #{po_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Database Error', 'message': str(e)}), 500

@purchases_bp.route('/<int:po_id>', methods=['DELETE'])
def remove_purchase_order(po_id):
    """
    DELETE /api/purchases/<id> - Delete purchase order.
    SAFETY GUARD: Prevents deleting a 'Received' order that would corrupt stock counts.
    """
    try:
        deleted = delete_purchase_order(po_id)
        return jsonify({
            'success': True,
            'message': f"Purchase order #{po_id} deleted successfully.",
            'data': deleted
        }), 200
    except ValueError as e:
        return jsonify({'success': False, 'error': 'Not Found', 'message': str(e)}), 404
    except PermissionError as e:
        return jsonify({'success': False, 'error': 'Safety Guard Violation', 'message': str(e)}), 400
    except Exception as e:
        logger.error(f"Error deleting purchase order #{po_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Database Error', 'message': str(e)}), 500
