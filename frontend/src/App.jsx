import React, { useState } from 'react'
import Navbar from './components/Navbar'
import DataSummaryTab from './components/DataSummaryTab'
import QueryBuilder from './components/QueryBuilder'
import HistorialTab from './components/HistorialTab'

const TABS = [
  { id: 'datos', label: 'Explorador de datos' },
  { id: 'builder', label: 'Query Builder' },
  { id: 'historial', label: 'Historial' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('datos')
  const [historial, setHistorial] = useState([])

  const addHistorial = (entry) => setHistorial(prev => [entry, ...prev].slice(0, 50))

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="px-6 py-3">
          <h1 className="text-xl font-bold">ATU CONSOLA SQL</h1>
        </div>
        <Navbar tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </header>

      <main className="flex-1 overflow-hidden">
        {activeTab === 'datos' && <DataSummaryTab />}
        {activeTab === 'builder' && <QueryBuilder onAddHistorial={addHistorial} />}
        {activeTab === 'historial' && <HistorialTab entries={historial} />}
      </main>
    </div>
  )
}
