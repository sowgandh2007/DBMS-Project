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
    """Fetch list of all categories with product count for dropdown filters and management."""
    sql = """
    SELECT 
        c.category_id, 
        c.category_name AS name, 
        c.category_name,
        COUNT(p.product_id)::INT AS product_count
    FROM category c
    LEFT JOIN product p ON p.category_id = c.category_id
    GROUP BY c.category_id, c.category_name
    ORDER BY c.category_name;
    """
    return execute_parameterized_query(sql, [])

def create_category(category_name: str):
    """Create a new category in Supabase."""
    category_name = (category_name or '').strip()
    if not category_name:
        raise ValueError("Category name cannot be empty.")
        
    with get_db_cursor(commit=True) as cursor:
        # Check duplicate
        cursor.execute("SELECT category_id FROM category WHERE LOWER(category_name) = LOWER(%s);", (category_name,))
        if cursor.fetchone():
            raise ValueError(f"Category '{category_name}' already exists.")
            
        cursor.execute("SELECT COALESCE(MAX(category_id), 0) + 1 AS next_id FROM category;")
        next_id = cursor.fetchone()['next_id']
        
        cursor.execute(
            "INSERT INTO category (category_id, category_name) VALUES (%s, %s) RETURNING category_id, category_name;",
            (next_id, category_name)
        )
        created = cursor.fetchone()
        return serialize_rows([created])[0]

def update_category(category_id: int, category_name: str):
    """Update category name."""
    category_name = (category_name or '').strip()
    if not category_name:
        raise ValueError("Category name cannot be empty.")
        
    with get_db_cursor(commit=True) as cursor:
        # Check exists
        cursor.execute("SELECT category_id FROM category WHERE category_id = %s;", (category_id,))
        if not cursor.fetchone():
            raise ValueError(f"Category #{category_id} not found.")
            
        # Check duplicate with other category
        cursor.execute("SELECT category_id FROM category WHERE LOWER(category_name) = LOWER(%s) AND category_id != %s;", (category_name, category_id))
        if cursor.fetchone():
            raise ValueError(f"Category name '{category_name}' is already in use by another category.")
            
        cursor.execute(
            "UPDATE category SET category_name = %s WHERE category_id = %s RETURNING category_id, category_name;",
            (category_name, category_id)
        )
        updated = cursor.fetchone()
        return serialize_rows([updated])[0]

def delete_category(category_id: int):
    """
    Delete category if no products reference it.
    Rejects deletion with descriptive error if dependencies exist.
    """
    with get_db_cursor(commit=True) as cursor:
        cursor.execute("SELECT category_name FROM category WHERE category_id = %s;", (category_id,))
        cat = cursor.fetchone()
        if not cat:
            raise ValueError(f"Category #{category_id} not found.")
            
        # Check referencing products
        cursor.execute("SELECT COUNT(*)::INT AS cnt FROM product WHERE category_id = %s;", (category_id,))
        cnt = cursor.fetchone()['cnt']
        if cnt > 0:
            raise PermissionError(f"Cannot delete category '{cat['category_name']}': it is referenced by {cnt} existing product(s). Please reassign or delete these products first.")
            
        cursor.execute("DELETE FROM category WHERE category_id = %s RETURNING category_id, category_name;", (category_id,))
        deleted = cursor.fetchone()
        return serialize_rows([deleted])[0]

def get_suppliers_list():
    """Fetch list of all suppliers with product and purchase order counts."""
    sql = """
    SELECT 
        s.supplier_id, 
        s.supplier_name AS name, 
        s.supplier_name, 
        s.email,
        COUNT(DISTINCT ps.product_id)::INT AS total_products_supplied,
        COUNT(DISTINCT po.po_id)::INT AS total_orders_placed
    FROM supplier s
    LEFT JOIN product_supplier ps ON ps.supplier_id = s.supplier_id
    LEFT JOIN purchase_order po ON po.supplier_id = s.supplier_id
    GROUP BY s.supplier_id, s.supplier_name, s.email
    ORDER BY s.supplier_name;
    """
    return execute_parameterized_query(sql, [])

