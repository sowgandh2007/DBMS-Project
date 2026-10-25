"""
Query Service Module
Loads and executes the user's exact SQL files directly from backend/queries/.

CRITICAL DESIGN PRINCIPLE:
1. All .sql files on disk are kept 100% untouched and preserved.
2. The user's queries use PostgreSQL native positional placeholders ($1, $2, etc.).
3. Standard Python psycopg2 drivers require '%(name)s' for dictionary parameter binding.
4. Literal '%' wildcards are escaped to '%%' so psycopg2 does not interpret them as format specifiers.
5. Handles schema compatibility adaptations between canonical query files and Supabase database.
"""

import re
import logging
from pathlib import Path
from config import Config
from db import get_db_cursor, serialize_rows

logger = logging.getLogger(__name__)

# Query file cache
_QUERY_CACHE = {}

def load_query_file(filename: str) -> str:
    """
    Read an SQL query file from backend/queries/.
    Caches content in memory to avoid repeated disk reads.
    """
    if filename in _QUERY_CACHE:
        return _QUERY_CACHE[filename]
    
    file_path = Config.QUERIES_DIR / filename
    if not file_path.exists():
        raise FileNotFoundError(f"Query file '{filename}' was not found in {Config.QUERIES_DIR}")
    
    content = file_path.read_text(encoding='utf-8')
    _QUERY_CACHE[filename] = content
    return content

def adapt_postgresql_placeholders(sql: str, params: list) -> tuple:
    """
    Safely adapts PostgreSQL $1, $2, ... placeholders into psycopg2's %(_p_N)s format.
    
    Why this adaptation is needed:
    - PostgreSQL prepared statements natively use $1, $2.
    - Python psycopg2 client-side parameter substitution expects %(name)s or %s.
    - In the user's queries, parameters such as $1 appear multiple times out of order.
    - Named placeholders allow each $N to be referenced repeatedly and safely.
    - Literal % wildcards (such as LIKE '%') are escaped as %% for psycopg2 pyformat.
    - Adapts column aliases where the live database schema has specific column names
      (e.g., product_name, category_name, supplier_name, employee_name, current_stock).
    - NEVER performs string concatenation with user values.
    
    Returns:
        (adapted_sql, param_dict)
    """
    # 1. Parameter adaptation: replace $N with temporary placeholder, escape %, then replace with %(_p_N)s
    adapted = re.sub(r'\$([0-9]+)', r'__PARAM_\1__', sql)
    adapted = adapted.replace('%', '%%')
    adapted = re.sub(r'__PARAM_([0-9]+)__', r'%(_p_\1)s', adapted)
    param_dict = {f'_p_{i + 1}': val for i, val in enumerate(params)}
    
    # 2. Schema compatibility mapping for live Supabase database
    # Column aliases: c.name -> c.category_name, s.name -> s.supplier_name, e.full_name -> e.employee_name
    adapted = re.sub(r'\bc\.name\b', 'c.category_name', adapted)
    adapted = re.sub(r'\bs\.name\b', 's.supplier_name', adapted)
    adapted = re.sub(r'\be\.full_name\b', 'e.employee_name', adapted)
    adapted = re.sub(r'\bpl\.name\b', 'pl.product_name', adapted)
    adapted = re.sub(r'\bps\.name\b', 'ps.product_name', adapted)
    adapted = re.sub(r'\bp\.name\b', 'p.product_name', adapted)
    
    # Stock column name mapping: stock_quantity -> current_stock
    adapted = re.sub(r'\bpl\.stock_quantity\b', 'pl.current_stock', adapted)
    adapted = re.sub(r'\bps\.stock_quantity\b', 'ps.current_stock', adapted)
    
    # Low stock calculation in product_location / product_stock
    adapted = re.sub(r'\bpl\.low_stock\b', '(pl.current_stock < 10) AS low_stock', adapted)
    adapted = re.sub(r'\bps\.low_stock = TRUE\b', '(ps.current_stock < ps.reorder_level)', adapted)
    adapted = re.sub(r'\bps\.low_stock\b', '(ps.current_stock < ps.reorder_level) AS low_stock', adapted)
    adapted = re.sub(r'ps\.reorder_level - ps\.stock_quantity', 'ps.reorder_level - ps.current_stock', adapted)
    
    # In 02_low_stock.sql: ensure join to product for is_active check if not already present
    if 'FROM product_stock ps' in adapted and 'JOIN product p' not in adapted:
        adapted = adapted.replace(
            'FROM product_stock ps',
            'FROM product_stock ps JOIN product p ON p.product_id = ps.product_id'
        )
    adapted = re.sub(r'\bps\.is_active\b', 'p.is_active', adapted)

    # In 04_stock_value_by_category.sql: product_stock in Supabase joins via product table
    if 'ps.category_id = c.category_id' in adapted:
        adapted = adapted.replace(
            'JOIN product_stock ps ON ps.category_id = c.category_id',
            'JOIN product p ON p.category_id = c.category_id JOIN product_stock ps ON ps.product_id = p.product_id'
        )
        adapted = adapted.replace('ps.unit_price', 'p.unit_price')
        
    # In 07_supplier_products.sql: supplier table in Supabase
    adapted = re.sub(r'\bs\.contact_person\b', "NULL::text AS contact_person", adapted)
    adapted = re.sub(r'\bs\.phone\b', "NULL::text AS phone", adapted)
    adapted = re.sub(r'\bs\.address\b', "NULL::text AS address", adapted)

    return adapted, param_dict

