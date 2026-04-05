import type { DeployedResource, TargetResource, DependencyGraph, LayoutNode } from '../../types/index'
import { RESOURCE_REGISTRY } from '../../engine/resources'

/**
 * Classify a resource type into its containment level.
 * Level 0: top-level (VPC, S3, LB)
 * Level 1: inside VPC (subnet, security group)
 * Level 2: inside subnet (instance, db_instance)
 */
function getContainmentLevel(resourceType: string): number {
  const def = RESOURCE_REGISTRY[resourceType]
  if (!def) return 0
  if (!def.visual.containedBy) return 0
  const parentDef = RESOURCE_REGISTRY[def.visual.containedBy]
  if (parentDef && parentDef.visual.containedBy) return 2
  return 1
}

/**
 * Find the parent address for a resource by examining its attributes for
 * reference fields (e.g., vpc_id, subnet_id).
 */
function findParentAddress(
  resourceType: string,
  attributes: Record<string, string>,
  allResources: Record<string, { type: string; name: string }>
): string | null {
  const def = RESOURCE_REGISTRY[resourceType]
  if (!def || !def.visual.containedBy) return null

  const parentType = def.visual.containedBy

  // Look for a reference arg that points to the parent type
  for (const argDef of def.args) {
    if (argDef.argType === 'reference' && argDef.referenceType === parentType) {
      const refValue = attributes[argDef.name]
      if (refValue) {
        // Reference format: "aws_vpc.main.id" or "aws_vpc.main"
        const parts = refValue.split('.')
        if (parts.length >= 2) {
          const candidateAddress = `${parts[0]}.${parts[1]}`
          if (allResources[candidateAddress]) {
            return candidateAddress
          }
        }
      }
    }
  }

  return null
}

interface ResourceEntry {
  address: string
  type: string
  name: string
  attributes: Record<string, string>
  isGhost: boolean
}

