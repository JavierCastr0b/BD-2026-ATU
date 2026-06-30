export default function ExplainViewer({ result }) {
  if (!result) return null

  const indent = (line) => {
    const match = line.match(/^(\s*->)?\s*/)
    const level = match ? Math.floor(match[0].replace('->', '').length / 2) : 0
    return level
  }

  const highlight = (line) => {
    if (line.includes('Seq Scan')) return 'text-orange-600'
    if (line.includes('Index Scan') || line.includes('Index Only')) return 'text-green-600'
    if (line.includes('Hash Join') || line.includes('Nested Loop') || line.includes('Merge Join')) return 'text-blue-600'
    if (line.includes('Sort') || line.includes('Aggregate')) return 'text-purple-600'
    return 'text-gray-300'
  }

  return (
    <div className="p-4">
      <p className="text-xs text-gray-500 mb-2 font-medium">Plan de ejecución EXPLAIN ANALYZE</p>
      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
        <pre className="text-xs font-mono leading-relaxed">
          {result.plan.map((line, i) => (
            <div key={i} className={highlight(line)}>
              {line}
            </div>
          ))}
        </pre>
      </div>
    </div>
  )
}