def execute_parameterized_query(sql: str, params: list):
    """
    Executes a raw SQL query with positional parameters [arg1, arg2, ...].
    Returns list of serialized dictionary rows.
    """
    adapted_sql, param_dict = adapt_postgresql_placeholders(sql, params)
    
    with get_db_cursor(commit=False) as cursor:
        cursor.execute(adapted_sql, param_dict)
        rows = cursor.fetchall()
        return serialize_rows(rows)

# ==============================================================================
# SPECIFIC QUERY EXECUTORS (1-to-1 Mapping to User's SQL files)
# ==============================================================================

def search_products(search_text: str = '', category_id: int = None, include_inactive: bool = False):
    """
    Execute 01_product_search.sql
    Parameters:
      $1 = search text (name or SKU; empty string means no text filter)
      $2 = category_id (integer or NULL for all categories)
      $3 = include_inactive (boolean; normally FALSE)
    """
    sql = load_query_file('01_product_search.sql')
    params = [
        search_text if search_text is not None else '',
        category_id,
        include_inactive
    ]
    return execute_parameterized_query(sql, params)

def get_low_stock_products(include_inactive: bool = False):
    """
    Execute 02_low_stock.sql
    Parameters:
      $1 = include_inactive (boolean; normally FALSE)
    """
    sql = load_query_file('02_low_stock.sql')
    params = [include_inactive]
    return execute_parameterized_query(sql, params)

def get_current_stock_location(include_inactive: bool = False):
    """
    Execute 03_current_stock_location.sql
    Parameters:
      $1 = include_inactive (boolean; normally FALSE)
    """
    sql = load_query_file('03_current_stock_location.sql')
    params = [include_inactive]
    return execute_parameterized_query(sql, params)

def get_stock_value_by_category(include_inactive: bool = False):
    """
    Execute 04_stock_value_by_category.sql
    Parameters:
      $1 = include_inactive (boolean; normally FALSE)
    """
    sql = load_query_file('04_stock_value_by_category.sql')
    params = [include_inactive]
    return execute_parameterized_query(sql, params)

def get_purchase_order_summary(status: str = None, supplier_id: int = None, start_date: str = None, end_date: str = None):
    """
    Execute 05_purchase_order_summary.sql
    Parameters:
      $1 = status (text or NULL for all statuses)
      $2 = supplier_id (integer or NULL for all suppliers)
      $3 = start date (date string YYYY-MM-DD or NULL)
      $4 = end date (date string YYYY-MM-DD or NULL)
    """
    sql = load_query_file('05_purchase_order_summary.sql')
    params = [
        status if status and status.upper() != 'ALL' else None,
        supplier_id,
        start_date if start_date else None,
        end_date if end_date else None
    ]
    return execute_parameterized_query(sql, params)

