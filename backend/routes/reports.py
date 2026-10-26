"""
Reports API Routes
Centralized blueprint for all report endpoints specified in Section 6:
- GET /api/reports/stock-value -> 04_stock_value_by_category.sql
- GET /api/reports/purchases   -> 05_purchase_order_summary.sql
- GET /api/reports/sales       -> 06_sales_summary.sql (by date, product, employee)
- GET /api/reports/suppliers   -> 07_supplier_products.sql
"""

import logging
from flask import Blueprint, request, jsonify
from services.query_service import (
    get_stock_value_by_category,
    get_purchase_order_summary,
    get_sales_summary,
    get_supplier_products,
    get_low_stock_products
)

logger = logging.getLogger(__name__)
reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/stock-value', methods=['GET'])
@reports_bp.route('/category-valuation', methods=['GET'])
def get_stock_value():
    """
    GET /api/reports/stock-value
    Executes 04_stock_value_by_category.sql
    
    Query Parameters:
      include_inactive (bool, optional): Include inactive products (default False)
    """
    try:
        include_inactive_param = request.args.get('include_inactive', 'false').lower()
        include_inactive = include_inactive_param in ('true', '1', 'yes')
        
        results = get_stock_value_by_category(include_inactive=include_inactive)
        
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
        logger.error(f"Error executing stock value by category query: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Query Execution Error',
            'message': 'Failed to execute stock value by category query.'
        }), 500

@reports_bp.route('/purchases', methods=['GET'])
def get_purchases_report():
    """
    GET /api/reports/purchases
    Executes 05_purchase_order_summary.sql
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
        logger.error(f"Error executing purchase order report: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Query Execution Error',
            'message': 'Failed to execute purchase order summary query.'
        }), 500

@reports_bp.route('/sales', methods=['GET'])
@reports_bp.route('/turnover', methods=['GET'])
def get_sales_report():
    """
    GET /api/reports/sales or GET /api/reports/turnover
    Executes 06_sales_summary.sql
    """
    try:
        default_group = 'product' if request.path.endswith('/turnover') else 'date'
        group_by = request.args.get('group_by') or request.args.get('type') or default_group
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
        logger.error(f"Error executing sales report: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Query Execution Error',
            'message': 'Failed to execute sales summary query.'
        }), 500

@reports_bp.route('/suppliers', methods=['GET'])
def get_suppliers_report():
    """
    GET /api/reports/suppliers
    Executes 07_supplier_products.sql
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
        logger.error(f"Error executing supplier products report: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Query Execution Error',
            'message': 'Failed to execute supplier products query.'
        }), 500

@reports_bp.route('/low-stock', methods=['GET'])
def get_reports_low_stock():
    """
    GET /api/reports/low-stock
    Executes 02_low_stock.sql
    """
    try:
        include_inactive_param = request.args.get('include_inactive', 'false').lower()
        include_inactive = include_inactive_param in ('true', '1', 'yes')
        results = get_low_stock_products(include_inactive=include_inactive)
        return jsonify({
            'success': True,
            'count': len(results),
            'filters': {'include_inactive': include_inactive},
            'data': results
        }), 200
    except Exception as e:
        logger.error(f"Error executing reports low stock: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Query Execution Error',
            'message': str(e)
        }), 500

