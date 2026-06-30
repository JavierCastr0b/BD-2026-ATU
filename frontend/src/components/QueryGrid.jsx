const OPERATORS = ['=', '!=', '>', '>=', '<', '<=', 'LIKE', 'ILIKE', 'IN', 'BETWEEN']
const AGGREGATIONS = ['', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX']
const ORDERS = ['', 'ASC', 'DESC']

export default function QueryGrid({ rows, onChange }) {
  const update = (idx, field, value) => {
    onChange(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }

  if (!rows.length) {
    return (
      <div className="px-4 py-6 text-center text-gray-400 text-sm border-t">
        Selecciona columnas en el canvas para construir la consulta
      </div>
    )
  }

  return (
    <div className="overflow-x-auto border-t">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50 border-b text-gray-500 uppercase tracking-wide">
            <th className="px-3 py-2 text-left w-36">Campo</th>
            <th className="px-3 py-2 text-left w-28">Tabla</th>
            <th className="px-3 py-2 text-center w-14">Mostrar</th>
            <th className="px-3 py-2 text-left w-24">Agregación</th>
            <th className="px-3 py-2 text-left w-24">Orden</th>
            <th className="px-3 py-2 text-left w-20">Operador</th>
            <th className="px-3 py-2 text-left">Criterio</th>
            <th className="px-3 py-2 w-8"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.table}-${row.column}-${i}`} className="border-b hover:bg-blue-50">
              <td className="px-3 py-1 font-mono text-blue-700 font-medium">{row.column}</td>
              <td className="px-3 py-1 text-gray-500">{row.table}</td>
              <td className="px-3 py-1 text-center">
                <input
                  type="checkbox"
                  checked={row.show !== false}
                  onChange={e => update(i, 'show', e.target.checked)}
                  className="accent-blue-600"
                />
              </td>
              <td className="px-3 py-1">
                <select
                  value={row.aggregation || ''}
                  onChange={e => update(i, 'aggregation', e.target.value)}
                  className="border rounded px-1 py-0.5 text-xs w-full"
                >
                  {AGGREGATIONS.map(a => <option key={a} value={a}>{a || 'ninguna'}</option>)}
                </select>
              </td>
              <td className="px-3 py-1">
                <select
                  value={row.order || ''}
                  onChange={e => update(i, 'order', e.target.value)}
                  className="border rounded px-1 py-0.5 text-xs w-full"
                >
                  {ORDERS.map(o => <option key={o} value={o}>{o || 'ninguno'}</option>)}
                </select>
              </td>
              <td className="px-3 py-1">
                <select
                  value={row.operator || '='}
                  onChange={e => update(i, 'operator', e.target.value)}
                  className="border rounded px-1 py-0.5 text-xs w-full"
                >
                  {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
              </td>
              <td className="px-3 py-1">
                <input
                  type="text"
                  value={row.value || ''}
                  onChange={e => update(i, 'value', e.target.value)}
                  placeholder="valor..."
                  className="border rounded px-2 py-0.5 text-xs w-full"
                />
              </td>
              <td className="px-3 py-1">
                <button
                  onClick={() => onChange(prev => prev.filter((_, j) => j !== i))}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                  title="Quitar fila"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