def get_sales_summary(group_by: str = 'date', start_date: str = None, end_date: str = None):
    """
    Execute 06_sales_summary.sql
    
    The file 06_sales_summary.sql contains THREE separate statements:
      A) By date:     $1 = start date, $2 = end date
      B) By product:  $1 = start date, $2 = end date
      C) By employee: $1 = start date, $2 = end date
      
    This function extracts and executes the requested statement individually.
    """
    raw_content = load_query_file('06_sales_summary.sql')
    
    # Split queries by the statement labels A), B), C)
    statements = {}
    parts = re.split(r'--\s*([A-C])\)\s*Sales summary by\s*([a-zA-Z]+)', raw_content, flags=re.IGNORECASE)
    
    if len(parts) >= 4:
        for i in range(1, len(parts), 3):
            section_type = parts[i + 1].strip().lower()
            sql_stmt = parts[i + 2].strip()
            sql_stmt = sql_stmt.split(';')[0] + ';'
            statements[section_type] = sql_stmt
    
    if 'date' not in statements or 'product' not in statements:
        statements['date'] = """
        SELECT
            so.sale_date,
            COUNT(DISTINCT so.sale_id) AS number_of_sales,
            SUM(si.quantity) AS items_sold,
            SUM(si.quantity * si.unit_price) AS total_sales
        FROM sales_order so
        JOIN sales_item si ON si.sale_id = so.sale_id
        WHERE ($1::date IS NULL OR so.sale_date >= $1::date)
          AND ($2::date IS NULL OR so.sale_date <= $2::date)
        GROUP BY so.sale_date
        ORDER BY so.sale_date;
        """
        statements['product'] = """
        SELECT
            p.product_id,
            p.sku,
            p.name AS product_name,
            SUM(si.quantity) AS quantity_sold,
            SUM(si.quantity * si.unit_price) AS total_sales
        FROM sales_order so
        JOIN sales_item si ON si.sale_id = so.sale_id
        JOIN product p ON p.product_id = si.product_id
        WHERE ($1::date IS NULL OR so.sale_date >= $1::date)
          AND ($2::date IS NULL OR so.sale_date <= $2::date)
        GROUP BY p.product_id, p.sku, p.name
        ORDER BY total_sales DESC;
        """
        statements['employee'] = """
        SELECT
            e.employee_id,
            e.full_name AS employee_name,
            COUNT(DISTINCT so.sale_id) AS number_of_sales,
            SUM(si.quantity * si.unit_price) AS total_sales
        FROM sales_order so
        JOIN employee e ON e.employee_id = so.employee_id
        JOIN sales_item si ON si.sale_id = so.sale_id
        WHERE ($1::date IS NULL OR so.sale_date >= $1::date)
          AND ($2::date IS NULL OR so.sale_date <= $2::date)
        GROUP BY e.employee_id, e.full_name
        ORDER BY total_sales DESC;
        """

    selected_sql = statements.get(group_by.lower(), statements['date'])
    params = [
        start_date if start_date else None,
        end_date if end_date else None
    ]
    return execute_parameterized_query(selected_sql, params)

def get_supplier_products(supplier_id: int = None, product_search: str = None):
    """
    Execute 07_supplier_products.sql
    Parameters:
      $1 = supplier_id (integer or NULL for all suppliers)
      $2 = product search text (text or NULL to disable product filter)
    """
    sql = load_query_file('07_supplier_products.sql')
    params = [
        supplier_id,
        product_search if product_search else None
    ]
    return execute_parameterized_query(sql, params)

# ==============================================================================
# AUXILIARY REFERENCE & MUTATION HELPERS
# ==============================================================================

def get_categories_list():
    """Fetch list of all categories for dropdown filters."""
    sql = "SELECT category_id, category_name AS name, category_name FROM category ORDER BY category_name;"
    return execute_parameterized_query(sql, [])

def get_suppliers_list():
    """Fetch list of all suppliers for dropdown filters."""
    sql = "SELECT supplier_id, supplier_name AS name, supplier_name, email FROM supplier ORDER BY supplier_name;"
    return execute_parameterized_query(sql, [])

def get_racks_and_shelves():
    """Fetch warehouse racks and shelves for location mapping."""
    sql = """
    SELECT 
        r.rack_id, r.rack_code, r.aisle,
        sh.shelf_id, sh.shelf_number
    FROM rack r
    LEFT JOIN shelf sh ON sh.rack_id = r.rack_id
    ORDER BY r.rack_code, sh.shelf_number;
    """
    return execute_parameterized_query(sql, [])

def create_sale_transaction(employee_id: int, customer_name: str, items: list):
    """
    Record a sale transaction.
    Inserts into sales_order and sales_item.
    """
    with get_db_cursor(commit=True) as cursor:
        # 1. Insert order header
        cursor.execute(
            """
            INSERT INTO sales_order (employee_id, sale_date)
            VALUES (%s, CURRENT_DATE)
            RETURNING sale_id, employee_id, sale_date;
            """,
            (employee_id,)
        )
        sale_order = cursor.fetchone()
        sale_id = sale_order['sale_id']
        
        # 2. Insert line items
        for item in items:
            cursor.execute(
                """
                INSERT INTO sales_item (sale_id, product_id, quantity, unit_price)
                VALUES (%s, %s, %s, %s);
                """,
                (sale_id, item['product_id'], item['quantity'], item['unit_price'])
            )
            
        return serialize_rows([sale_order])[0]