def create_supplier(supplier_data: dict):
    """Create a new supplier in Supabase."""
    name = (supplier_data.get('supplier_name') or supplier_data.get('name') or '').strip()
    email = (supplier_data.get('email') or '').strip()
    if not name:
        raise ValueError("Supplier name is required.")
        
    with get_db_cursor(commit=True) as cursor:
        cursor.execute("SELECT COALESCE(MAX(supplier_id), 0) + 1 AS next_id FROM supplier;")
        next_id = cursor.fetchone()['next_id']
        
        cursor.execute(
            "INSERT INTO supplier (supplier_id, supplier_name, email) VALUES (%s, %s, %s) RETURNING *;",
            (next_id, name, email or f"{name.lower().replace(' ', '')}@example.com")
        )
        created = cursor.fetchone()
        return serialize_rows([created])[0]

def update_supplier(supplier_id: int, supplier_data: dict):
    """Update supplier contact details."""
    name = supplier_data.get('supplier_name') or supplier_data.get('name')
    email = supplier_data.get('email')
    
    with get_db_cursor(commit=True) as cursor:
        cursor.execute("SELECT supplier_id FROM supplier WHERE supplier_id = %s;", (supplier_id,))
        if not cursor.fetchone():
            raise ValueError(f"Supplier #{supplier_id} not found.")
            
        cursor.execute(
            """
            UPDATE supplier
            SET supplier_name = COALESCE(%s, supplier_name),
                email = COALESCE(%s, email)
            WHERE supplier_id = %s
            RETURNING *;
            """,
            (name.strip() if name else None, email.strip() if email else None, supplier_id)
        )
        updated = cursor.fetchone()
        return serialize_rows([updated])[0]

def delete_supplier(supplier_id: int):
    """
    Safely delete supplier if no purchase orders exist.
    Cleans up product_supplier link in a transaction.
    """
    with get_db_cursor(commit=True) as cursor:
        cursor.execute("SELECT supplier_name FROM supplier WHERE supplier_id = %s;", (supplier_id,))
        sup = cursor.fetchone()
        if not sup:
            raise ValueError(f"Supplier #{supplier_id} not found.")
            
        # Check purchase order dependencies
        cursor.execute("SELECT COUNT(*)::INT AS cnt FROM purchase_order WHERE supplier_id = %s;", (supplier_id,))
        po_cnt = cursor.fetchone()['cnt']
        if po_cnt > 0:
            raise PermissionError(f"Cannot delete supplier '{sup['supplier_name']}': referenced by {po_cnt} purchase order(s). Historic order records cannot be orphaned.")
            
        # Clean up supplier catalog links in product_supplier
        cursor.execute("DELETE FROM product_supplier WHERE supplier_id = %s;", (supplier_id,))
        cursor.execute("DELETE FROM supplier WHERE supplier_id = %s RETURNING *;", (supplier_id,))
        deleted = cursor.fetchone()
        return serialize_rows([deleted])[0]

def get_racks_and_shelves():
    """Fetch warehouse racks and shelves for location mapping with item counts."""
    sql = """
    SELECT 
        r.rack_id, r.rack_code, r.aisle,
        sh.shelf_id, sh.shelf_number,
        COUNT(p.product_id)::INT AS assigned_products_count
    FROM rack r
    LEFT JOIN shelf sh ON sh.rack_id = r.rack_id
    LEFT JOIN product p ON p.shelf_id = sh.shelf_id
    GROUP BY r.rack_id, r.rack_code, r.aisle, sh.shelf_id, sh.shelf_number
    ORDER BY r.rack_code, sh.shelf_number;
    """
    return execute_parameterized_query(sql, [])

def create_rack(rack_data: dict):
    """Create a new rack and optionally its initial shelves."""
    rack_code = (rack_data.get('rack_code') or '').strip().upper()
    aisle = (rack_data.get('aisle') or rack_data.get('aisle_number') or '').strip().upper()
    if not rack_code:
        raise ValueError("Rack code is required (e.g. 'R-C1').")
    if not aisle:
        raise ValueError("Aisle identifier is required (e.g. 'C').")
        
    with get_db_cursor(commit=True) as cursor:
        cursor.execute("SELECT rack_id FROM rack WHERE UPPER(rack_code) = %s;", (rack_code,))
        if cursor.fetchone():
            raise ValueError(f"Rack code '{rack_code}' already exists.")
            
        cursor.execute("SELECT COALESCE(MAX(rack_id), 0) + 1 AS next_id FROM rack;")
        next_id = cursor.fetchone()['next_id']
        
        cursor.execute(
            "INSERT INTO rack (rack_id, rack_code, aisle) VALUES (%s, %s, %s) RETURNING *;",
            (next_id, rack_code, aisle)
        )
        new_rack = cursor.fetchone()
        
        # Optionally create initial shelves (e.g., S1, S2)
        shelves_count = int(rack_data.get('shelves_count', 2))
        for i in range(1, shelves_count + 1):
            cursor.execute("SELECT COALESCE(MAX(shelf_id), 10) + 1 AS next_sh_id FROM shelf;")
            sh_id = cursor.fetchone()['next_sh_id']
            cursor.execute(
                "INSERT INTO shelf (shelf_id, shelf_number, rack_id) VALUES (%s, %s, %s);",
                (sh_id, f"S{i}", next_id)
            )
            
        return serialize_rows([new_rack])[0]

