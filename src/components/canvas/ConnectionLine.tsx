import React from 'react'
import type { LayoutNode } from '../../types/index'

interface ConnectionLineProps {
  from: LayoutNode
  to: LayoutNode
  animated: boolean
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({ from, to, animated }) => {
  // From center-bottom of source to center-top of target
  const x1 = from.x + from.width / 2
  const y1 = from.y + from.height
  const x2 = to.x + to.width / 2
  const y2 = to.y

  // Control point: offset 40px perpendicular from midpoint
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2
  // Perpendicular offset (shift the control point sideways for a curve)
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const perpX = -dy / len
  const cpX = midX + perpX * 40
  const cpY = midY

  const pathD = `M ${x1} ${y1} Q ${cpX} ${cpY} ${x2} ${y2}`

  return (
    <g>
      <defs>
        <marker
          id="arrowhead"
          markerWidth={8}
          markerHeight={6}
          refX={8}
          refY={3}
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <polygon points="0 0, 8 3, 0 6" fill="#475569" />
        </marker>
      </defs>
      <path
        d={pathD}
        fill="none"
        stroke="#475569"
        strokeWidth={1.5}
        markerEnd="url(#arrowhead)"
        className={animated ? 'arrow-draw' : undefined}
      />
    </g>
  )
}
