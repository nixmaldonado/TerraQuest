import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameView, LevelProgress, DeployedResource, ScoreResult } from '../types/index'

interface GameState {
  currentView: GameView
  currentLevel: number
  deployedResources: Record<string, DeployedResource>
  animatingResources: string[]
  startTime: number | null
  hintsUsed: number
  attempts: number
  lastScore: ScoreResult | null

  // Persisted
  levelProgress: Record<number, LevelProgress>

  showBriefingPanel: boolean

  // Actions
  setView: (view: GameView) => void
  toggleBriefingPanel: () => void
  startLevel: (levelId: number) => void
  deployResource: (address: string, resource: DeployedResource) => void
  setResourceAnimationState: (address: string, state: DeployedResource['animationState']) => void
  finishAnimating: (address: string) => void
  resetLevel: () => void
  useHint: () => void
  incrementAttempts: () => void
  completeLevelWithScore: (score: ScoreResult) => void
  clearDeployedResources: () => void
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      currentView: 'levelSelect',
      currentLevel: 1,
      deployedResources: {},
      animatingResources: [],
      startTime: null,
      hintsUsed: 0,
      attempts: 0,
      lastScore: null,
      levelProgress: {},
      showBriefingPanel: false,

      setView: (view) => set({ currentView: view }),

      toggleBriefingPanel: () => set((s) => ({ showBriefingPanel: !s.showBriefingPanel })),

      startLevel: (levelId) =>
        set({
          currentLevel: levelId,
          currentView: 'briefing',
          deployedResources: {},
          animatingResources: [],
          startTime: null,
          hintsUsed: 0,
          attempts: 0,
          lastScore: null,
          showBriefingPanel: false,
        }),

      deployResource: (address, resource) =>
        set((state) => ({
          deployedResources: { ...state.deployedResources, [address]: resource },
          animatingResources: [...state.animatingResources, address],
        })),

      setResourceAnimationState: (address, animState) =>
        set((state) => {
          const resource = state.deployedResources[address]
          if (!resource) return state
          return {
            deployedResources: {
              ...state.deployedResources,
              [address]: { ...resource, animationState: animState },
            },
          }
        }),

      finishAnimating: (address) =>
        set((state) => ({
          animatingResources: state.animatingResources.filter((a) => a !== address),
          deployedResources: {
            ...state.deployedResources,
            [address]: state.deployedResources[address]
              ? { ...state.deployedResources[address], animationState: 'deployed' as const }
              : state.deployedResources[address],
          },
        })),

      resetLevel: () => {
        const { currentLevel } = get()
        set({
          deployedResources: {},
          animatingResources: [],
          startTime: Date.now(),
          hintsUsed: 0,
          attempts: 0,
          lastScore: null,
          currentLevel,
          currentView: 'playing',
        })
      },

      useHint: () => set((state) => ({ hintsUsed: state.hintsUsed + 1 })),

      incrementAttempts: () => set((state) => ({ attempts: state.attempts + 1 })),

      completeLevelWithScore: (score) =>
        set((state) => {
          const existing = state.levelProgress[state.currentLevel]
          const newProgress: LevelProgress = {
            completed: true,
            stars: existing ? Math.max(existing.stars, score.stars) : score.stars,
            bestScore: existing ? Math.max(existing.bestScore, score.score) : score.score,
          }
          return {
            lastScore: score,
            currentView: 'scoreCard',
            levelProgress: {
              ...state.levelProgress,
              [state.currentLevel]: newProgress,
            },
          }
        }),

      clearDeployedResources: () =>
        set({ deployedResources: {}, animatingResources: [] }),
    }),
    {
      name: 'terraquest-progress',
      partialize: (state) => ({ levelProgress: state.levelProgress }),
    }
  )
)
