import { useGameStore } from './store/gameStore'
import { LevelSelect } from './components/LevelSelect'
import { Layout } from './components/Layout'
import { MissionBriefing } from './components/MissionBriefing'
import { ScoreCard } from './components/ScoreCard'

export default function App() {
  const currentView = useGameStore((s) => s.currentView)

  switch (currentView) {
    case 'levelSelect':
      return <LevelSelect />
    case 'briefing':
      return <MissionBriefing />
    case 'playing':
      return <Layout />
    case 'scoreCard':
      return <ScoreCard />
    default:
      return <LevelSelect />
  }
}
