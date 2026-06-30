from database import execute_query, SCHEMA

ALLOWED_TABLES = [
    "usuario", "tarjeta", "boleto", "ruta", "bus", "paradero",
    "ruta_paradero", "recarga", "punto_recarga", "incidente",
    "detalle_incidente", "conductor", "conduce",
]


def get_tables():
    sql = """
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = %s
          AND table_type = 'BASE TABLE'
          AND table_name = ANY(%s)
        ORDER BY table_name
    """
    rows = execute_query(sql, (SCHEMA, ALLOWED_TABLES))
    return [r["table_name"] for r in rows]


def get_columns(table_name):
    if table_name not in ALLOWED_TABLES:
        raise ValueError(f"Table '{table_name}' not allowed")
    sql = """
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = %s AND table_name = %s
        ORDER BY ordinal_position
    """
    return execute_query(sql, (SCHEMA, table_name))


def get_preview(table_name, limit=100):
    if table_name not in ALLOWED_TABLES:
        raise ValueError(f"Table '{table_name}' not allowed")
    limit = min(int(limit), 100)
    sql = f"SELECT * FROM {SCHEMA}.{table_name} LIMIT {limit}"
    return execute_query(sql)


def get_count(table_name):
    if table_name not in ALLOWED_TABLES:
        raise ValueError(f"Table '{table_name}' not allowed")
    rows = execute_query(f"SELECT COUNT(*) AS count FROM {SCHEMA}.{table_name}")
    return rows[0]["count"]
