from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import metadata_service as ms
import query_builder as qb
from database import SCHEMA

app = FastAPI(title="ATU Query Builder API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "schema": SCHEMA}


@app.get("/metadata/tables")
def get_tables():
    try:
        return ms.get_tables()
    except Exception as e:
        raise HTTPException(500, str(e))


@app.get("/metadata/tables/{table_name}/columns")
def get_columns(table_name: str):
    try:
        return ms.get_columns(table_name)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))


@app.get("/metadata/tables/{table_name}/preview")
def get_preview(table_name: str, limit: int = 100):
    try:
        return ms.get_preview(table_name, limit)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))


@app.get("/metadata/tables/{table_name}/count")
def get_count(table_name: str):
    try:
        return {"table": table_name, "count": ms.get_count(table_name)}
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))


class QueryPayload(BaseModel):
    tables: List[str]
    selected_columns: Optional[List[dict]] = []
    joins: Optional[List[dict]] = []
    filters: Optional[List[dict]] = []
    order_by: Optional[List[dict]] = []
    limit: Optional[int] = 100


@app.post("/query-builder/execute")
def execute_query_builder(payload: QueryPayload):
    try:
        return qb.execute_query_builder(payload.model_dump())
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))


@app.post("/query-builder/explain")
def explain_query(payload: QueryPayload):
    try:
        return qb.execute_explain(payload.model_dump())
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))
