"""
Dashboard API Routes
Provides overview KPI statistics, margin charts, and recent activity feed.
Uses the canonical views product_stock and product_location.
"""

import logging
from flask import Blueprint, jsonify
from db import get_db_cursor, serialize_rows
from services.query_service import get_stock_value_by_category

logger = logging.getLogger(__name__)
dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
def get_stats():
    """
    GET /api/dashboard/stats
    Aggregates real-time inventory and sales metrics from views and tables.
    """
    try:
        with get_db_cursor(commit=False) as cursor:
            # 1. Product stock metrics from canonical view product_stock and product table
            cursor.execute("""
                SELECT 
                    COUNT(*) AS total_skus,
                    COALESCE(SUM(ps.current_stock), 0) AS total_units,
                    COALESCE(SUM(ps.current_stock * p.unit_price), 0.00) AS total_inventory_value,
                    COALESCE(SUM(CASE WHEN ps.current_stock < ps.reorder_level THEN 1 ELSE 0 END), 0) AS low_stock_count
                FROM product_stock ps
                JOIN product p ON p.product_id = ps.product_id;
            """)
            stock_stats = cursor.fetchone() or {}

            # 2. Today's sales total
            cursor.execute("""
                SELECT COALESCE(SUM(si.quantity * si.unit_price), 0.00) AS today_sales
                FROM sales_order so
                JOIN sales_item si ON si.sale_id = so.sale_id
                WHERE so.sale_date = CURRENT_DATE;
            """)
            sales_stats = cursor.fetchone() or {}

            # 3. Rack capacity
            cursor.execute("SELECT COUNT(*) AS total_racks FROM rack;")
            rack_stats = cursor.fetchone() or {}

            total_skus = int(stock_stats.get('total_skus') or 0)
            total_units = int(stock_stats.get('total_units') or 0)
            inventory_val = float(stock_stats.get('total_inventory_value') or 0.0)
            low_stock_count = int(stock_stats.get('low_stock_count') or 0)
            today_sales = float(sales_stats.get('today_sales') or 0.0)
            total_racks = int(rack_stats.get('total_racks') or 0)

            total_capacity = max(total_racks * 400, 1000)
            rack_occupancy_pct = round((total_units / total_capacity * 100), 1) if total_capacity > 0 else 0.0

            return jsonify({
                'success': True,
                'data': {
                    'totalSkus': total_skus,
                    'totalUnits': total_units,
                    'totalInventoryValue': inventory_val,
                    'potentialRevenue': round(inventory_val * 1.35, 2),
                    'estimatedProfit': round(inventory_val * 0.35, 2),
                    'avgMargin': 26.0,
                    'lowStockCount': low_stock_count,
                    'totalCapacity': total_capacity,
                    'totalOccupied': total_units,
                    'rackOccupancyPct': rack_occupancy_pct,
                    'todaySales': today_sales
                }
            }), 200

    except ConnectionError as e:
        return jsonify({
            'success': False,
            'error': 'Database Connection Error',
            'message': str(e)
        }), 503
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Database Error',
            'message': str(e)
        }), 500

@dashboard_bp.route('/margin-chart', methods=['GET'])
def get_margin_chart():
    """
    GET /api/dashboard/margin-chart
    Returns top products by unit profit from product_stock.
    """
    try:
        with get_db_cursor(commit=False) as cursor:
            cursor.execute("""
                SELECT 
                    ps.product_id,
                    ps.product_name,
                    c.category_name AS category,
                    p.unit_price,
                    ROUND(p.unit_price * 0.70, 2) AS cost_price,
                    ROUND(p.unit_price * 0.30, 2) AS unit_profit,
                    30.0 AS margin_pct,
                    ps.current_stock AS total_stock
                FROM product_stock ps
                JOIN product p ON p.product_id = ps.product_id
                JOIN category c ON c.category_id = p.category_id
                WHERE ps.current_stock > 0
                ORDER BY p.unit_price DESC
                LIMIT 5;
            """)
            rows = cursor.fetchall()
            return jsonify({
                'success': True,
                'data': serialize_rows(rows)
            }), 200
    except Exception as e:
        logger.error(f"Error fetching margin chart data: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Database Error',
            'message': str(e)
        }), 500

@dashboard_bp.route('/category-values', methods=['GET'])
def get_category_values():
    """
    GET /api/dashboard/category-values
    Returns stock value grouped by category.
    """
    try:
        results = get_stock_value_by_category(include_inactive=False)
        return jsonify({
            'success': True,
            'count': len(results),
            'data': results
        }), 200
    except Exception as e:
        logger.error(f"Error fetching category values: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Database Error',
            'message': str(e)
        }), 500

@dashboard_bp.route('/recent-activity', methods=['GET'])
def get_recent_activity():
    """
    GET /api/dashboard/recent-activity
    Returns recent system activities from purchase_order and sales_order.
    """
    try:
        with get_db_cursor(commit=False) as cursor:
            activities = []
            # Recent sales
            cursor.execute("""
                SELECT 
                    'SALE' AS type,
                    'Sale #' || so.sale_id || ' by ' || e.employee_name AS title,
                    COALESCE(SUM(si.quantity), 0) || ' items sold' AS description,
                    so.sale_date::text AS time,
                    'text-emerald-400' AS color
                FROM sales_order so
                JOIN employee e ON e.employee_id = so.employee_id
                LEFT JOIN sales_item si ON si.sale_id = so.sale_id
                GROUP BY so.sale_id, e.employee_name, so.sale_date
                ORDER BY so.sale_date DESC, so.sale_id DESC
                LIMIT 3;
            """)
            activities.extend(cursor.fetchall())

            # Recent purchase orders
            cursor.execute("""
                SELECT 
                    'PURCHASE' AS type,
                    'PO #' || po.po_id || ' - ' || po.status AS title,
                    'Supplier: ' || s.supplier_name AS description,
                    po.order_date::text AS time,
                    'text-blue-400' AS color
                FROM purchase_order po
                JOIN supplier s ON s.supplier_id = po.supplier_id
                ORDER BY po.order_date DESC, po.po_id DESC
                LIMIT 3;
            """)
            activities.extend(cursor.fetchall())

            return jsonify({
                'success': True,
                'data': serialize_rows(activities)
            }), 200
    except Exception as e:
        logger.error(f"Error fetching recent activities: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Database Error',
            'message': str(e)
        }), 500
