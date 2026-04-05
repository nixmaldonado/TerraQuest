import React, { useEffect, useState } from 'react'
import type { LayoutNode } from '../../types/index'
import { RESOURCE_REGISTRY } from '../../engine/resources'

interface ResourceNodeProps {
  node: LayoutNode
  isAnimating: boolean
}

function ServerIcon({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={-16} y={-12} width={32} height={20} rx={2} fill="none" stroke="white" strokeWidth={1.5} />
      <line x1={0} y1={8} x2={0} y2={14} stroke="white" strokeWidth={1.5} />
      <line x1={-8} y1={14} x2={8} y2={14} stroke="white" strokeWidth={1.5} />
    </g>
  )
}

function DatabaseIcon({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <ellipse cx={0} cy={-10} rx={14} ry={5} fill="none" stroke="white" strokeWidth={1.5} />
      <line x1={-14} y1={-10} x2={-14} y2={6} stroke="white" strokeWidth={1.5} />
      <line x1={14} y1={-10} x2={14} y2={6} stroke="white" strokeWidth={1.5} />
      <ellipse cx={0} cy={6} rx={14} ry={5} fill="none" stroke="white" strokeWidth={1.5} />
    </g>
  )
}

function BucketIcon({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <path d="M-12,-12 L12,-12 L8,12 L-8,12 Z" fill="none" stroke="white" strokeWidth={1.5} />
      <line x1={-10} y1={-4} x2={10} y2={-4} stroke="white" strokeWidth={1} />
    </g>
  )
}

function ShieldIcon({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <path d="M0,-14 L12,-6 L12,4 C12,10 0,16 0,16 C0,16 -12,10 -12,4 L-12,-6 Z" fill="none" stroke="white" strokeWidth={1.5} />
    </g>
  )
}

function LoadBalancerIcon({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <line x1={-12} y1={-8} x2={12} y2={-8} stroke="white" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={-12} y1={0} x2={12} y2={0} stroke="white" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={-12} y1={8} x2={12} y2={8} stroke="white" strokeWidth={2.5} strokeLinecap="round" />
    </g>
  )
}

function getIcon(resourceType: string, cx: number, cy: number): React.ReactNode {
  const def = RESOURCE_REGISTRY[resourceType]
  const iconType = def?.visual.icon ?? 'server'

  switch (iconType) {
    case 'server':
      return <ServerIcon x={cx} y={cy} />
    case 'database':
      return <DatabaseIcon x={cx} y={cy} />
    case 'bucket':
      return <BucketIcon x={cx} y={cy} />
    case 'shield':
      return <ShieldIcon x={cx} y={cy} />
    case 'loadbalancer':
      return <LoadBalancerIcon x={cx} y={cy} />
    default:
      return <ServerIcon x={cx} y={cy} />
  }
}

export const ResourceNode: React.FC<ResourceNodeProps> = ({ node, isAnimating }) => {
  const [animClass, setAnimClass] = useState('resource-enter')
  const def = RESOURCE_REGISTRY[node.resourceType]
  const color = def?.visual.color ?? '#6b7280'

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setAnimClass('resource-enter resource-enter-active')
    })
    return () => cancelAnimationFrame(timer)
  }, [])

  const buildingClass = isAnimating ? ' resource-building' : ''
  const cx = node.width / 2
  const iconY = node.height / 2 - 10

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      className={`${animClass}${buildingClass}`}
    >
      <rect
        x={0}
        y={0}
        width={node.width}
        height={node.height}
        rx={8}
        ry={8}
        fill={color}
        opacity={0.9}
      />
      {getIcon(node.resourceType, cx, iconY)}
      <text
        x={cx}
        y={node.height - 20}
        textAnchor="middle"
        fill="white"
        fontSize={11}
        fontFamily="sans-serif"
      >
        {node.name}
      </text>
      <text
        x={cx}
        y={node.height - 8}
        textAnchor="middle"
        fill="#d1d5db"
        fontSize={9}
        fontFamily="sans-serif"
      >
        {def?.displayName ?? node.resourceType}
      </text>
    </g>
  )
}
