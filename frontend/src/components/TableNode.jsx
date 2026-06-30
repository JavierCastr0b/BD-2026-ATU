import { Handle, Position } from 'reactflow'

const PK_NAMES = ['id_usuario', 'id_tarjeta', 'id_boleto', 'id_ruta', 'id_bus',
  'id_paradero', 'id_recarga', 'id_punto_recarga', 'id_incidente',
  'id_detalle', 'id_conductor', 'id_conduce', 'id_ruta_paradero']

export default function TableNode({ data }) {
  const { tableName, columns = [], checkedColumns = new Set(), onColumnToggle } = data

  return (
    <div className="bg-white border-2 border-blue-500 rounded-lg shadow-md min-w-40 overflow-hidden select-none">
      <Handle type="target" position={Position.Left} style={{ background: '#3b82f6' }} />
      <Handle type="source" position={Position.Right} style={{ background: '#3b82f6' }} />

      <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 flex items-center justify-between">
        <span>{tableName}</span>
        <span className="text-blue-200 font-normal">{columns.length} cols</span>
      </div>

      <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
        {columns.map(col => {
          const isPK = PK_NAMES.includes(col.column_name) && col.column_name.startsWith('id_')
          const isFK = col.column_name.startsWith('id_') && !isPK
          const checked = checkedColumns instanceof Set
            ? checkedColumns.has(col.column_name)
            : Array.isArray(checkedColumns)
              ? checkedColumns.includes(col.column_name)
              : false

          return (
            <div
              key={col.column_name}
              className={`flex items-center gap-2 px-2 py-1 hover:bg-blue-50 cursor-pointer transition-colors ${checked ? 'bg-blue-50' : ''}`}
              onClick={() => onColumnToggle?.(col.column_name)}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onColumnToggle?.(col.column_name)}
                className="accent-blue-600 flex-shrink-0"
                onClick={e => e.stopPropagation()}
              />
              <span className="text-xs text-gray-700 flex-1 truncate" title={col.column_name}>
                {col.column_name}
              </span>
              {isPK && (
                <span className="text-gray-400 text-xs bg-gray-100 px-1 rounded">PK</span>
              )}
              {isFK && (
                <span className="text-gray-400 text-xs bg-yellow-50 border border-yellow-200 px-1 rounded">FK</span>
              )}
              <span className="text-gray-300 text-xs flex-shrink-0">{col.data_type?.replace('character varying', 'varchar').replace('integer', 'int')}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
