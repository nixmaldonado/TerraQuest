import type { LevelDefinition } from '../types/index'

export const level2: LevelDefinition = {
  id: 2,
  title: 'Networking 101',
  subtitle: 'Building your private cloud',
  description: `## Virtual Private Clouds

A **VPC** is your own private network in the cloud. **Subnets** divide it into segments for organizing resources.

Resources in a subnet must reference the VPC they belong to using Terraform references like \`aws_vpc.name.id\`.

Your goal: create a VPC and a subnet inside it.`,
  concepts: ['VPCs', 'subnets', 'resource references', 'CIDR blocks'],
  targetResources: [
    {
      type: 'aws_vpc',
      displayName: 'VPC',
      requiredArgs: {
        cidr_block: 'any',
      },
    },
    {
      type: 'aws_subnet',
      displayName: 'Subnet',
      requiredArgs: {
        vpc_id: 'any',
        cidr_block: 'any',
        availability_zone: 'any',
      },
    },
  ],
  starterCode: `provider "aws" {
  region = "us-east-1"
}

# Create a VPC with CIDR block "10.0.0.0/16"
# Then create a subnet inside it
# The subnet needs to reference the VPC using: aws_vpc.YOUR_NAME.id
`,
  hints: [
    'A VPC needs a cidr_block argument — try "10.0.0.0/16"',
    'Create the VPC first: resource "aws_vpc" "main" { cidr_block = "10.0.0.0/16" }',
    'The subnet references the VPC: vpc_id = aws_vpc.main.id',
  ],
  validationRules: [],
  scoring: {
    basePoints: 600,
    timeBonusThreshold: 180,
    securityBonusPoints: 0,
    efficiencyBonusPoints: 100,
  },
}
