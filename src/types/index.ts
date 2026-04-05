// ── Token Types ──

export enum TokenType {
  IDENTIFIER = 'IDENTIFIER',
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOL = 'BOOL',
  EQUALS = 'EQUALS',
  LBRACE = 'LBRACE',
  RBRACE = 'RBRACE',
  LBRACKET = 'LBRACKET',
  RBRACKET = 'RBRACKET',
  DOT = 'DOT',
  COMMA = 'COMMA',
  NEWLINE = 'NEWLINE',
  COMMENT = 'COMMENT',
  EOF = 'EOF',
}

export interface Token {
  type: TokenType
  value: string
  line: number
  column: number
}

// ── AST Types ──

export interface ASTProgram {
  type: 'program'
  blocks: ASTBlock[]
}

export interface ASTBlock {
  type: 'block'
  blockType: string
  labels: string[]
  body: ASTBody
  line: number
  column: number
}

export interface ASTBody {
  assignments: Record<string, ASTExpression>
  nestedBlocks: Record<string, ASTBody[]>
}

export type ASTExpression =
  | { type: 'string'; value: string; line: number; column: number }
  | { type: 'number'; value: number; line: number; column: number }
  | { type: 'bool'; value: boolean; line: number; column: number }
  | { type: 'list'; items: ASTExpression[]; line: number; column: number }
  | { type: 'reference'; parts: string[]; line: number; column: number }

// ── Diagnostics ──

export interface Diagnostic {
  line: number
  column: number
  endLine?: number
  endColumn?: number
  message: string
  severity: 'error' | 'warning' | 'info'
}

// ── Resource Registry ──

export interface ArgDef {
  name: string
  argType: 'string' | 'number' | 'bool' | 'list' | 'reference' | 'block'
  required: boolean
  description: string
  validPattern?: RegExp
  validValues?: string[]
  referenceType?: string
}

export interface ResourceDefinition {
  type: string
  displayName: string
  category: 'compute' | 'network' | 'storage' | 'database' | 'loadbalancer'
  args: ArgDef[]
  outputs: string[]
  visual: {
    icon: 'server' | 'network' | 'database' | 'bucket' | 'shield' | 'loadbalancer' | 'subnet' | 'vpc'
    color: string
    width: number
    height: number
    containedBy?: string
    contains?: string[]
  }
}

// ── Dependency Graph ──

export interface GraphNode {
  id: string
  resourceType: string
  name: string
  block: ASTBlock
  dependsOn: string[]
  dependedBy: string[]
}

export interface DependencyGraph {
  nodes: Map<string, GraphNode>
  edges: Array<{ from: string; to: string }>
  sorted: string[]
  hasCycle: boolean
}

// ── Plan ──

export interface PlannedResource {
  address: string
  type: string
  name: string
  action: 'create' | 'modify' | 'destroy'
  attributes: Record<string, string>
}

export interface PlanResult {
  resources: PlannedResource[]
  errors: Diagnostic[]
  isValid: boolean
}

// ── Deployed Resources ──

export interface DeployedResource {
  address: string
  type: string
  name: string
  attributes: Record<string, string>
  animationState: 'building' | 'deployed' | 'idle'
}

// ── Levels ──

export interface TargetResource {
  type: string
  displayName: string
  requiredArgs: Record<string, string | 'any'>
  mustReferenceType?: string
}

export interface ValidationRule {
  type: 'no_open_ssh' | 'has_output' | 'has_provider' | 'custom'
  message: string
  check?: (blocks: ASTBlock[]) => boolean
}

export interface LevelDefinition {
  id: number
  title: string
  subtitle: string
  description: string
  concepts: string[]
  targetResources: TargetResource[]
  starterCode: string
  hints: string[]
  validationRules: ValidationRule[]
  scoring: {
    basePoints: number
    timeBonusThreshold: number
    securityBonusPoints: number
    efficiencyBonusPoints: number
  }
}

// ── Scoring ──

export interface ScoreResult {
  score: number
  maxScore: number
  stars: 1 | 2 | 3
  breakdown: {
    correctness: number
    timeBonus: number
    securityBonus: number
    efficiencyBonus: number
    hintPenalty: number
    attemptPenalty: number
  }
}

// ── Canvas Layout ──

export interface LayoutNode {
  id: string
  resourceType: string
  name: string
  x: number
  y: number
  width: number
  height: number
  children: LayoutNode[]
  isGhost: boolean
}

// ── Game State ──

export interface LevelProgress {
  completed: boolean
  stars: number
  bestScore: number
}

export type GameView = 'levelSelect' | 'briefing' | 'playing' | 'scoreCard'
