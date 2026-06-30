const TABLE_ALIASES = {
  usuario: 'u', tarjeta: 't', boleto: 'b', ruta: 'r',
  bus: 'bu', paradero: 'p', recarga: 're', punto_recarga: 'pr',
  incidente: 'i', detalle_incidente: 'di', conductor: 'c',
  conduce: 'co', ruta_paradero: 'rp',
}

const SCHEMA = 'idx_1m'

function buildPreviewSQL(payload) {
  const { tables = [], selected_columns = [], joins = [], filters = [], order_by = [], limit = 100 } = payload
  if (!tables.length) return '-- Agrega tablas al canvas para generar SQL'

  const alias = (t) => TABLE_ALIASES[t] || t

  const selectParts = selected_columns.length
    ? selected_columns
        .filter(sc => sc.show !== false)
        .map(sc => {
          const a = alias(sc.table)
          const agg = sc.aggregation ? `${sc.aggregation}(${a}.${sc.column})` : `${a}.${sc.column}`
          return sc.alias && sc.alias !== sc.column ? `${agg} AS "${sc.alias}"` : agg
        })
    : tables.map(t => `${alias(t)}.*`)

  if (!selectParts.length) return '-- Selecciona columnas en el canvas'

  let sql = `SELECT\n  ${selectParts.join(',\n  ')}\n`
  sql += `FROM ${SCHEMA}.${tables[0]} ${alias(tables[0])}`

  const joined = new Set([tables[0]])
  for (const j of joins) {
    const la = alias(j.left_table), ra = alias(j.right_table)
    if (!joined.has(j.right_table)) {
      sql += `\nJOIN ${SCHEMA}.${j.right_table} ${ra} ON ${la}.${j.left_column} = ${ra}.${j.right_column}`
      joined.add(j.right_table)
    }
  }

  const whereClauses = filters
    .filter(f => f.value?.toString().trim())
    .map(f => `${alias(f.table)}.${f.column} ${f.operator} '${f.value}'`)
  if (whereClauses.length) sql += `\nWHERE ${whereClauses.join('\n  AND ')}`

  const orderClauses = order_by
    .filter(o => o.direction)
    .map(o => `${alias(o.table)}.${o.column} ${o.direction}`)
  if (orderClauses.length) sql += `\nORDER BY ${orderClauses.join(', ')}`

  sql += `\nLIMIT ${limit};`
  return sql
}

export default function SqlPreview({ payload }) {
  const sql = buildPreviewSQL(payload)

  const copyToClipboard = () => navigator.clipboard.writeText(sql)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">SQL generado</span>
        <button
          onClick={copyToClipboard}
          className="text-xs text-blue-600 hover:underline"
        >
          Copiar
        </button>
      </div>
      <div className="flex-1 overflow-auto bg-gray-900 p-3">
        <pre className="text-xs font-mono text-green-300 whitespace-pre-wrap leading-relaxed">{sql}</pre>
      </div>
    </div>
  )
}
