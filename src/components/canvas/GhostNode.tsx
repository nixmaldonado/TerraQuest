import React from 'react'
import type { LayoutNode } from '../../types/index'
import { RESOURCE_REGISTRY } from '../../engine/resources'

interface GhostNodeProps {
  node: LayoutNode
  isMatched: boolean
}

function GhostContainer({ node, className }: { node: LayoutNode; className: string }) {
  const isVpc = node.resourceType === 'aws_vpc'
  const isSubnet = node.resourceType === 'aws_subnet'
  const radius = isVpc ? 12 : 8
  const strokeColor = isVpc ? '#3b82f6' : isSubnet ? '#06b6d4' : '#6b7280'

  return (
    <g transform={`translate(${node.x}, ${node.y})`} className={className}>
      <rect
        x={0}
        y={0}
        width={node.width}
        height={node.height}
        rx={radius}
        ry={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1}
        strokeDasharray="6 4"
        opacity={0.3}
      />
      <text
        x={node.width / 2}
        y={node.height / 2 + 4}
        textAnchor="middle"
        fill="#6b7280"
        fontSize={10}
        fontFamily="sans-serif"
        opacity={0.5}
      >
        {RESOURCE_REGISTRY[node.resourceType]?.displayName ?? node.resourceType}
      </text>
    </g>
  )
}

function GhostLeaf({ node, className }: { node: LayoutNode; className: string }) {
  const def = RESOURCE_REGISTRY[node.resourceType]
  const color = def?.visual.color ?? '#6b7280'
  const cx = node.width / 2

  return (
    <g transform={`translate(${node.x}, ${node.y})`} className={className}>
      <rect
        x={0}
        y={0}
        width={node.width}
        height={node.height}
        rx={8}
        ry={8}
        fill="none"
        stroke={color}
        strokeWidth={1}
        strokeDasharray="6 4"
        opacity={0.3}
      />
      <text
        x={cx}
        y={node.height / 2 - 2}
        textAnchor="middle"
        fill="#6b7280"
        fontSize={10}
        fontFamily="sans-serif"
        opacity={0.5}
      >
        {def?.displayName ?? node.resourceType}
      </text>
      <text
        x={cx}
        y={node.height / 2 + 12}
        textAnchor="middle"
        fill="#9ca3af"
        fontSize={9}
        fontFamily="sans-serif"
        opacity={0.4}
      >
        {node.name}
      </text>
    </g>
  )
}

export const GhostNode: React.FC<GhostNodeProps> = ({ node, isMatched }) => {
  const className = isMatched ? 'ghost-node-matched' : 'ghost-node'
  const isContainer =
    node.resourceType === 'aws_vpc' || node.resourceType === 'aws_subnet'

  if (isContainer) {
    return <GhostContainer node={node} className={className} />
  }
  return <GhostLeaf node={node} className={className} />
}
