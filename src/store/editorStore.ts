import { create } from 'zustand'
import type { ASTProgram, Diagnostic, DependencyGraph, PlanResult, PlannedResource, DeployedResource, ScoreResult } from '../types/index'
import { parseHCL } from '../engine/parser'
import { buildDependencyGraph } from '../engine/graph'
import { validateAST } from '../engine/validator'
import { calculateScore } from '../engine/scoring'
import { getLevel } from '../levels/index'
import { useGameStore } from './gameStore'

interface EditorState {
  code: string
  ast: ASTProgram | null
  diagnostics: Diagnostic[]
  graph: DependencyGraph | null
  planResult: PlanResult | null
  isPlanVisible: boolean

  setCode: (code: string) => void
  runPlan: () => void
  runApply: () => void
  setInitialCode: (code: string) => void
  hidePlan: () => void
}

let parseTimeout: ReturnType<typeof setTimeout> | null = null

export const useEditorStore = create<EditorState>()((set, get) => ({
  code: '',
  ast: null,
  diagnostics: [],
  graph: null,
  planResult: null,
  isPlanVisible: false,

  setInitialCode: (code) => {
    set({ code, ast: null, diagnostics: [], graph: null, planResult: null, isPlanVisible: false })
    // Parse immediately for initial code
    const { ast, diagnostics } = parseHCL(code)
    const graph = ast.blocks.length > 0 ? buildDependencyGraph(ast) : null
    set({ ast, diagnostics, graph })
  },

  setCode: (code) => {
    set({ code })
    // Debounced parse
    if (parseTimeout) clearTimeout(parseTimeout)
    parseTimeout = setTimeout(() => {
      const { ast, diagnostics } = parseHCL(code)
      const graph = ast.blocks.length > 0 ? buildDependencyGraph(ast) : null
      set({ ast, diagnostics, graph })
    }, 300)
  },

  runPlan: () => {
    const { code } = get()
    // Re-parse fresh to get latest
    const { ast: freshAst, diagnostics: parseDiags } = parseHCL(code)
    const graph = freshAst.blocks.length > 0 ? buildDependencyGraph(freshAst) : null

    if (parseDiags.some((d) => d.severity === 'error')) {
      set({
        ast: freshAst,
        diagnostics: parseDiags,
        graph,
        planResult: { resources: [], errors: parseDiags, isValid: false },
        isPlanVisible: true,
      })
      return
    }

    // Validate against resource registry
    const validationDiags = graph ? validateAST(freshAst, graph) : []
    const allDiags = [...parseDiags, ...validationDiags]
    const hasErrors = allDiags.some((d) => d.severity === 'error')

    // Build plan resources
    const resources: PlannedResource[] = []
    const deployed = useGameStore.getState().deployedResources

    for (const block of freshAst.blocks) {
      if (block.blockType !== 'resource' || block.labels.length < 2) continue
      const address = `${block.labels[0]}.${block.labels[1]}`
      const isExisting = address in deployed

      const attributes: Record<string, string> = {}
      for (const [key, expr] of Object.entries(block.body.assignments)) {
        if (expr.type === 'string') attributes[key] = expr.value
        else if (expr.type === 'number') attributes[key] = String(expr.value)
        else if (expr.type === 'bool') attributes[key] = String(expr.value)
        else if (expr.type === 'reference') attributes[key] = expr.parts.join('.')
        else if (expr.type === 'list') attributes[key] = '[...]'
      }

      resources.push({
        address,
        type: block.labels[0],
        name: block.labels[1],
        action: isExisting ? 'modify' : 'create',
        attributes,
      })
    }

    // Mark destroyed resources
    for (const address of Object.keys(deployed)) {
      if (!resources.find((r) => r.address === address)) {
        const existing = deployed[address]
        resources.push({
          address,
          type: existing.type,
          name: existing.name,
          action: 'destroy',
          attributes: existing.attributes,
        })
      }
    }

    useGameStore.getState().incrementAttempts()

    set({
      ast: freshAst,
      diagnostics: allDiags,
      graph,
      planResult: { resources, errors: allDiags, isValid: !hasErrors },
      isPlanVisible: true,
    })
  },

  runApply: () => {
    const { planResult, graph } = get()
    if (!planResult || !planResult.isValid) return

    const gameStore = useGameStore.getState()
    if (!gameStore.startTime) {
      useGameStore.setState({ startTime: Date.now() })
    }

    // Clear existing deployed resources before applying
    gameStore.clearDeployedResources()

    const toCreate = planResult.resources.filter((r) => r.action === 'create' || r.action === 'modify')

    // Sort by dependency order if we have a graph
    const sorted = graph?.sorted ?? []
    toCreate.sort((a, b) => {
      const aIdx = sorted.indexOf(a.address)
      const bIdx = sorted.indexOf(b.address)
      return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx)
    })

    // Stagger deployment animations
    toCreate.forEach((resource, index) => {
      setTimeout(() => {
        const deployed: DeployedResource = {
          address: resource.address,
          type: resource.type,
          name: resource.name,
          attributes: resource.attributes,
          animationState: 'building',
        }
        useGameStore.getState().deployResource(resource.address, deployed)

        // Transition to deployed after animation
        setTimeout(() => {
          useGameStore.getState().finishAnimating(resource.address)
        }, 400)
      }, index * 500)
    })

    // After all resources finish deploying, check level completion
    const totalDelay = toCreate.length * 500 + 600
    setTimeout(() => {
      checkLevelCompletion()
    }, totalDelay)
  },

  hidePlan: () => set({ isPlanVisible: false }),
}))

