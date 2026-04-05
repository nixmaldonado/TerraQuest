import React from 'react'
import type { LayoutNode } from '../../types/index'

interface SubnetNodeProps {
  node: LayoutNode
  children: React.ReactNode
}

export const SubnetNode: React.FC<SubnetNodeProps> = ({ node, children }) => {
  return (
    <g transform={`translate(${node.x}, ${node.y})`}>
      <rect
        x={0}
        y={0}
        width={node.width}
        height={node.height}
        rx={8}
        ry={8}
        fill="#06b6d4"
        fillOpacity={0.05}
        stroke="#06b6d4"
        strokeWidth={1}
        strokeDasharray="6 3"
      />
      <text
        x={10}
        y={18}
        fill="#06b6d4"
        fontSize={11}
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        Subnet
        <tspan dx={6} fontWeight="normal" fontSize={10} fill="#67e8f9">
          {node.name}
        </tspan>
      </text>
      {children}
    </g>
  )
}
