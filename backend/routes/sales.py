"""
Sales API Routes
Maps sales summaries and POS transactions to:
- GET /api/reports/sales -> 06_sales_summary.sql (separate statements A, B, C)
- POST /api/sales        -> Sales checkout respecting trg_check_stock_before_sale
"""

import logging
from flask import Blueprint, request, jsonify
import psycopg2
from services.query_service import (
    get_sales_summary,
    create_sale_transaction,
    delete_sale_order
)
from db import get_db_cursor, serialize_rows

logger = logging.getLogger(__name__)
sales_bp = Blueprint('sales', __name__)

@sales_bp.route('', methods=['GET'])
@sales_bp.route('/summary', methods=['GET'])
def get_sales_report():
    """
    GET /api/reports/sales or GET /api/sales
    Executes the appropriate statement from 06_sales_summary.sql:
      - group_by=date     -> Statement A (By date)
      - group_by=product  -> Statement B (By product)
      - group_by=employee -> Statement C (By employee)
      
    Query Parameters:
      group_by (str): 'date', 'product', or 'employee' (default 'date')
      start_date (str, optional): YYYY-MM-DD
      end_date (str, optional): YYYY-MM-DD
    """
    try:
        group_by = request.args.get('group_by') or request.args.get('type') or 'date'
        start_date = request.args.get('start_date') or request.args.get('from_date')
        end_date = request.args.get('end_date') or request.args.get('to_date')
        
        results = get_sales_summary(
            group_by=group_by,
            start_date=start_date,
            end_date=end_date
        )
        
        return jsonify({
            'success': True,
            'count': len(results),
            'group_by': group_by,
            'filters': {
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
        logger.error(f"Error executing sales summary query: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Query Execution Error',
            'message': 'Failed to execute sales summary query.'
        }), 500

@sales_bp.route('/history', methods=['GET'])
def get_sales_history():
    """
    GET /api/sales/history
    Fetch list of recent sales orders with item breakdown for POS audit log.
    """
    try:
        limit = int(request.args.get('limit', 50))
        with get_db_cursor(commit=False) as cursor:
            cursor.execute(
                """
                SELECT 
                    so.sale_id,
                    so.sale_date,
                    'Walk-in Customer' AS customer_name,
                    e.employee_name,
                    COUNT(si.product_id) AS total_items,
                    COALESCE(SUM(si.quantity), 0) AS total_units_sold,
                    COALESCE(SUM(si.quantity * si.unit_price), 0.00) AS total_amount
                FROM sales_order so
                JOIN employee e ON e.employee_id = so.employee_id
                LEFT JOIN sales_item si ON si.sale_id = so.sale_id
                GROUP BY so.sale_id, so.sale_date, e.employee_name
                ORDER BY so.sale_date DESC, so.sale_id DESC
                LIMIT %s;
                """,
                (limit,)
            )
            rows = cursor.fetchall()
            return jsonify({
                'success': True,
                'count': len(rows),
                'data': serialize_rows(rows)
            }), 200
    except Exception as e:
        logger.error(f"Error fetching sales history: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Database Error',
            'message': str(e)
        }), 500

@sales_bp.route('', methods=['POST'])
def record_sale():
    """
    POST /api/sales
    Record a sale transaction.
    
    BUSINESS RULE:
    Preserves database trigger fn_check_stock_before_sale()!
    If requested quantity > available stock, PostgreSQL trigger raises an exception
    and rolls back the transaction.
    
    Payload:
    {
        "employee_id": 1,
        "customer_name": "Walk-in Customer",
        "items": [
            { "product_id": 1, "quantity": 2, "unit_price": 495.00 }
        ]
    }
    """
    try:
        payload = request.get_json() or {}
        employee_id = payload.get('employee_id', 1)
        customer_name = payload.get('customer_name', 'Walk-in Customer')
        items = payload.get('items', [])
        
        if not items:
            return jsonify({
                'success': False,
                'error': 'Validation Error',
                'message': 'Cannot record sale: items list is empty.'
            }), 400
            
        sale_order = create_sale_transaction(
            employee_id=employee_id,
            customer_name=customer_name,
            items=items
        )
        
        return jsonify({
            'success': True,
            'message': 'Sale completed successfully.',
            'data': sale_order
        }), 201
        
    except psycopg2.DatabaseError as e:
        # Trigger exception handling (fn_check_stock_before_sale)
        error_msg = str(e).strip()
        logger.warning(f"Sale rejected by database rule: {error_msg}")
        return jsonify({
            'success': False,
            'error': 'Stock Validation Trigger Rejection',
            'message': error_msg
        }), 400
    except Exception as e:
        logger.error(f"Error recording sale: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Server Error',
            'message': 'Failed to process sale transaction.'
        }), 500

@sales_bp.route('/<int:sale_id>', methods=['DELETE'])
def remove_sale(sale_id):
    """
    DELETE /api/sales/<id>
    SAFETY GUARD: Prevents accidental deletion of completed sales orders that would corrupt inventory accounting.
    """
    try:
        delete_sale_order(sale_id)
        return jsonify({'success': True, 'message': f"Sale #{sale_id} removed."}), 200
    except ValueError as e:
        return jsonify({'success': False, 'error': 'Not Found', 'message': str(e)}), 404
    except PermissionError as e:
        return jsonify({'success': False, 'error': 'Transaction Integrity Protection', 'message': str(e)}), 400
    except Exception as e:
        logger.error(f"Error deleting sale #{sale_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Database Error', 'message': str(e)}), 500
