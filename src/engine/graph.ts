import type { ASTProgram, ASTBody, ASTExpression, DependencyGraph, GraphNode } from '../types/index'

/**
 * Recursively walks all expressions within an AST body,
 * including expressions inside nested blocks.
 */
function walkExpressions(body: ASTBody, callback: (expr: ASTExpression) => void): void {
  for (const expr of Object.values(body.assignments)) {
    visitExpression(expr, callback)
  }

  for (const nestedBodies of Object.values(body.nestedBlocks)) {
    for (const nestedBody of nestedBodies) {
      walkExpressions(nestedBody, callback)
    }
  }
}

function visitExpression(expr: ASTExpression, callback: (expr: ASTExpression) => void): void {
  callback(expr)
  if (expr.type === 'list') {
    for (const item of expr.items) {
      visitExpression(item, callback)
    }
  }
}

/**
 * Builds a dependency graph from a parsed AST program.
 * Identifies resource nodes, resolves reference expressions to edges,
 * and produces a topologically sorted ordering using Kahn's algorithm.
 */
export function buildDependencyGraph(ast: ASTProgram): DependencyGraph {
  const nodes = new Map<string, GraphNode>()
  const edges: Array<{ from: string; to: string }> = []

  // Step 1: Collect all resource and variable nodes
  for (const block of ast.blocks) {
    if (block.blockType === 'resource' && block.labels.length >= 2) {
      const id = `${block.labels[0]}.${block.labels[1]}`
      nodes.set(id, {
        id,
        resourceType: block.labels[0],
        name: block.labels[1],
        block,
        dependsOn: [],
        dependedBy: [],
      })
    } else if (block.blockType === 'variable' && block.labels.length >= 1) {
      const id = `var.${block.labels[0]}`
      nodes.set(id, {
        id,
        resourceType: 'variable',
        name: block.labels[0],
        block,
        dependsOn: [],
        dependedBy: [],
      })
    }
  }

  // Step 2: Walk expressions and build edges
  for (const block of ast.blocks) {
    if (block.blockType === 'resource' && block.labels.length >= 2) {
      const fromId = `${block.labels[0]}.${block.labels[1]}`

      walkExpressions(block.body, (expr) => {
        if (expr.type === 'reference' && expr.parts.length >= 2) {
          // Variables are always available — skip them
          if (expr.parts[0] === 'var') {
            return
          }

          const toId = `${expr.parts[0]}.${expr.parts[1]}`
          if (nodes.has(toId)) {
            edges.push({ from: fromId, to: toId })

            const fromNode = nodes.get(fromId)!
            const toNode = nodes.get(toId)!

            if (!fromNode.dependsOn.includes(toId)) {
              fromNode.dependsOn.push(toId)
            }
            if (!toNode.dependedBy.includes(fromId)) {
              toNode.dependedBy.push(fromId)
            }
          }
        }
      })
    }
  }

  // Step 3: Topological sort using Kahn's algorithm
  const inDegree = new Map<string, number>()
  for (const id of nodes.keys()) {
    inDegree.set(id, 0)
  }
  for (const edge of edges) {
    inDegree.set(edge.from, (inDegree.get(edge.from) ?? 0) + 1)
  }

  const queue: string[] = []
  for (const [id, degree] of inDegree) {
    if (degree === 0) {
      queue.push(id)
    }
  }

  const sorted: string[] = []
  while (queue.length > 0) {
    const current = queue.shift()!
    sorted.push(current)

    const node = nodes.get(current)!
    for (const dependedById of node.dependedBy) {
      const newDegree = (inDegree.get(dependedById) ?? 1) - 1
      inDegree.set(dependedById, newDegree)
      if (newDegree === 0) {
        queue.push(dependedById)
      }
    }
  }

  const hasCycle = sorted.length < nodes.size

  return { nodes, edges, sorted, hasCycle }
}
