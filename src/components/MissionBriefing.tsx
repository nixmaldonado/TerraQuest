import React from 'react'
import { useGameStore } from '../store/gameStore'
import { useEditorStore } from '../store/editorStore'
import { levels } from '../levels/index'

export const MissionBriefing: React.FC = () => {
  const currentLevel = useGameStore((s) => s.currentLevel)
  const setView = useGameStore((s) => s.setView)

  const setInitialCode = useEditorStore((s) => s.setInitialCode)

  const level = levels.find((l) => l.id === currentLevel)
  if (!level) return null

  const handleStart = () => {
    useGameStore.setState({ startTime: Date.now() })
    setInitialCode(level.starterCode)
    setView('playing')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl max-w-2xl w-full mx-6 p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Level header */}
        <div className="mb-6">
          <div className="text-sm text-purple-400 font-semibold uppercase tracking-wider mb-1">
            Level {level.id}
          </div>
          <h2 className="text-2xl font-bold text-slate-100">{level.title}</h2>
          <p className="text-slate-400 text-sm mt-1">{level.subtitle}</p>
        </div>

        {/* Mission briefing */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Mission Briefing
          </h3>
          <div className="text-slate-400 leading-relaxed space-y-2">
            {level.description.split('\n').filter(Boolean).map((para, i) => {
              // Simple markdown: ## headers and **bold**
              if (para.startsWith('## ')) {
                return <h4 key={i} className="text-lg font-semibold text-slate-200 mt-2">{para.slice(3)}</h4>
              }
              const formatted = para.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-200">$1</strong>')
              return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />
            })}
          </div>
        </div>

        {/* Concepts */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Concepts you'll learn
          </h3>
          <ul className="space-y-1.5">
            {level.concepts.map((concept, i) => (
              <li key={i} className="flex items-start gap-2 text-slate-400">
                <span className="text-emerald-400 mt-0.5">&#8226;</span>
                <span>{concept}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-lg transition-colors shadow-lg shadow-emerald-600/20"
        >
          Start Mission
        </button>
      </div>
    </div>
  )
}
