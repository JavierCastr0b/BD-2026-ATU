export default function QueryResults({ result, compact = false }) {
  if (!result) return null
  const { rows, row_count, execution_time_ms, sql } = result

  if (!rows || rows.length === 0) {
    return <div className="p-4 text-gray-400 text-sm">Sin resultados.</div>
  }

  const headers = Object.keys(rows[0])

  return (
    <div>
      {!compact && (
        <div className="flex items-center gap-4 px-4 py-2 border-b bg-gray-50 text-xs text-gray-600">
          <span><strong>{row_count}</strong> filas</span>
          <span><strong>{execution_time_ms?.toFixed(1)}</strong> ms</span>
          {sql && (
            <details className="ml-auto">
              <summary className="cursor-pointer text-blue-600 hover:underline">Ver SQL</summary>
              <pre className="mt-2 bg-gray-900 text-green-300 p-3 rounded text-xs overflow-x-auto absolute right-0 z-10 max-w-xl shadow-lg">
                {sql}
              </pre>
            </details>
          )}
        </div>
      )}
      <div className="overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b sticky top-0">
              {headers.map(h => (
                <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap border-r last:border-0">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b hover:bg-blue-50 transition-colors">
                {headers.map(h => (
                  <td key={h} className="px-3 py-1.5 text-gray-700 whitespace-nowrap border-r last:border-0 max-w-xs truncate" title={String(row[h] ?? '')}>
                    {row[h] === null ? <span className="text-gray-300 italic">null</span> : String(row[h])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
