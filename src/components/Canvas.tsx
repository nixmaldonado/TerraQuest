import React, { useMemo } from 'react'
import { useGameStore } from '../store/gameStore'
import { useEditorStore } from '../store/editorStore'
import { computeLayout } from './canvas/layout'
import { ResourceNode } from './canvas/ResourceNode'
import { VpcNode } from './canvas/VpcNode'
import { SubnetNode } from './canvas/SubnetNode'
import { GhostNode } from './canvas/GhostNode'
import { ConnectionLine } from './canvas/ConnectionLine'
import { getLevel } from '../levels/index'
import type { LayoutNode } from '../types/index'

function renderNodeTree(
  node: LayoutNode,
  animatingResources: string[]
): React.ReactNode {
  const isAnimating = animatingResources.includes(node.id)

  if (node.resourceType === 'aws_vpc') {
    return (
      <VpcNode key={node.id} node={node}>
        {node.children.map((child) => renderNodeTree(child, animatingResources))}
      </VpcNode>
    )
  }

  if (node.resourceType === 'aws_subnet') {
    return (
      <SubnetNode key={node.id} node={node}>
        {node.children.map((child) => renderNodeTree(child, animatingResources))}
      </SubnetNode>
    )
  }

  return (
    <ResourceNode key={node.id} node={node} isAnimating={isAnimating} />
  )
}

export const Canvas: React.FC = () => {
  const deployedResources = useGameStore((s) => s.deployedResources)
  const animatingResources = useGameStore((s) => s.animatingResources)
  const currentLevel = useGameStore((s) => s.currentLevel)
  const graph = useEditorStore((s) => s.graph)

  const targetResources = useMemo(
    () => getLevel(currentLevel)?.targetResources ?? [],
    [currentLevel]
  )

  const layoutNodes = useMemo(
    () => computeLayout(deployedResources, targetResources, graph),
    [deployedResources, targetResources, graph]
  )

  // Separate ghost nodes from deployed nodes
  const ghostNodes = layoutNodes.filter((n) => n.isGhost)
  const deployedNodes = layoutNodes.filter((n) => !n.isGhost)

  // Compute viewBox to fit all nodes
  const allNodes = layoutNodes
  let minX = 0
  let minY = 0
  let maxX = 400
  let maxY = 300

  if (allNodes.length > 0) {
    minX = Infinity
    minY = Infinity
    maxX = -Infinity
    maxY = -Infinity
    for (const node of allNodes) {
      minX = Math.min(minX, node.x)
      minY = Math.min(minY, node.y)
      maxX = Math.max(maxX, node.x + node.width)
      maxY = Math.max(maxY, node.y + node.height)
    }
  }

  const padding = 40
  const vbX = minX - padding
  const vbY = minY - padding
  const vbW = maxX - minX + padding * 2
  const vbH = maxY - minY + padding * 2

  // Build connection lines from dependency graph edges
  const connectionLines: React.ReactNode[] = []
  if (graph) {
    const nodeMap = new Map<string, LayoutNode>()

    function indexNodes(nodes: LayoutNode[]) {
      for (const node of nodes) {
        nodeMap.set(node.id, node)
        if (node.children.length > 0) {
          indexNodes(node.children)
        }
      }
    }
    indexNodes(deployedNodes)

    for (const edge of graph.edges) {
      const fromNode = nodeMap.get(edge.from)
      const toNode = nodeMap.get(edge.to)
      if (fromNode && toNode) {
        const isAnimated =
          animatingResources.includes(edge.from) ||
          animatingResources.includes(edge.to)
        connectionLines.push(
          <ConnectionLine
            key={`${edge.from}->${edge.to}`}
            from={fromNode}
            to={toNode}
            animated={isAnimated}
          />
        )
      }
    }
  }

  // Check if deployed resources match target (ghost matched state)
  const deployedTypes = new Set(
    Object.values(deployedResources).map((r) => r.type)
  )

  const isEmpty = deployedNodes.length === 0 && ghostNodes.length === 0

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ background: 'transparent' }}
    >
      {/* Ghost nodes (behind everything) */}
      {ghostNodes.map((node) => (
        <GhostNode
          key={node.id}
          node={node}
          isMatched={deployedTypes.has(node.resourceType)}
        />
      ))}

      {/* Connection lines */}
      {connectionLines}

      {/* Deployed resource tree */}
      {deployedNodes.map((node) => renderNodeTree(node, animatingResources))}

      {/* Empty state */}
      {isEmpty && (
        <text
          x={200}
          y={150}
          textAnchor="middle"
          fill="#6b7280"
          fontSize={14}
          fontFamily="sans-serif"
        >
          Write Terraform code and apply to see resources here
        </text>
      )}
    </svg>
  )
}
