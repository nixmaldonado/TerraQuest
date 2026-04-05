import React, { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useEditorStore } from '../store/editorStore'
import { levels } from '../levels/index'

export const GameControls: React.FC = () => {
  const currentLevel = useGameStore((s) => s.currentLevel)
  const hintsUsed = useGameStore((s) => s.hintsUsed)
  const startTime = useGameStore((s) => s.startTime)
  const resetLevel = useGameStore((s) => s.resetLevel)
  const useHint = useGameStore((s) => s.useHint)

  const planResult = useEditorStore((s) => s.planResult)
  const runPlan = useEditorStore((s) => s.runPlan)
  const runApply = useEditorStore((s) => s.runApply)
  const setInitialCode = useEditorStore((s) => s.setInitialCode)

  const level = levels.find((l) => l.id === currentLevel)
  const totalHints = level?.hints.length ?? 0
  const remainingHints = totalHints - hintsUsed
  const planIsValid = planResult?.isValid ?? false

  // Elapsed timer
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!startTime) {
      setElapsed(0)
      return
    }
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleReset = () => {
    resetLevel()
    if (level) {
      setInitialCode(level.starterCode)
    }
  }

  const handleHint = () => {
    if (remainingHints > 0 && level) {
      useHint()
      const hintIndex = hintsUsed // current index before increment
      if (hintIndex < level.hints.length) {
        alert(level.hints[hintIndex])
      }
    }
  }

  return (
    <div className="h-[52px] bg-[#1e293b] border-t border-[#334155] flex items-center justify-between px-6">
      {/* Left: Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={runPlan}
          className="px-4 py-1.5 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
        >
          Plan
        </button>
        <button
          onClick={runApply}
          disabled={!planIsValid}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            planIsValid
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          Apply
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-1.5 rounded-md text-sm font-medium bg-slate-600 hover:bg-slate-500 text-slate-200 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Right: Hints + Timer */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleHint}
          disabled={remainingHints <= 0}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            remainingHints > 0
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          Hint ({remainingHints}/{totalHints} remaining)
        </button>
        <div className="text-sm text-slate-400 font-mono tabular-nums min-w-[4rem] text-right">
          {formatTime(elapsed)}
        </div>
      </div>
    </div>
  )
}