function checkLevelCompletion() {
  const gameState = useGameStore.getState()
  const level = getLevel(gameState.currentLevel)
  if (!level) return

  const deployed = Object.values(gameState.deployedResources)

  // Check if all target resource types are present
  const allTargetsMet = level.targetResources.every((target) => {
    return deployed.some((d) => {
      if (d.type !== target.type) return false
      // Check required args match (if not 'any')
      for (const [key, val] of Object.entries(target.requiredArgs)) {
        if (val === 'any') continue
        if (d.attributes[key] !== val) return false
      }
      return true
    })
  })

  if (!allTargetsMet) return

  // Check validation rules
  const { ast } = useEditorStore.getState()
  let securityPassed = true
  if (ast && level.validationRules) {
    for (const rule of level.validationRules) {
      if (rule.type === 'has_provider') {
        const hasProvider = ast.blocks.some((b) => b.blockType === 'provider')
        if (!hasProvider) return // not complete
      }
      if (rule.type === 'has_output') {
        const hasOutput = ast.blocks.some((b) => b.blockType === 'output')
        if (!hasOutput) return // not complete
      }
      if (rule.type === 'no_open_ssh') {
        // Check for open SSH — this is a penalty, not a blocker
        for (const block of ast.blocks) {
          if (block.labels[0] !== 'aws_security_group') continue
          const ingressBlocks = block.body.nestedBlocks['ingress'] ?? []
          for (const ingress of ingressBlocks) {
            const fromPort = ingress.assignments['from_port']
            const cidrBlocks = ingress.assignments['cidr_blocks']
            if (
              fromPort?.type === 'number' && fromPort.value === 22 &&
              cidrBlocks?.type === 'list' &&
              cidrBlocks.items.some((item) => item.type === 'string' && item.value === '0.0.0.0/0')
            ) {
              securityPassed = false
            }
          }
        }
      }
      if (rule.type === 'custom' && rule.check) {
        if (!rule.check(ast.blocks)) return
      }
    }
  }

  // Calculate score
  const elapsed = gameState.startTime
    ? (Date.now() - gameState.startTime) / 1000
    : 0
  const score: ScoreResult = calculateScore(
    level,
    deployed,
    gameState.hintsUsed,
    gameState.attempts,
    elapsed,
    securityPassed
  )

  gameState.completeLevelWithScore(score)
}
