from metadata_service import ALLOWED_TABLES, SCHEMA, get_columns
from database import execute_query_with_timing

TABLE_ALIASES = {
    "usuario": "u", "tarjeta": "t", "boleto": "b", "ruta": "r",
    "bus": "bu", "paradero": "p", "recarga": "re", "punto_recarga": "pr",
    "incidente": "i", "detalle_incidente": "di", "conductor": "c",
    "conduce": "co", "ruta_paradero": "rp",
}

ALLOWED_OPERATORS = {"=", "!=", ">", ">=", "<", "<=", "LIKE", "ILIKE", "IN", "BETWEEN"}
ALLOWED_AGGREGATIONS = {"COUNT", "SUM", "AVG", "MIN", "MAX", ""}
ALLOWED_ORDER_DIRS = {"ASC", "DESC", ""}
MAX_LIMIT = 500


def validate_payload(payload):
    tables = payload.get("tables", [])
    if not tables:
        raise ValueError("At least one table is required")
    for t in tables:
        if t not in ALLOWED_TABLES:
            raise ValueError(f"Table '{t}' is not allowed")

    allowed_columns = {}
    for t in tables:
        cols = get_columns(t)
        allowed_columns[t] = {c["column_name"] for c in cols}

    for sc in payload.get("selected_columns", []):
        t = sc.get("table")
        col = sc.get("column")
        if t not in allowed_columns:
            raise ValueError(f"Table '{t}' not in query tables")
        if col not in allowed_columns[t]:
            raise ValueError(f"Column '{col}' not in table '{t}'")
        agg = (sc.get("aggregation") or "").upper()
        if agg not in ALLOWED_AGGREGATIONS:
            raise ValueError(f"Aggregation '{agg}' not allowed")

    for j in payload.get("joins", []):
        for k in ["left_table", "right_table"]:
            if j.get(k) not in ALLOWED_TABLES:
                raise ValueError(f"Join table '{j.get(k)}' not allowed")
        lt, rt = j["left_table"], j["right_table"]
        if lt in allowed_columns and j["left_column"] not in allowed_columns[lt]:
            raise ValueError(f"Join column '{j['left_column']}' not in table '{lt}'")
        if rt in allowed_columns and j["right_column"] not in allowed_columns[rt]:
            raise ValueError(f"Join column '{j['right_column']}' not in table '{rt}'")

    for f in payload.get("filters", []):
        t, col, op = f.get("table"), f.get("column"), (f.get("operator") or "").upper()
        if t not in allowed_columns:
            raise ValueError(f"Filter table '{t}' not allowed")
        if col not in allowed_columns[t]:
            raise ValueError(f"Filter column '{col}' not in table '{t}'")
        if op not in ALLOWED_OPERATORS:
            raise ValueError(f"Operator '{op}' not allowed")

    for o in payload.get("order_by", []):
        t, col, direction = o.get("table"), o.get("column"), (o.get("direction") or "").upper()
        if t not in allowed_columns:
            raise ValueError(f"Order table '{t}' not allowed")
        if col not in allowed_columns[t]:
            raise ValueError(f"Order column '{col}' not in table '{t}'")
        if direction not in ALLOWED_ORDER_DIRS:
            raise ValueError(f"Direction '{direction}' not allowed")

    limit = payload.get("limit", 100)
    if not isinstance(limit, int) or limit < 1:
        raise ValueError("Limit must be a positive integer")
    if limit > MAX_LIMIT:
        raise ValueError(f"Limit cannot exceed {MAX_LIMIT}")

    return allowed_columns


def build_select_clause(selected_columns, tables):
    if not selected_columns:
        return "SELECT " + ", ".join(f"{TABLE_ALIASES.get(t, t)}.*" for t in tables)
    parts = []
    for sc in selected_columns:
        a = TABLE_ALIASES.get(sc["table"], sc["table"])
        col = sc["column"]
        agg = (sc.get("aggregation") or "").upper()
        alias = sc.get("alias", "")
        expr = f"{agg}({a}.{col})" if agg else f"{a}.{col}"
        if alias and alias != col:
            expr += f' AS "{alias}"'
        parts.append(expr)
    return "SELECT " + ", ".join(parts)


def build_from_and_joins(tables, joins):
    first = tables[0]
    alias = TABLE_ALIASES.get(first, first)
    sql = f"FROM {SCHEMA}.{first} {alias}"
    joined = {first}
    for j in joins:
        lt, lc, rt, rc = j["left_table"], j["left_column"], j["right_table"], j["right_column"]
        la, ra = TABLE_ALIASES.get(lt, lt), TABLE_ALIASES.get(rt, rt)
        if rt not in joined:
            sql += f"\nJOIN {SCHEMA}.{rt} {ra} ON {la}.{lc} = {ra}.{rc}"
            joined.add(rt)
        elif lt not in joined:
            sql += f"\nJOIN {SCHEMA}.{lt} {la} ON {ra}.{rc} = {la}.{lc}"
            joined.add(lt)
    for t in tables:
        if t not in joined:
            a = TABLE_ALIASES.get(t, t)
            sql += f"\nCROSS JOIN {SCHEMA}.{t} {a}"
            joined.add(t)
    return sql


def build_where_clause(filters):
    if not filters:
        return "", []
    conditions, params = [], []
    for f in filters:
        a = TABLE_ALIASES.get(f["table"], f["table"])
        col, op, val = f["column"], f["operator"].upper(), f["value"]
        if op == "IN":
            items = val if isinstance(val, list) else [val]
            conditions.append(f"{a}.{col} IN ({', '.join(['%s'] * len(items))})")
            params.extend(items)
        elif op == "BETWEEN":
            if not isinstance(val, list) or len(val) != 2:
                raise ValueError("BETWEEN requires a list of two values")
            conditions.append(f"{a}.{col} BETWEEN %s AND %s")
            params.extend(val)
        else:
            conditions.append(f"{a}.{col} {op} %s")
            params.append(val)
    return "WHERE " + " AND ".join(conditions), params


def build_order_by(order_by):
    if not order_by:
        return ""
    parts = []
    for o in order_by:
        a = TABLE_ALIASES.get(o["table"], o["table"])
        d = (o.get("direction") or "").upper()
        parts.append(f"{a}.{o['column']} {d}".strip())
    return "ORDER BY " + ", ".join(parts)


def build_limit(limit):
    return f"LIMIT {limit}"


def build_sql(payload):
    validate_payload(payload)
    tables = payload["tables"]
    select = build_select_clause(payload.get("selected_columns", []), tables)
    from_join = build_from_and_joins(tables, payload.get("joins", []))
    where, params = build_where_clause(payload.get("filters", []))
    order = build_order_by(payload.get("order_by", []))
    limit = build_limit(payload.get("limit", 100))

    parts = [select, from_join]
    if where:
        parts.append(where)
    if order:
        parts.append(order)
    parts.append(limit)
    return "\n".join(parts) + ";", params


def execute_query_builder(payload):
    sql, params = build_sql(payload)
    rows, elapsed = execute_query_with_timing(sql, params or None)
    return {
        "sql": sql,
        "execution_time_ms": round(elapsed, 2),
        "row_count": len(rows),
        "rows": rows,
    }


def execute_explain(payload):
    sql, params = build_sql(payload)
    explain_sql = "EXPLAIN ANALYZE " + sql
    rows, elapsed = execute_query_with_timing(explain_sql, params or None)
    plan_lines = [list(r.values())[0] for r in rows]
    return {"sql": explain_sql, "plan": plan_lines}
