import React from 'react'
import { useGameStore } from '../store/gameStore'
import { levels } from '../levels/index'

const NODE_POSITIONS = [
  { x: 20, y: 70 },
  { x: 50, y: 30 },
  { x: 80, y: 70 },
  { x: 50, y: 110 },
  { x: 20, y: 150 },
]

export const LevelSelect: React.FC = () => {
  const levelProgress = useGameStore((s) => s.levelProgress)
  const startLevel = useGameStore((s) => s.startLevel)

  const isUnlocked = (levelId: number): boolean => {
    if (levelId === 1) return true
    return levelProgress[levelId - 1]?.completed ?? false
  }

  return (
    <div className="h-screen w-screen bg-[#0f172a] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Title */}
      <div className="relative z-10 text-center mb-16">
        <h1 className="text-6xl font-extrabold text-purple-400 tracking-tight mb-2">
          TerraQuest
        </h1>
        <p className="text-slate-400 text-lg">
          Master Terraform through play
        </p>
      </div>

      {/* Level map */}
      <div className="relative z-10 w-[600px] h-[240px]">
        {/* Connecting lines via SVG */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 600 240"
          fill="none"
        >
          {levels.map((_level, i) => {
            if (i === levels.length - 1) return null
            const from = NODE_POSITIONS[i]
            const to = NODE_POSITIONS[i + 1]
            const x1 = (from.x / 100) * 600
            const y1 = (from.y / 180) * 240
            const x2 = (to.x / 100) * 600
            const y2 = (to.y / 180) * 240
            const nextUnlocked = isUnlocked(levels[i + 1].id)
            return (
              <line
                key={`line-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={nextUnlocked ? '#7c3aed' : '#334155'}
                strokeWidth={nextUnlocked ? 3 : 2}
                strokeDasharray={nextUnlocked ? 'none' : '8 6'}
              />
            )
          })}
        </svg>

        {/* Level nodes */}
        {levels.map((level, i) => {
          const pos = NODE_POSITIONS[i]
          const unlocked = isUnlocked(level.id)
          const progress = levelProgress[level.id]
          const stars = progress?.stars ?? 0

          return (
            <button
              key={level.id}
              onClick={() => unlocked && startLevel(level.id)}
              disabled={!unlocked}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
              style={{
                left: `${pos.x}%`,
                top: `${(pos.y / 180) * 100}%`,
              }}
            >
              {/* Node circle */}
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold transition-all ${
                  unlocked
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 group-hover:bg-purple-500 group-hover:scale-110 cursor-pointer'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                {unlocked ? level.id : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>

              {/* Level title */}
              <span
                className={`mt-1.5 text-xs font-medium max-w-[100px] text-center leading-tight ${
                  unlocked ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {level.title}
              </span>

              {/* Stars */}
              {progress && progress.completed && (
                <div className="flex gap-0.5 mt-0.5">
                  {[1, 2, 3].map((s) => (
                    <span
                      key={s}
                      className={`text-sm ${s <= stars ? 'text-yellow-400' : 'text-slate-600'}`}
                    >
                      &#9733;
                    </span>
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
