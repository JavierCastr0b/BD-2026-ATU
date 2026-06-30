const BASE = 'http://localhost:8000'

async function req(url, opts = {}) {
  const res = await fetch(BASE + url, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || res.statusText)
  }
  return res.json()
}

export const api = {
  health: () => req('/health'),
  getTables: () => req('/metadata/tables'),
  getColumns: (t) => req(`/metadata/tables/${t}/columns`),
  getPreview: (t, limit = 100) => req(`/metadata/tables/${t}/preview?limit=${limit}`),
  getCount: (t) => req(`/metadata/tables/${t}/count`),
  getRelations: () => req('/metadata/relations'),
  getIndexes: () => req('/metadata/indexes'),
  getSummary: () => req('/dashboard/summary'),
  getCharts: () => req('/dashboard/charts'),
  executeQuery: (payload) =>
    req('/query-builder/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  explainQuery: (payload) =>
    req('/query-builder/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
}