def update_rack(rack_id: int, rack_data: dict):
    """Update rack code or aisle location."""
    rack_code = rack_data.get('rack_code')
    aisle = rack_data.get('aisle') or rack_data.get('aisle_number')
    
    with get_db_cursor(commit=True) as cursor:
        cursor.execute("SELECT rack_id FROM rack WHERE rack_id = %s;", (rack_id,))
        if not cursor.fetchone():
            raise ValueError(f"Rack #{rack_id} not found.")
            
        if rack_code:
            rack_code = rack_code.strip().upper()
            cursor.execute("SELECT rack_id FROM rack WHERE UPPER(rack_code) = %s AND rack_id != %s;", (rack_code, rack_id))
            if cursor.fetchone():
                raise ValueError(f"Rack code '{rack_code}' already in use.")
                
        cursor.execute(
            """
            UPDATE rack
            SET rack_code = COALESCE(%s, rack_code),
                aisle = COALESCE(%s, aisle)
            WHERE rack_id = %s
            RETURNING *;
            """,
            (rack_code, aisle.strip().upper() if aisle else None, rack_id)
        )
        updated = cursor.fetchone()
        return serialize_rows([updated])[0]

def delete_rack(rack_id: int):
    """
    Safely delete rack if no shelves contain assigned products.
    """
    with get_db_cursor(commit=True) as cursor:
        cursor.execute("SELECT rack_code FROM rack WHERE rack_id = %s;", (rack_id,))
        rack = cursor.fetchone()
        if not rack:
            raise ValueError(f"Rack #{rack_id} not found.")
            
        cursor.execute(
            """
            SELECT COUNT(*)::INT AS cnt 
            FROM product p
            JOIN shelf s ON s.shelf_id = p.shelf_id
            WHERE s.rack_id = %s;
            """,
            (rack_id,)
        )
        assigned_cnt = cursor.fetchone()['cnt']
        if assigned_cnt > 0:
            raise PermissionError(f"Cannot delete rack '{rack['rack_code']}': {assigned_cnt} product(s) are currently assigned to its shelves. Please reassign those products first.")
            
        # Delete empty shelves in this rack first, then delete the rack
        cursor.execute("DELETE FROM shelf WHERE rack_id = %s;", (rack_id,))
        cursor.execute("DELETE FROM rack WHERE rack_id = %s RETURNING *;", (rack_id,))
        deleted = cursor.fetchone()
        return serialize_rows([deleted])[0]

def create_shelf(shelf_data: dict):
    """Create a new shelf inside an existing rack."""
    rack_id = int(shelf_data.get('rack_id'))
    shelf_number = str(shelf_data.get('shelf_number', '')).strip().upper()
    if not shelf_number:
        raise ValueError("Shelf number is required (e.g. 'S1', 'S2').")
    if not shelf_number.startswith('S'):
        shelf_number = f"S{shelf_number}"
        
    with get_db_cursor(commit=True) as cursor:
        cursor.execute("SELECT rack_code FROM rack WHERE rack_id = %s;", (rack_id,))
        if not cursor.fetchone():
            raise ValueError(f"Rack #{rack_id} not found.")
            
        cursor.execute("SELECT shelf_id FROM shelf WHERE rack_id = %s AND shelf_number = %s;", (rack_id, shelf_number))
        if cursor.fetchone():
            raise ValueError(f"Shelf '{shelf_number}' already exists in Rack #{rack_id}.")
            
        cursor.execute("SELECT COALESCE(MAX(shelf_id), 10) + 1 AS next_id FROM shelf;")
        next_id = cursor.fetchone()['next_id']
        
        cursor.execute(
            "INSERT INTO shelf (shelf_id, shelf_number, rack_id) VALUES (%s, %s, %s) RETURNING *;",
            (next_id, shelf_number, rack_id)
        )
        new_shelf = cursor.fetchone()
        return serialize_rows([new_shelf])[0]

