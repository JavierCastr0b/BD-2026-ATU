# ATU Consola SQL

Herramienta web de solo lectura para explorar y construir consultas visuales sobre la base de datos de transporte público ATU.

## Que es

Una aplicacion con dos partes principales:

- **Explorador de datos**: selecciona cualquier tabla del esquema `idx_1m` y ve su estructura (columnas, tipos) y una vista previa de los primeros 100 registros.
- **Query Builder**: constructor visual de consultas tipo Access. Agrega tablas al canvas, selecciona columnas con checkboxes, conecta tablas para generar JOINs automaticos, agrega filtros y ordenamientos desde un grid inferior, y ejecuta la consulta contra la base real.

La app nunca modifica datos. Solo ejecuta `SELECT` y `EXPLAIN ANALYZE SELECT`.

## Requisito previo

PostgreSQL corriendo localmente con:

- Base de datos: `transporte_experimentos`
- Esquema: `idx_1m` (ya creado y poblado)

## Instalacion y uso

**Backend**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```

Corre en `http://localhost:8000`. Si la contrasena de PostgreSQL es distinta a `postgres`, editala en el archivo `.env`.

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Corre en `http://localhost:3000`.

## Ejemplo de consulta en el Query Builder

1. Ir a la pestana **Query Builder**
2. Agregar las tablas: `usuario`, `tarjeta`, `boleto`, `ruta`
3. Conectar los nodos: `usuario -> tarjeta -> boleto -> ruta`
4. Marcar las columnas: `usuario.nombre`, `tarjeta.numero_tarjeta`, `boleto.fecha`, `ruta.nombre`
5. En el grid inferior, en la fila de `tarjeta.estado`: operador `=`, criterio `activa`
6. En la fila de `boleto.fecha`: orden `DESC`
7. Limite: `100`
8. Clic en **Ejecutar**

## Seguridad

- Solo se permiten consultas `SELECT`
- Tablas y columnas se validan contra una lista blanca antes de construir el SQL
- Los valores de filtros se pasan como parametros, no interpolados directamente
- Operadores permitidos: `=`, `!=`, `>`, `>=`, `<`, `<=`, `LIKE`, `ILIKE`, `IN`, `BETWEEN`
- Limite maximo: 500 filas

## Stack

| Parte | Tecnologia |
|---|---|
| Backend | Python, FastAPI, psycopg2 |
| Frontend | React, Vite, Tailwind CSS, React Flow |
| Base de datos | PostgreSQL (esquema `idx_1m`) |
