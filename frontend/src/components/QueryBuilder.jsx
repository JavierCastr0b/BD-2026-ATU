import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
  MiniMap,
  Background,
} from 'reactflow'
import 'reactflow/dist/style.css'
import TableNode from './TableNode'
import SchemaExplorer from './SchemaExplorer'
import QueryGrid from './QueryGrid'
import SqlPreview from './SqlPreview'
import QueryResults from './QueryResults'
import ExplainViewer from './ExplainViewer'
import { api } from '../api'

const KNOWN_RELATIONS = [
  { left_table: 'usuario',   left_column: 'id_usuario',      right_table: 'tarjeta',        right_column: 'id_usuario' },
  { left_table: 'tarjeta',   left_column: 'id_tarjeta',      right_table: 'boleto',         right_column: 'id_tarjeta' },
  { left_table: 'boleto',    left_column: 'id_ruta',         right_table: 'ruta',           right_column: 'id_ruta' },
  { left_table: 'boleto',    left_column: 'id_bus',          right_table: 'bus',            right_column: 'id_bus' },
  { left_table: 'boleto',    left_column: 'id_paradero',     right_table: 'paradero',       right_column: 'id_paradero' },
  { left_table: 'ruta',      left_column: 'id_ruta',         right_table: 'ruta_paradero',  right_column: 'id_ruta' },
  { left_table: 'paradero',  left_column: 'id_paradero',     right_table: 'ruta_paradero',  right_column: 'id_paradero' },
  { left_table: 'tarjeta',   left_column: 'id_tarjeta',      right_table: 'recarga',        right_column: 'id_tarjeta' },
  { left_table: 'recarga',   left_column: 'id_punto_recarga',right_table: 'punto_recarga',  right_column: 'id_punto_recarga' },
  { left_table: 'bus',       left_column: 'id_bus',          right_table: 'incidente',      right_column: 'id_bus' },
  { left_table: 'incidente', left_column: 'id_incidente',    right_table: 'detalle_incidente', right_column: 'id_incidente' },
  { left_table: 'conductor', left_column: 'id_conductor',    right_table: 'conduce',        right_column: 'id_conductor' },
  { left_table: 'bus',       left_column: 'id_bus',          right_table: 'conduce',        right_column: 'id_bus' },
  { left_table: 'ruta',      left_column: 'id_ruta',         right_table: 'bus',            right_column: 'id_ruta' },
]

function findRelation(src, tgt) {
  return KNOWN_RELATIONS.find(r =>
    (r.left_table === src && r.right_table === tgt) ||
    (r.left_table === tgt && r.right_table === src)
  )
}