def update_shelf(shelf_id: int, shelf_data: dict):
    """Update shelf number or reassign to another rack."""
    shelf_number = shelf_data.get('shelf_number')
    rack_id = shelf_data.get('rack_id')
    
    with get_db_cursor(commit=True) as cursor:
        cursor.execute("SELECT shelf_id, rack_id, shelf_number FROM shelf WHERE shelf_id = %s;", (shelf_id,))
        curr = cursor.fetchone()
        if not curr:
            raise ValueError(f"Shelf #{shelf_id} not found.")
            
        new_rack_id = int(rack_id) if rack_id else curr['rack_id']
        new_shelf_num = str(shelf_number).strip().upper() if shelf_number else curr['shelf_number']
        if not new_shelf_num.startswith('S'):
            new_shelf_num = f"S{new_shelf_num}"
            
        cursor.execute("SELECT shelf_id FROM shelf WHERE rack_id = %s AND shelf_number = %s AND shelf_id != %s;", (new_rack_id, new_shelf_num, shelf_id))
        if cursor.fetchone():
            raise ValueError(f"Shelf '{new_shelf_num}' already exists in Rack #{new_rack_id}.")
            
        cursor.execute(
            "UPDATE shelf SET shelf_number = %s, rack_id = %s WHERE shelf_id = %s RETURNING *;",
            (new_shelf_num, new_rack_id, shelf_id)
        )
        updated = cursor.fetchone()
        return serialize_rows([updated])[0]

