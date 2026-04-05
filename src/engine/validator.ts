import type { ASTProgram, ASTBlock, ASTBody, ASTExpression, Diagnostic, DependencyGraph } from '../types/index'
import { RESOURCE_REGISTRY } from './resources'

/**
 * Validates a parsed AST against the resource registry and dependency graph.
 * Returns an array of diagnostics with educational, helpful messages.
 */
export function validateAST(ast: ASTProgram, graph: DependencyGraph): Diagnostic[] {
  const diagnostics: Diagnostic[] = []
  const declaredAddresses = new Map<string, ASTBlock>()

  for (const block of ast.blocks) {
    if (block.blockType !== 'resource' || block.labels.length < 2) {
      continue
    }

    const resourceType = block.labels[0]
    const resourceName = block.labels[1]
    const address = `${resourceType}.${resourceName}`

    // Check 7: Duplicate resource addresses
    if (declaredAddresses.has(address)) {
      diagnostics.push({
        line: block.line,
        column: block.column,
        message: `Duplicate resource "${address}" — each resource must have a unique type and name combination. Try renaming this to "${resourceName}_2" or a more descriptive name.`,
        severity: 'error',
      })
      continue
    }
    declaredAddresses.set(address, block)

    // Check 1: Resource type must exist in registry
    const def = RESOURCE_REGISTRY[resourceType]
    if (!def) {
      const knownTypes = Object.keys(RESOURCE_REGISTRY).join(', ')
      diagnostics.push({
        line: block.line,
        column: block.column,
        message: `Unknown resource type "${resourceType}" — did you mean one of: ${knownTypes}?`,
        severity: 'error',
      })
      continue
    }

    // Check 2: Required args must be present
    for (const argDef of def.args) {
      if (!argDef.required) continue
      if (argDef.argType === 'block') continue // Blocks are optional even if marked required

      const value = block.body.assignments[argDef.name]
      if (value === undefined) {
        diagnostics.push({
          line: block.line,
          column: block.column,
          message: buildMissingArgMessage(resourceType, argDef.name, argDef.description),
          severity: 'error',
        })
      }
    }

    // Validate each assignment
    for (const [argName, expr] of Object.entries(block.body.assignments)) {
      const argDef = def.args.find((a) => a.name === argName)
      if (!argDef) continue

      // Check 3: validPattern
      if (argDef.validPattern && expr.type === 'string') {
        if (!argDef.validPattern.test(expr.value)) {
          diagnostics.push({
            line: expr.line,
            column: expr.column,
            message: `Invalid value "${expr.value}" for "${argName}" — it must match the pattern ${argDef.validPattern}. ${argDef.description}`,
            severity: 'error',
          })
        }
      }

      // Check 4: validValues
      if (argDef.validValues && expr.type === 'string') {
        if (!argDef.validValues.includes(expr.value)) {
          diagnostics.push({
            line: expr.line,
            column: expr.column,
            message: `Invalid value "${expr.value}" for "${argName}" — must be one of: ${argDef.validValues.join(', ')}. ${argDef.description}`,
            severity: 'error',
          })
        }
      }

      // Check 5: References must resolve
      validateReferences(expr, graph, diagnostics)
    }

    // Check 6: Validate nested blocks (ingress/egress)
    validateNestedBlocks(block, def.type, graph, diagnostics)

    // Check 8: Security — SSH open to the world
    if (resourceType === 'aws_security_group') {
      checkOpenSSH(block.body, diagnostics)
    }
  }

  return diagnostics
}

