import React from 'react'
import { useGameStore } from '../store/gameStore'
import { useEditorStore } from '../store/editorStore'
import { levels } from '../levels/index'

export const ScoreCard: React.FC = () => {
  const currentLevel = useGameStore((s) => s.currentLevel)
  const lastScore = useGameStore((s) => s.lastScore)
  const setView = useGameStore((s) => s.setView)
  const startLevel = useGameStore((s) => s.startLevel)
  const resetLevel = useGameStore((s) => s.resetLevel)
  const setInitialCode = useEditorStore((s) => s.setInitialCode)

  const level = levels.find((l) => l.id === currentLevel)
  const hasNextLevel = levels.some((l) => l.id === currentLevel + 1)

  if (!lastScore || !level) return null

  const handleNextLevel = () => {
    startLevel(currentLevel + 1)
  }

  const handleRetry = () => {
    resetLevel()
    setInitialCode(level.starterCode)
  }

  const { breakdown, score, maxScore, stars } = lastScore

  const rows = [
    { label: 'Correctness', value: breakdown.correctness },
    { label: 'Time Bonus', value: breakdown.timeBonus },
    { label: 'Security Bonus', value: breakdown.securityBonus },
    { label: 'Efficiency Bonus', value: breakdown.efficiencyBonus },
    { label: 'Hint Penalty', value: -breakdown.hintPenalty },
    { label: 'Attempt Penalty', value: -breakdown.attemptPenalty },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl max-w-md w-full mx-6 p-8 shadow-2xl text-center">
        {/* Header */}
        <h2 className="text-3xl font-extrabold text-emerald-400 mb-4">
          Mission Complete!
        </h2>

        {/* Stars */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className={`text-5xl transition-transform duration-500 ${
                i <= stars
                  ? 'text-yellow-400 animate-bounce'
                  : 'text-slate-600'
              }`}
              style={{
                animationDelay: i <= stars ? `${i * 150}ms` : undefined,
              }}
            >
              &#9733;
            </span>
          ))}
        </div>

        {/* Score breakdown */}
        <div className="bg-[#0f172a] rounded-lg p-4 mb-6 text-left">
          <table className="w-full text-sm">
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-[#1e293b] last:border-0">
                  <td className="py-1.5 text-slate-400">{row.label}</td>
                  <td
                    className={`py-1.5 text-right font-mono ${
                      row.value > 0
                        ? 'text-emerald-400'
                        : row.value < 0
                          ? 'text-red-400'
                          : 'text-slate-500'
                    }`}
                  >
                    {row.value > 0 ? '+' : ''}{row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total */}
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#334155]">
            <span className="font-semibold text-slate-200">Total</span>
            <span className="font-bold text-lg text-purple-400">
              {score} / {maxScore}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          {hasNextLevel && (
            <button
              onClick={handleNextLevel}
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
            >
              Next Level
            </button>
          )}
          <button
            onClick={handleRetry}
            className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors"
          >
            Retry
          </button>
          <button
            onClick={() => setView('levelSelect')}
            className="w-full py-2.5 rounded-lg bg-slate-600 hover:bg-slate-500 text-slate-200 font-medium transition-colors"
          >
            Back to Levels
          </button>
        </div>
      </div>
    </div>
  )
}