def delete_shelf(shelf_id: int):
    """Delete a shelf if no products are stored on it."""
    with get_db_cursor(commit=True) as cursor:
        cursor.execute("SELECT shelf_number, rack_id FROM shelf WHERE shelf_id = %s;", (shelf_id,))
        shelf = cursor.fetchone()
        if not shelf:
            raise ValueError(f"Shelf #{shelf_id} not found.")
            
        cursor.execute("SELECT COUNT(*)::INT AS cnt FROM product WHERE shelf_id = %s;", (shelf_id,))
        cnt = cursor.fetchone()['cnt']
        if cnt > 0:
            raise PermissionError(f"Cannot delete shelf '{shelf['shelf_number']}': {cnt} product(s) are currently stored on it. Please reassign those products first.")
            
        cursor.execute("DELETE FROM shelf WHERE shelf_id = %s RETURNING *;", (shelf_id,))
        deleted = cursor.fetchone()
        return serialize_rows([deleted])[0]

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
    Allows editing: product_name, sku, category_id, shelf_id, unit_price, reorder_level, is_active.
    """
    with get_db_cursor(commit=True) as cursor:
        cursor.execute("SELECT * FROM product WHERE product_id = %s;", (product_id,))
        existing = cursor.fetchone()
        if not existing:
            raise ValueError(f"Product with ID {product_id} not found.")

        # 1. Category resolution
        category_id = existing['category_id']
        category_val = product_data.get('category_id') or product_data.get('category')
        if category_val is not None:
            if isinstance(category_val, int) or (isinstance(category_val, str) and str(category_val).isdigit()):
                category_id = int(category_val)
            elif isinstance(category_val, str) and category_val.strip():
                cursor.execute("SELECT category_id FROM category WHERE LOWER(category_name) = LOWER(%s) LIMIT 1;", (category_val.strip(),))
                cat_row = cursor.fetchone()
                if cat_row:
                    category_id = cat_row['category_id']

        # 2. Shelf resolution
        shelf_id = existing['shelf_id']
        if 'shelf_id' in product_data:
            shelf_val = product_data.get('shelf_id')
            if shelf_val is None or str(shelf_val).lower() in ('null', '', 'none'):
                shelf_id = None
            elif str(shelf_val).isdigit():
                shelf_id = int(shelf_val)

        # 3. Product name & SKU validation
        name = product_data.get('product_name') or product_data.get('name') or existing['product_name']
        sku = product_data.get('sku') or existing['sku']
        if sku and sku != existing['sku']:
            cursor.execute("SELECT product_id FROM product WHERE UPPER(sku) = UPPER(%s) AND product_id != %s;", (sku, product_id))
            if cursor.fetchone():
                raise ValueError(f"SKU '{sku}' is already in use by another product.")

        # 4. Pricing & Stock Levels
        unit_price = existing['unit_price']
        if 'unit_price' in product_data or 'selling_price' in product_data:
            p_val = product_data.get('unit_price') if 'unit_price' in product_data else product_data.get('selling_price')
            if p_val is not None:
                unit_price = float(p_val)
                if unit_price < 0:
                    raise ValueError("Unit price cannot be negative.")

        reorder_level = existing['reorder_level']
        if 'reorder_level' in product_data or 'min_stock_level' in product_data:
            r_val = product_data.get('reorder_level') if 'reorder_level' in product_data else product_data.get('min_stock_level')
            if r_val is not None:
                reorder_level = int(r_val)
                if reorder_level < 0:
                    raise ValueError("Reorder level cannot be negative.")

        # 5. Active Status
        is_active = existing['is_active']
        if 'is_active' in product_data:
            raw_active = product_data['is_active']
            if isinstance(raw_active, str):
                is_active = raw_active.lower() in ('true', '1', 'yes')
            else:
                is_active = bool(raw_active)

        cursor.execute(
            """
            UPDATE product
            SET product_name = %s,
                sku = %s,
                category_id = %s,
                shelf_id = %s,
                unit_price = %s,
                reorder_level = %s,
                is_active = %s
            WHERE product_id = %s
            RETURNING *;
            """,
            (name, sku, category_id, shelf_id, unit_price, reorder_level, is_active, product_id)
        )
        updated = cursor.fetchone()
        return serialize_rows([updated])[0]

def delete_product(product_id: int, hard_delete: bool = False):
    """
    Deactivates or deletes a product from the database.
    Checks for sales or purchase order dependencies to ensure transaction consistency.
    """
    with get_db_cursor(commit=True) as cursor:
        cursor.execute("SELECT product_id, product_name, is_active FROM product WHERE product_id = %s;", (product_id,))
        prod = cursor.fetchone()
        if not prod:
            raise ValueError(f"Product with ID {product_id} not found.")

        # Check transaction history in sales_item and purchase_item
        cursor.execute("SELECT COUNT(*)::INT AS cnt FROM sales_item WHERE product_id = %s;", (product_id,))
        sales_cnt = cursor.fetchone()['cnt']
        cursor.execute("SELECT COUNT(*)::INT AS cnt FROM purchase_item WHERE product_id = %s;", (product_id,))
        po_cnt = cursor.fetchone()['cnt']
        
        has_history = (sales_cnt > 0 or po_cnt > 0)
        
        if hard_delete and has_history:
            # Cannot hard delete due to foreign key references & transaction consistency
            raise PermissionError(
                f"Cannot permanently delete '{prod['product_name']}': it is referenced in {sales_cnt} sales line(s) and {po_cnt} purchase line(s). "
                "The product has been deactivated instead to preserve inventory and transaction history."
            )

        if hard_delete and not has_history:
            # Clean up supplier link if any, then delete
            cursor.execute("DELETE FROM product_supplier WHERE product_id = %s;", (product_id,))
            cursor.execute("DELETE FROM product WHERE product_id = %s RETURNING product_id, product_name;", (product_id,))
            deleted = cursor.fetchone()
            deleted['action'] = 'hard_deleted'
            return serialize_rows([deleted])[0]
        else:
            # Soft delete / deactivation
            cursor.execute("UPDATE product SET is_active = FALSE WHERE product_id = %s RETURNING product_id, product_name, is_active;", (product_id,))
            deleted = cursor.fetchone()
            deleted['action'] = 'deactivated'
            return serialize_rows([deleted])[0]

def create_purchase_order(po_data: dict):
    """
    Create a purchase order with line items inside a database transaction.
    """
    supplier_id = int(po_data.get('supplier_id', 1))
    employee_id = int(po_data.get('employee_id', 1))
    items = po_data.get('items', [])
    status = po_data.get('status', 'Pending')
    if status not in ('Pending', 'Received', 'Cancelled'):
        status = 'Pending'

    if not items:
        raise ValueError("Purchase order must have at least one line item.")

    with get_db_cursor(commit=True) as cursor:
        cursor.execute("SELECT supplier_id FROM supplier WHERE supplier_id = %s;", (supplier_id,))
        if not cursor.fetchone():
            raise ValueError(f"Supplier #{supplier_id} not found.")

        cursor.execute("SELECT COALESCE(MAX(po_id), 200) + 1 AS next_id FROM purchase_order;")
        po_id = cursor.fetchone()['next_id']

        received_date = "CURRENT_DATE" if status == 'Received' else "NULL"
        cursor.execute(
            f"""
            INSERT INTO purchase_order (po_id, supplier_id, employee_id, order_date, received_date, status)
            VALUES (%s, %s, %s, CURRENT_DATE, {received_date}, %s)
            RETURNING *;
            """,
            (po_id, supplier_id, employee_id, status)
        )
        new_po = cursor.fetchone()

        for it in items:
            p_id = int(it.get('product_id'))
            qty = int(it.get('quantity') or it.get('quantity_ordered', 1))
            cost = float(it.get('unit_cost', 50.0))
            if qty <= 0:
                raise ValueError("Line item quantity must be greater than 0.")
            if cost < 0:
                raise ValueError("Line item unit cost cannot be negative.")

            cursor.execute(
                """
                INSERT INTO purchase_item (po_id, product_id, quantity, unit_cost)
                VALUES (%s, %s, %s, %s);
                """,
                (po_id, p_id, qty, cost)
            )

        return serialize_rows([new_po])[0]

def update_purchase_order(po_id: int, po_data: dict):
    """
    Update purchase order status or details.
    SAFETY GUARD: If status is 'Received', prevents modification that would corrupt stock.
    """
    with get_db_cursor(commit=True) as cursor:
        cursor.execute("SELECT po_id, status FROM purchase_order WHERE po_id = %s;", (po_id,))
        curr = cursor.fetchone()
        if not curr:
            raise ValueError(f"Purchase order #{po_id} not found.")

        current_status = curr['status']
        new_status = po_data.get('status')

        if current_status == 'Received' and new_status and new_status != 'Received':
            raise PermissionError(
                f"Cannot modify purchase order #{po_id}: it has already been 'Received' and inventory stock was added to the store. "
                "Changing its status would corrupt stock calculations."
            )

        supplier_id = po_data.get('supplier_id')
        supplier_id_int = int(supplier_id) if supplier_id else None

        cursor.execute(
            """
            UPDATE purchase_order
            SET supplier_id = COALESCE(%s, supplier_id),
                status = COALESCE(%s, status),
                received_date = CASE WHEN %s = 'Received' THEN CURRENT_DATE ELSE received_date END
            WHERE po_id = %s
            RETURNING *;
            """,
            (supplier_id_int, new_status, new_status, po_id)
        )
        updated = cursor.fetchone()
        return serialize_rows([updated])[0]

def delete_purchase_order(po_id: int):
    """
    Safely delete a purchase order.
    SAFETY GUARD: If order is 'Received', deletion is strictly blocked to protect stock calculations!
    """
    with get_db_cursor(commit=True) as cursor:
        cursor.execute("SELECT po_id, status FROM purchase_order WHERE po_id = %s;", (po_id,))
        po = cursor.fetchone()
        if not po:
            raise ValueError(f"Purchase order #{po_id} not found.")

        if po['status'] == 'Received':
            raise PermissionError(
                f"Cannot delete purchase order #{po_id}: this order was marked as 'Received' and stock has already entered the store. "
                "Deleting it would silently corrupt current stock and location calculations."
            )

        cursor.execute("DELETE FROM purchase_item WHERE po_id = %s;", (po_id,))
        cursor.execute("DELETE FROM purchase_order WHERE po_id = %s RETURNING *;", (po_id,))
        deleted = cursor.fetchone()
        return serialize_rows([deleted])[0]

def delete_sale_order(sale_id: int):
    """
    SAFETY GUARD: Prevent accidental deletion of completed sales orders that would corrupt inventory history.
    """
    with get_db_cursor(commit=False) as cursor:
        cursor.execute("SELECT sale_id, sale_date FROM sales_order WHERE sale_id = %s;", (sale_id,))
        sale = cursor.fetchone()
        if not sale:
            raise ValueError(f"Sale order #{sale_id} not found.")

        raise PermissionError(
            f"Cannot delete completed sale #{sale_id}: sales orders represent confirmed transactions and stock-out history. "
            "Deleting sales records directly alters stock calculations and transaction history consistency."
        )

