import React from 'react'
import { TopBar } from './TopBar'
import { Editor } from './Editor'
import { Canvas } from './Canvas'
import { PlanOutput } from './PlanOutput'
import { GameControls } from './GameControls'
import { useEditorStore } from '../store/editorStore'

export const Layout: React.FC = () => {
  const isPlanVisible = useEditorStore((s) => s.isPlanVisible)

  return (
    <div
      className="h-screen w-screen bg-[#0f172a] text-slate-200"
      style={{
        display: 'grid',
        gridTemplateRows: isPlanVisible ? '48px 1fr auto 52px' : '48px 1fr 52px',
        gridTemplateColumns: '1fr 1fr',
      }}
    >
      {/* Row 1: TopBar spanning both columns */}
      <div className="col-span-2">
        <TopBar />
      </div>

      {/* Row 2 left: Editor */}
      <div className="overflow-hidden border-r border-[#334155]">
        <Editor />
      </div>

      {/* Row 2 right: Canvas */}
      <div className="overflow-hidden canvas-grid p-4">
        <Canvas />
      </div>

      {/* Row 3: PlanOutput (conditional, spans both columns) */}
      {isPlanVisible && <PlanOutput />}

      {/* Row 4: GameControls spanning both columns */}
      <div className="col-span-2">
        <GameControls />
      </div>
    </div>
  )
}