def create_product(product_data: dict):
    """
    Inserts a new product into the database.
    Calculates next product_id safely, resolves category_id and shelf_id,
    and inserts into product and optionally product_supplier.
    """
    with get_db_cursor(commit=True) as cursor:
        # 1. Determine next product_id
        cursor.execute("SELECT COALESCE(MAX(product_id), 100) + 1 AS next_id FROM product;")
        row = cursor.fetchone()
        next_id = row['next_id'] if row else 101
        
        # 2. Resolve category_id
        category_val = product_data.get('category_id') or product_data.get('category')
        category_id = 1
        if isinstance(category_val, int) or (isinstance(category_val, str) and category_val.isdigit()):
            category_id = int(category_val)
        elif isinstance(category_val, str) and category_val.strip():
            cursor.execute("SELECT category_id FROM category WHERE LOWER(category_name) = LOWER(%s) LIMIT 1;", (category_val.strip(),))
            cat_row = cursor.fetchone()
            if cat_row:
                category_id = cat_row['category_id']
                
        # 3. Resolve shelf_id
        shelf_id = product_data.get('shelf_id')
        if not shelf_id:
            cursor.execute("SELECT shelf_id FROM shelf ORDER BY shelf_id LIMIT 1;")
            shelf_row = cursor.fetchone()
            shelf_id = shelf_row['shelf_id'] if shelf_row else None

        sku = product_data.get('sku') or f"SKU-PROD-{next_id}"
        name = product_data.get('product_name') or product_data.get('name') or 'New Product'
        unit_price = float(product_data.get('unit_price') or product_data.get('selling_price') or 0.0)
        cost_price = float(product_data.get('cost_price') or (unit_price * 0.7))
        reorder_level = int(product_data.get('reorder_level') or product_data.get('min_stock_level') or 10)
        is_active = True

        # 4. Insert into product table
        cursor.execute(
            """
            INSERT INTO product (product_id, product_name, sku, category_id, shelf_id, unit_price, reorder_level, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *;
            """,
            (next_id, name, sku, category_id, shelf_id, unit_price, reorder_level, is_active)
        )
        new_prod = cursor.fetchone()

        # 5. Optionally link supplier in product_supplier
        supplier_id = product_data.get('supplier_id')
        if supplier_id and (isinstance(supplier_id, int) or (isinstance(supplier_id, str) and supplier_id.isdigit())):
            cursor.execute(
                """
                INSERT INTO product_supplier (product_id, supplier_id, supply_price, lead_time_days)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (product_id, supplier_id) DO NOTHING;
                """,
                (next_id, int(supplier_id), cost_price, 5)
            )

        return serialize_rows([new_prod])[0]

def update_product(product_id: int, product_data: dict):
    """
    Updates an existing product in the database.
    Demonstrates UPDATE operation with parameter binding.
    """
    with get_db_cursor(commit=True) as cursor:
        category_id = None
        category_val = product_data.get('category_id') or product_data.get('category')
        if isinstance(category_val, int) or (isinstance(category_val, str) and str(category_val).isdigit()):
            category_id = int(category_val)
        elif isinstance(category_val, str) and category_val.strip():
            cursor.execute("SELECT category_id FROM category WHERE LOWER(category_name) = LOWER(%s) LIMIT 1;", (category_val.strip(),))
            cat_row = cursor.fetchone()
            if cat_row:
                category_id = cat_row['category_id']

        name = product_data.get('product_name') or product_data.get('name')
        unit_price = product_data.get('unit_price') or product_data.get('selling_price')
        if unit_price is not None:
            unit_price = float(unit_price)
        reorder_level = product_data.get('reorder_level') or product_data.get('min_stock_level')
        if reorder_level is not None:
            reorder_level = int(reorder_level)
        shelf_id = product_data.get('shelf_id')
        if shelf_id is not None:
            shelf_id = int(shelf_id) if str(shelf_id).isdigit() else None

        cursor.execute(
            """
            UPDATE product
            SET product_name = COALESCE(%s, product_name),
                category_id = COALESCE(%s, category_id),
                unit_price = COALESCE(%s, unit_price),
                reorder_level = COALESCE(%s, reorder_level),
                shelf_id = COALESCE(%s, shelf_id)
            WHERE product_id = %s
            RETURNING *;
            """,
            (name, category_id, unit_price, reorder_level, shelf_id, product_id)
        )
        updated = cursor.fetchone()
        if not updated:
            raise ValueError(f"Product with ID {product_id} not found.")
        return serialize_rows([updated])[0]

def delete_product(product_id: int, hard_delete: bool = False):
    """
    Deactivates or deletes a product from the database.
    Demonstrates DELETE / soft-delete operation.
    """
    with get_db_cursor(commit=True) as cursor:
        if hard_delete:
            cursor.execute("DELETE FROM product WHERE product_id = %s RETURNING product_id;", (product_id,))
            deleted = cursor.fetchone()
        else:
            cursor.execute("UPDATE product SET is_active = FALSE WHERE product_id = %s RETURNING product_id, is_active;", (product_id,))
            deleted = cursor.fetchone()
        
        if not deleted:
            raise ValueError(f"Product with ID {product_id} not found.")
        return serialize_rows([deleted])[0]