function buildLayoutNodes(resources: ResourceEntry[]): LayoutNode[] {
  // Build a lookup of all resources by address
  const lookup: Record<string, ResourceEntry> = {}
  for (const r of resources) {
    lookup[r.address] = r
  }

  // Classify resources by containment level
  const level0: ResourceEntry[] = []
  const level1: ResourceEntry[] = []
  const level2: ResourceEntry[] = []

  for (const r of resources) {
    const level = getContainmentLevel(r.type)
    if (level === 0) level0.push(r)
    else if (level === 1) level1.push(r)
    else level2.push(r)
  }

  // Map children to parents
  const childToParent: Record<string, string> = {}

  // Level 2 resources -> find parent subnet
  for (const r of level2) {
    const parentAddr = findParentAddress(r.type, r.attributes, lookup)
    if (parentAddr) {
      childToParent[r.address] = parentAddr
    }
  }

  // Level 1 resources -> find parent VPC
  for (const r of level1) {
    const parentAddr = findParentAddress(r.type, r.attributes, lookup)
    if (parentAddr) {
      childToParent[r.address] = parentAddr
    }
  }

  // Build leaf nodes (level 2: instances, db_instances)
  const leafNodes: Record<string, LayoutNode> = {}
  for (const r of level2) {
    leafNodes[r.address] = {
      id: r.address,
      resourceType: r.type,
      name: r.name,
      x: 0,
      y: 0,
      width: 120,
      height: 80,
      children: [],
      isGhost: r.isGhost,
    }
  }

  // Build subnet nodes (level 1 containers)
  const subnetNodes: Record<string, LayoutNode> = {}
  for (const r of level1) {
    const def = RESOURCE_REGISTRY[r.type]
    const isContainer = def?.visual.contains && def.visual.contains.length > 0

    if (isContainer) {
      // Gather children for this subnet
      const children: LayoutNode[] = []
      for (const leaf of level2) {
        if (childToParent[leaf.address] === r.address) {
          children.push(leafNodes[leaf.address])
        }
      }

      // Layout children in horizontal row
      const padding = 20
      const topPadding = 30
      const gap = 16

      let innerWidth = 0
      let innerHeight = 0
      if (children.length > 0) {
        let cx = padding
        for (const child of children) {
          child.x = cx
          child.y = topPadding
          cx += child.width + gap
          innerHeight = Math.max(innerHeight, child.height)
        }
        innerWidth = cx - gap + padding
        innerHeight += topPadding + padding
      } else {
        innerWidth = 160
        innerHeight = 80
      }

      subnetNodes[r.address] = {
        id: r.address,
        resourceType: r.type,
        name: r.name,
        x: 0,
        y: 0,
        width: Math.max(innerWidth, 160),
        height: Math.max(innerHeight, 80),
        children,
        isGhost: r.isGhost,
      }
    } else {
      // Non-container level 1 (e.g., security group) - treat as leaf-like
      subnetNodes[r.address] = {
        id: r.address,
        resourceType: r.type,
        name: r.name,
        x: 0,
        y: 0,
        width: 120,
        height: 80,
        children: [],
        isGhost: r.isGhost,
      }
    }
  }

  // Build VPC nodes (level 0 containers)
  const vpcNodes: LayoutNode[] = []
  const standaloneNodes: LayoutNode[] = []

  for (const r of level0) {
    const def = RESOURCE_REGISTRY[r.type]
    const isContainer = def?.visual.contains && def.visual.contains.length > 0

    if (isContainer) {
      // Gather child subnets and security groups for this VPC
      const children: LayoutNode[] = []
      for (const mid of level1) {
        if (childToParent[mid.address] === r.address) {
          children.push(subnetNodes[mid.address])
        }
      }

      // Layout children in horizontal row
      const padding = 20
      const topPadding = 40
      const gap = 20

      let innerWidth = 0
      let innerHeight = 0
      if (children.length > 0) {
        let cx = padding
        for (const child of children) {
          child.x = cx
          child.y = topPadding
          cx += child.width + gap
          innerHeight = Math.max(innerHeight, child.height)
        }
        innerWidth = cx - gap + padding
        innerHeight += topPadding + padding
      } else {
        innerWidth = 200
        innerHeight = 120
      }

      const node: LayoutNode = {
        id: r.address,
        resourceType: r.type,
        name: r.name,
        x: 0,
        y: 0,
        width: Math.max(innerWidth, 200),
        height: Math.max(innerHeight, 120),
        children,
        isGhost: r.isGhost,
      }
      vpcNodes.push(node)
    } else {
      // Standalone resources (S3, LB)
      standaloneNodes.push({
        id: r.address,
        resourceType: r.type,
        name: r.name,
        x: 0,
        y: 0,
        width: 120,
        height: 80,
        children: [],
        isGhost: r.isGhost,
      })
    }
  }

  // Also add orphaned level 1/2 resources as standalone
  for (const r of level1) {
    if (!childToParent[r.address]) {
      const existing = subnetNodes[r.address]
      if (existing) {
        standaloneNodes.push(existing)
      }
    }
  }
  for (const r of level2) {
    if (!childToParent[r.address]) {
      const existing = leafNodes[r.address]
      if (existing) {
        standaloneNodes.push(existing)
      }
    }
  }

  // Position VPCs horizontally
  let vpcX = 0
  for (const vpc of vpcNodes) {
    vpc.x = vpcX
    vpc.y = 0
    vpcX += vpc.width + 40
  }

  // Position standalone resources in a column to the right of VPCs
  const standaloneX = vpcX > 0 ? vpcX + 20 : 0
  let standaloneY = 0
  for (const node of standaloneNodes) {
    node.x = standaloneX
    node.y = standaloneY
    standaloneY += node.height + 16
  }

  // Combine all top-level nodes
  const allNodes = [...vpcNodes, ...standaloneNodes]

  // Center the layout
  if (allNodes.length > 0) {
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const node of allNodes) {
      minX = Math.min(minX, node.x)
      maxX = Math.max(maxX, node.x + node.width)
      minY = Math.min(minY, node.y)
      maxY = Math.max(maxY, node.y + node.height)
    }
    const totalWidth = maxX - minX
    const totalHeight = maxY - minY
    const offsetX = -totalWidth / 2
    const offsetY = -totalHeight / 2
    for (const node of allNodes) {
      node.x += offsetX
      node.y += offsetY
    }
  }

  return allNodes
}

export function computeLayout(
  deployedResources: Record<string, DeployedResource>,
  targetResources: TargetResource[],
  _graph: DependencyGraph | null
): LayoutNode[] {
  // Build resource entries from deployed resources
  const deployedEntries: ResourceEntry[] = Object.values(deployedResources).map((r) => ({
    address: r.address,
    type: r.type,
    name: r.name,
    attributes: r.attributes,
    isGhost: false,
  }))

  // Build ghost entries from target resources
  const ghostEntries: ResourceEntry[] = targetResources.map((t, i) => ({
    address: `ghost-${t.type}-${i}`,
    type: t.type,
    name: t.displayName,
    attributes: t.requiredArgs as Record<string, string>,
    isGhost: true,
  }))

  // Layout deployed resources
  const deployedNodes = buildLayoutNodes(deployedEntries)

  // Layout ghost resources separately, offset below deployed
  const ghostNodes = buildLayoutNodes(ghostEntries)

  // If we have both, offset ghosts below deployed
  if (deployedNodes.length > 0 && ghostNodes.length > 0) {
    let maxDeployedY = -Infinity
    for (const node of deployedNodes) {
      maxDeployedY = Math.max(maxDeployedY, node.y + node.height)
    }
    const ghostOffset = maxDeployedY + 60
    for (const node of ghostNodes) {
      node.y += ghostOffset
    }
  }

  return [...deployedNodes, ...ghostNodes]
}
