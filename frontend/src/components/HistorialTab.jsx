export default function HistorialTab({ entries = [] }) {
  if (!entries.length) {
    return (
      <div className="p-10 text-center text-gray-400 text-sm">
        No hay consultas en el historial. Ejecuta una desde el Query Builder.
      </div>
    )
  }

  const fmt = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString()
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Historial de consultas</h2>
      <div className="space-y-3">
        {entries.map((e, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-4 mb-2 text-xs text-gray-500">
              <span>{fmt(e.ts)}</span>
              <span className="">
                {e.rows} filas
              </span>
              <span className="">
                {e.time?.toFixed(1)} ms
              </span>
            </div>
            <pre className="bg-gray-900 text-green-300 text-xs p-3 rounded overflow-x-auto leading-relaxed">
              {e.sql}
            </pre>
          </div>
        ))}
      </div>
    </div>
  )
}
