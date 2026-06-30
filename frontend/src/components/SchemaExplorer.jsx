import { useEffect, useState } from 'react'
import { api } from '../api'

export default function SchemaExplorer({ onAddTable, addedTables = [] }) {
  const [tables, setTables] = useState([])
  const [expanded, setExpanded] = useState({})
  const [columns, setColumns] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getTables().then(setTables).finally(() => setLoading(false))
  }, [])

  const toggleExpand = async (t) => {
    const isOpen = expanded[t]
    setExpanded(prev => ({ ...prev, [t]: !isOpen }))
    if (!isOpen && !columns[t]) {
      const cols = await api.getColumns(t)
      setColumns(prev => ({ ...prev, [t]: cols }))
    }
  }

  if (loading) return <div className="p-3 text-xs text-gray-400">Cargando...</div>

  return (
    <div>
      <div className="p-3 border-b bg-gray-50">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tablas — idx_1m</p>
      </div>
      {tables.map(t => {
        const added = addedTables.includes(t)
        const isOpen = expanded[t]
        return (
          <div key={t} className="border-b last:border-0">
            <div className="flex items-center gap-1 px-2 py-1.5 hover:bg-gray-50">
              <button
                onClick={() => toggleExpand(t)}
                className="text-gray-400 hover:text-gray-600 w-4 text-xs"
              >
                {isOpen ? '▾' : '▸'}
              </button>
              <span className="text-sm text-gray-700 flex-1 font-medium">{t}</span>
              <button
                onClick={() => !added && onAddTable(t)}
                disabled={added}
                className={`text-xs px-2 py-0.5 rounded transition-colors ${
                  added
                    ? 'text-green-600 bg-green-50 cursor-default'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                {added ? '✓' : '+'}
              </button>
            </div>
            {isOpen && columns[t] && (
              <div className="bg-gray-50 pl-7 pb-1">
                {columns[t].map(col => (
                  <div key={col.column_name} className="text-xs text-gray-500 py-0.5 flex gap-2">
                    <span className="font-mono text-blue-600">{col.column_name}</span>
                    <span className="text-gray-400">{col.data_type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
