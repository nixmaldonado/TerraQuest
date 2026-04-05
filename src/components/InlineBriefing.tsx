import React from 'react'
import { useGameStore } from '../store/gameStore'
import { levels } from '../levels/index'

export const InlineBriefing: React.FC = () => {
  const currentLevel = useGameStore((s) => s.currentLevel)
  const toggleBriefingPanel = useGameStore((s) => s.toggleBriefingPanel)
  const hintsUsed = useGameStore((s) => s.hintsUsed)

  const level = levels.find((l) => l.id === currentLevel)
  if (!level) return null

  return (
    <div className="h-full bg-[#1e293b]/95 backdrop-blur-sm overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-1">
            Level {level.id} — Mission Brief
          </div>
          <h2 className="text-xl font-bold text-slate-100">{level.title}</h2>
          <p className="text-slate-400 text-sm mt-0.5">{level.subtitle}</p>
        </div>
        <button
          onClick={toggleBriefingPanel}
          className="text-slate-500 hover:text-slate-200 text-sm px-2 py-1 rounded hover:bg-[#334155] transition-colors shrink-0"
        >
          Close
        </button>
      </div>

      {/* Description */}
      <div className="text-slate-300 leading-relaxed space-y-3 mb-6 text-sm">
        {level.description.split('\n').filter(Boolean).map((para, i) => {
          if (para.startsWith('## ')) {
            return (
              <h4 key={i} className="text-base font-semibold text-slate-100 mt-3">
                {para.slice(3)}
              </h4>
            )
          }
          const formatted = para.replace(
            /\*\*(.*?)\*\*/g,
            '<strong class="text-slate-100">$1</strong>'
          )
          return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />
        })}
      </div>

      {/* Concepts */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Concepts
        </h3>
        <div className="flex flex-wrap gap-2">
          {level.concepts.map((concept, i) => (
            <span
              key={i}
              className="text-xs px-2.5 py-1 rounded-full bg-purple-600/20 text-purple-300 border border-purple-500/20"
            >
              {concept}
            </span>
          ))}
        </div>
      </div>

      {/* Hints revealed so far */}
      {hintsUsed > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Hints Used
          </h3>
          <div className="space-y-2">
            {level.hints.slice(0, hintsUsed).map((hint, i) => (
              <div
                key={i}
                className="text-sm text-amber-300/90 bg-amber-600/10 border border-amber-500/20 rounded-lg px-3 py-2"
              >
                {hint}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Target resources */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Target Resources
        </h3>
        <div className="space-y-1.5">
          {level.targetResources.map((target, i) => (
            <div
              key={i}
              className="text-sm text-slate-300 bg-[#0f172a]/60 rounded-lg px-3 py-2 font-mono"
            >
              {target.type}
              <span className="text-slate-500 ml-2">— {target.displayName}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