export default function QueryBuilder({ onAddHistorial }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [tableColumns, setTableColumns] = useState({})
  const [columnSelections, setColumnSelections] = useState({})
  const [gridRows, setGridRows] = useState([])
  const [limit, setLimit] = useState(100)
  const [queryResult, setQueryResult] = useState(null)
  const [explainResult, setExplainResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [resultTab, setResultTab] = useState('results')

  const nodeTypes = useMemo(() => ({ tableNode: TableNode }), [])

  // Keep column selections in a ref so callbacks don't go stale
  const colSelectRef = useRef(columnSelections)
  colSelectRef.current = columnSelections

  const toggleColumn = useCallback((tableName, colName) => {
    setColumnSelections(prev => {
      const current = new Set(prev[tableName] || [])
      if (current.has(colName)) current.delete(colName)
      else current.add(colName)
      return { ...prev, [tableName]: new Set(current) }
    })
  }, [])

  // When column selections change, rebuild node data
  useEffect(() => {
    setNodes(nds => nds.map(node => ({
      ...node,
      data: {
        ...node.data,
        checkedColumns: columnSelections[node.id] || new Set(),
        onColumnToggle: (col) => toggleColumn(node.id, col),
      },
    })))
  }, [columnSelections, setNodes, toggleColumn])

  // When column selections change, sync grid rows
  useEffect(() => {
    setGridRows(prev => {
      const incoming = []
      for (const [table, cols] of Object.entries(columnSelections)) {
        for (const col of cols) {
          const existing = prev.find(r => r.table === table && r.column === col)
          incoming.push(existing || {
            table, column: col, show: true, aggregation: '', order: '', operator: '=', value: '',
          })
        }
      }
      return incoming
    })
  }, [columnSelections])

  const addTable = useCallback(async (tableName) => {
    if (nodes.some(n => n.id === tableName)) return
    try {
      const columns = await api.getColumns(tableName)
      setTableColumns(prev => ({ ...prev, [tableName]: columns }))
      setColumnSelections(prev => ({ ...prev, [tableName]: new Set() }))
      setNodes(prev => [
        ...prev,
        {
          id: tableName,
          type: 'tableNode',
          position: { x: 50 + prev.length * 220, y: 80 + (prev.length % 2) * 160 },
          data: {
            tableName,
            columns,
            checkedColumns: new Set(),
            onColumnToggle: (col) => toggleColumn(tableName, col),
          },
        },
      ])
    } catch (e) {
      console.error('addTable error', e)
    }
  }, [nodes, setNodes, toggleColumn])

  const onConnect = useCallback((params) => {
    const rel = findRelation(params.source, params.target)
    const label = rel
      ? `${rel.left_column} = ${rel.right_column}`
      : `join`
    setEdges(prev => addEdge({
      ...params,
      animated: true,
      label,
      labelStyle: { fontSize: 9, fill: '#6b7280' },
      labelBgStyle: { fill: '#f0f9ff', fillOpacity: 0.9 },
      style: { stroke: '#3b82f6', strokeWidth: 2 },
    }, prev))
  }, [setEdges])

  const computeJoins = useCallback(() => {
    return edges.reduce((acc, e) => {
      const rel = findRelation(e.source, e.target)
      if (rel) {
        if (rel.left_table === e.source) {
          acc.push({ left_table: e.source, left_column: rel.left_column, right_table: e.target, right_column: rel.right_column })
        } else {
          acc.push({ left_table: e.source, left_column: rel.right_column, right_table: e.target, right_column: rel.left_column })
        }
      }
      return acc
    }, [])
  }, [edges])

  const buildPayload = useCallback(() => {
    const tables = nodes.map(n => n.id)
    const selected_columns = gridRows
      .filter(r => r.show !== false)
      .map(r => ({ table: r.table, column: r.column, aggregation: r.aggregation || undefined, alias: r.column }))
    const joins = computeJoins()
    const filters = gridRows
      .filter(r => r.value?.toString().trim())
      .map(r => ({ table: r.table, column: r.column, operator: r.operator, value: r.value }))
    const order_by = gridRows
      .filter(r => r.order)
      .map(r => ({ table: r.table, column: r.column, direction: r.order }))
    return { tables, selected_columns, joins, filters, order_by, limit }
  }, [nodes, gridRows, computeJoins, limit])

  const handleExecute = async () => {
    if (!nodes.length) return
    setLoading(true)
    setError(null)
    setExplainResult(null)
    try {
      const payload = buildPayload()
      const result = await api.executeQuery(payload)
      setQueryResult(result)
      setResultTab('results')
      onAddHistorial?.({
        ts: new Date().toISOString(),
        sql: result.sql,
        time: result.execution_time_ms,
        rows: result.row_count,
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExplain = async () => {
    if (!nodes.length) return
    setLoading(true)
    setError(null)
    setQueryResult(null)
    try {
      const payload = buildPayload()
      const result = await api.explainQuery(payload)
      setExplainResult(result)
      setResultTab('explain')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setNodes([])
    setEdges([])
    setTableColumns({})
    setColumnSelections({})
    setGridRows([])
    setQueryResult(null)
    setExplainResult(null)
    setError(null)
  }

  const payload = buildPayload()

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 100px)' }}>
      {/* Top: canvas area */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {/* Schema Explorer */}
        <div className="w-52 border-r bg-white overflow-y-auto flex-shrink-0">
          <SchemaExplorer onAddTable={addTable} addedTables={nodes.map(n => n.id)} />
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1 relative bg-gray-50">
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-2">⬡</div>
                <p className="text-sm">Usa el panel izquierdo para agregar tablas al canvas</p>
                <p className="text-xs mt-1">Luego conecta tablas arrastrando entre los handles</p>
              </div>
            </div>
          )}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode="Delete"
          >
            <Controls />
            <MiniMap nodeStrokeWidth={2} zoomable pannable />
            <Background variant="dots" gap={12} size={1} />
          </ReactFlow>
        </div>

        {/* SQL Preview */}
        <div className="w-64 border-l bg-white flex-shrink-0 flex flex-col">
          <SqlPreview payload={payload} />
        </div>
      </div>

      {/* Controls bar */}
      <div className="bg-white border-t px-4 py-2 flex items-center gap-3 flex-shrink-0">
        <span className="text-xs text-gray-500">Límite:</span>
        <input
          type="number"
          value={limit}
          min={1}
          max={500}
          onChange={e => setLimit(Math.min(500, Math.max(1, parseInt(e.target.value) || 100)))}
          className="w-16 border rounded px-2 py-1 text-xs"
        />
        <button
          onClick={handleExecute}
          disabled={loading || !nodes.length}
          className="px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          {loading ? 'Ejecutando...' : '▶ Ejecutar'}
        </button>
        <button
          onClick={handleExplain}
          disabled={loading || !nodes.length}
          className="px-4 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          EXPLAIN ANALYZE
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded text-xs font-medium hover:bg-gray-200 transition-colors"
        >
          Limpiar
        </button>
        {error && <span className="text-red-500 text-xs ml-2">{error}</span>}
      </div>

      {/* Query Grid */}
      <div className="bg-white border-t flex-shrink-0 max-h-40 overflow-y-auto">
        <QueryGrid rows={gridRows} onChange={setGridRows} />
      </div>

      {/* Results */}
      {(queryResult || explainResult) && (
        <div className="bg-white border-t flex-shrink-0 max-h-64 overflow-y-auto">
          <div className="flex border-b text-xs">
            <button
              onClick={() => setResultTab('results')}
              className={`px-4 py-2 font-medium transition-colors ${resultTab === 'results' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Resultados {queryResult && `(${queryResult.row_count} filas · ${queryResult.execution_time_ms?.toFixed(1)} ms)`}
            </button>
            <button
              onClick={() => setResultTab('explain')}
              className={`px-4 py-2 font-medium transition-colors ${resultTab === 'explain' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              EXPLAIN
            </button>
          </div>
          {resultTab === 'results' && queryResult && <QueryResults result={queryResult} />}
          {resultTab === 'explain' && explainResult && <ExplainViewer result={explainResult} />}
        </div>
      )}
    </div>
  )
}
