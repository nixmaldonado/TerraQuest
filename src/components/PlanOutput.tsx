import React from 'react'
import { useEditorStore } from '../store/editorStore'

export const PlanOutput: React.FC = () => {
  const planResult = useEditorStore((s) => s.planResult)
  const isPlanVisible = useEditorStore((s) => s.isPlanVisible)
  const hidePlan = useEditorStore((s) => s.hidePlan)

  if (!isPlanVisible || !planResult) return null

  const creates = planResult.resources.filter((r) => r.action === 'create')
  const modifies = planResult.resources.filter((r) => r.action === 'modify')
  const destroys = planResult.resources.filter((r) => r.action === 'destroy')
  const errors = planResult.errors.filter((e) => e.severity === 'error')

  const actionSymbol = (action: 'create' | 'modify' | 'destroy') => {
    switch (action) {
      case 'create':
        return { symbol: '+', color: 'text-emerald-400' }
      case 'modify':
        return { symbol: '~', color: 'text-yellow-400' }
      case 'destroy':
        return { symbol: '-', color: 'text-red-400' }
    }
  }

  return (
    <div className="bg-[#0f172a] border-t border-[#334155] max-h-48 overflow-y-auto font-mono text-sm col-span-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e293b]">
        <span className="text-slate-300">
          Terraform plan:{' '}
          <span className="text-emerald-400">{creates.length} to add</span>,{' '}
          <span className="text-yellow-400">{modifies.length} to change</span>,{' '}
          <span className="text-red-400">{destroys.length} to destroy</span>
        </span>
        <button
          onClick={hidePlan}
          className="text-slate-500 hover:text-slate-300 text-xs px-2 py-0.5 rounded hover:bg-[#1e293b] transition-colors"
        >
          Close
        </button>
      </div>

      {/* Resources */}
      <div className="px-4 py-2 space-y-2">
        {planResult.resources.map((resource) => {
          const { symbol, color } = actionSymbol(resource.action)
          return (
            <div key={resource.address}>
              <div className={`${color} font-semibold`}>
                {symbol} {resource.address}
              </div>
              {Object.entries(resource.attributes).map(([key, value]) => (
                <div key={key} className="text-slate-500 pl-6">
                  {key} = <span className="text-slate-400">"{value}"</span>
                </div>
              ))}
            </div>
          )
        })}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mt-2 space-y-1">
            {errors.map((err, i) => (
              <div key={i} className="text-red-400">
                Error (line {err.line}): {err.message}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="px-4 py-2 border-t border-[#1e293b] text-slate-400 text-xs">
        Plan: {creates.length} to add, {modifies.length} to change, {destroys.length} to destroy.
        {planResult.isValid ? (
          <span className="text-emerald-400 ml-2">Ready to apply.</span>
        ) : (
          <span className="text-red-400 ml-2">Fix errors before applying.</span>
        )}
      </div>
    </div>
  )
}