function validateReferences(
  expr: ASTExpression,
  graph: DependencyGraph,
  diagnostics: Diagnostic[]
): void {
  if (expr.type === 'reference') {
    if (expr.parts[0] === 'var') {
      const varId = `var.${expr.parts[1]}`
      if (!graph.nodes.has(varId)) {
        diagnostics.push({
          line: expr.line,
          column: expr.column,
          message: `Undefined variable "var.${expr.parts[1]}" — make sure you have a variable block that declares "${expr.parts[1]}".`,
          severity: 'error',
        })
      }
    } else if (expr.parts.length >= 2) {
      const targetId = `${expr.parts[0]}.${expr.parts[1]}`
      if (!graph.nodes.has(targetId)) {
        diagnostics.push({
          line: expr.line,
          column: expr.column,
          message: `Reference to undeclared resource "${targetId}" — you need to define a resource block for "${expr.parts[0]}" named "${expr.parts[1]}" before referencing it.`,
          severity: 'error',
        })
      }
    }
  } else if (expr.type === 'list') {
    for (const item of expr.items) {
      validateReferences(item, graph, diagnostics)
    }
  }
}

function validateNestedBlocks(
  block: ASTBlock,
  _resourceType: string,
  graph: DependencyGraph,
  diagnostics: Diagnostic[]
): void {
  const nestedBlockArgNames = ['ingress', 'egress']

  for (const blockName of nestedBlockArgNames) {
    const nestedBodies = block.body.nestedBlocks[blockName]
    if (!nestedBodies) continue

    for (const nestedBody of nestedBodies) {
      // Validate known sub-arguments exist
      const validSubArgs = ['from_port', 'to_port', 'protocol', 'cidr_blocks']
      for (const [argName, expr] of Object.entries(nestedBody.assignments)) {
        if (!validSubArgs.includes(argName)) {
          diagnostics.push({
            line: expr.line,
            column: expr.column,
            message: `Unknown argument "${argName}" in ${blockName} block — valid arguments are: ${validSubArgs.join(', ')}.`,
            severity: 'warning',
          })
        }
        // Also validate references inside nested blocks
        validateReferences(expr, graph, diagnostics)
      }
    }
  }
}

function checkOpenSSH(body: ASTBody, diagnostics: Diagnostic[]): void {
  const ingressBlocks = body.nestedBlocks['ingress']
  if (!ingressBlocks) return

  for (const ingress of ingressBlocks) {
    const fromPort = ingress.assignments['from_port']
    const cidrBlocks = ingress.assignments['cidr_blocks']

    const isPort22 =
      fromPort && fromPort.type === 'number' && fromPort.value === 22

    const hasOpenCidr =
      cidrBlocks &&
      cidrBlocks.type === 'list' &&
      cidrBlocks.items.some(
        (item) => item.type === 'string' && item.value === '0.0.0.0/0'
      )

    if (isPort22 && hasOpenCidr) {
      diagnostics.push({
        line: fromPort.line,
        column: fromPort.column,
        message:
          'SSH open to the world is a security risk — allowing SSH (port 22) from "0.0.0.0/0" means anyone on the internet can attempt to connect. Restrict this to your IP address or a trusted CIDR range instead.',
        severity: 'warning',
      })
    }
  }
}

function buildMissingArgMessage(resourceType: string, argName: string, description: string): string {
  const examples: Record<string, Record<string, string>> = {
    aws_instance: {
      ami: 'e.g., "ami-0c55b159cbfafe1f0"',
      instance_type: 'e.g., "t2.micro" for the free tier',
    },
    aws_vpc: {
      cidr_block: 'e.g., "10.0.0.0/16"',
    },
    aws_subnet: {
      vpc_id: 'e.g., aws_vpc.main.id',
      cidr_block: 'e.g., "10.0.1.0/24"',
      availability_zone: 'e.g., "us-east-1a"',
    },
    aws_security_group: {
      vpc_id: 'e.g., aws_vpc.main.id',
    },
    aws_s3_bucket: {
      bucket: 'e.g., "my-unique-bucket-name"',
    },
    aws_db_instance: {
      engine: 'e.g., "postgres"',
      instance_class: 'e.g., "db.t2.micro"',
      allocated_storage: 'e.g., 20',
    },
    aws_lb: {
      load_balancer_type: 'e.g., "application"',
    },
  }

  const example = examples[resourceType]?.[argName] ?? ''
  const exampleSuffix = example ? ` (${example})` : ''

  return `Resource "${resourceType}" requires an "${argName}" argument — ${description}${exampleSuffix}`
}
