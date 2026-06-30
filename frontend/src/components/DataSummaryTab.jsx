import { useEffect, useState } from 'react'
import { api } from '../api'
import QueryResults from './QueryResults'

export default function DataSummaryTab() {
  const [tables, setTables] = useState([])
  const [selected, setSelected] = useState(null)
  const [columns, setColumns] = useState([])
  const [count, setCount] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.getTables().then(setTables).catch(e => setError(e.message))
  }, [])

  const selectTable = async (t) => {
    setSelected(t)
    setLoading(true)
    setError(null)
    try {
      const [cols, cnt, rows] = await Promise.all([
        api.getColumns(t),
        api.getCount(t),
        api.getPreview(t, 100),
      ])
      setColumns(cols)
      setCount(cnt.count)
      setPreview(rows)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-48 bg-white border-r overflow-y-auto flex-shrink-0">
        <div className="p-3 border-b">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tablas</p>
        </div>
        {tables.map(t => (
          <button
            key={t}
            onClick={() => selectTable(t)}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${
              selected === t ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selected && (
          <div className="text-gray-400 text-sm mt-10 text-center">Selecciona una tabla de la izquierda</div>
        )}
        {error && <div className="text-red-600 text-sm mb-4">Error: {error}</div>}
        {selected && !loading && (
          <>
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-lg font-bold text-gray-800">{selected}</h2>
              <span className="">
                {Number(count).toLocaleString()} registros
              </span>
            </div>

            {/* Columns info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-6 overflow-hidden">
              <div className="px-4 py-2 border-b bg-gray-50">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Estructura</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-gray-500">
                    <th className="px-4 py-2 text-left">Columna</th>
                    <th className="px-4 py-2 text-left">Tipo</th>
                    <th className="px-4 py-2 text-left">Nullable</th>
                    <th className="px-4 py-2 text-left">Default</th>
                  </tr>
                </thead>
                <tbody>
                  {columns.map(c => (
                    <tr key={c.column_name} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-blue-700 font-medium">{c.column_name}</td>
                      <td className="px-4 py-2 text-gray-600">{c.data_type}</td>
                      <td className="px-4 py-2 text-gray-500">{c.is_nullable}</td>
                      <td className="px-4 py-2 text-gray-400 text-xs">{c.column_default || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Preview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-2 border-b bg-gray-50">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Vista previa (100 filas)</p>
              </div>
              <div className="overflow-auto max-h-96">
                {preview && (
                  <QueryResults result={{ rows: preview, row_count: preview.length, execution_time_ms: 0 }} compact />
                )}
              </div>
            </div>
          </>
        )}
        {loading && <div className="text-gray-400 text-sm mt-10 text-center">Cargando...</div>}
      </div>
    </div>
  )
}
