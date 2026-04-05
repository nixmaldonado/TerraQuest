import React from 'react'
import type { LayoutNode } from '../../types/index'

interface VpcNodeProps {
  node: LayoutNode
  children: React.ReactNode
}

export const VpcNode: React.FC<VpcNodeProps> = ({ node, children }) => {
  // Try to find cidr_block from name or attributes context
  // The node doesn't carry attributes directly, but we show what we can
  return (
    <g transform={`translate(${node.x}, ${node.y})`}>
      <rect
        x={0}
        y={0}
        width={node.width}
        height={node.height}
        rx={12}
        ry={12}
        fill="#3b82f6"
        fillOpacity={0.05}
        stroke="#3b82f6"
        strokeWidth={1.5}
        strokeDasharray="8 4"
      />
      <text
        x={12}
        y={24}
        fill="#3b82f6"
        fontSize={13}
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        VPC
        <tspan dx={8} fontWeight="normal" fontSize={12} fill="#93c5fd">
          {node.name}
        </tspan>
      </text>
      {children}
    </g>
  )
}
