import React from 'react'
import { useGameStore } from '../store/gameStore'
import { levels } from '../levels/index'

export const TopBar: React.FC = () => {
  const currentLevel = useGameStore((s) => s.currentLevel)
  const levelProgress = useGameStore((s) => s.levelProgress)
  const setView = useGameStore((s) => s.setView)
  const showBriefingPanel = useGameStore((s) => s.showBriefingPanel)
  const toggleBriefingPanel = useGameStore((s) => s.toggleBriefingPanel)

  const level = levels.find((l) => l.id === currentLevel)
  const progress = levelProgress[currentLevel]
  const stars = progress?.stars ?? 0

  return (
    <div className="h-12 bg-[#1e293b] border-b border-[#334155] flex items-center justify-between px-6">
      {/* Left: Logo + Back button */}
      <div className="flex items-center gap-3">
        <span className="text-purple-400 font-bold text-lg tracking-tight">
          TerraQuest
        </span>
        <button
          onClick={() => setView('levelSelect')}
          className="text-sm text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded hover:bg-[#334155]"
        >
          Back to Levels
        </button>
      </div>

      {/* Center: Level title */}
      <div className="flex flex-col items-center leading-tight">
        <span className="text-sm font-semibold text-slate-200">
          {level?.title ?? 'Unknown Level'}
        </span>
        <span className="text-xs text-slate-400">
          {level?.subtitle ?? ''}
        </span>
      </div>

      {/* Right: Mission Brief toggle + Progress + Stars */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleBriefingPanel}
          className={`text-sm px-3 py-1 rounded transition-colors ${
            showBriefingPanel
              ? 'bg-purple-600 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#334155]'
          }`}
        >
          Mission Brief
        </button>
        <span className="text-sm text-slate-400">
          Level {currentLevel}/5
        </span>
        <div className="flex gap-0.5">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className={`text-lg ${i <= stars ? 'text-yellow-400' : 'text-slate-600'}`}
            >
              &#9733;
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
