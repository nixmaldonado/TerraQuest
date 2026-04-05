import type { LevelDefinition } from '../types/index'

export const level3: LevelDefinition = {
  id: 3,
  title: 'Hello Instance',
  subtitle: 'Launching your first server',
  description: `## Variables & EC2 Instances

**Variables** make your configuration reusable — define once, reference with \`var.name\`.

An **EC2 instance** is a virtual server. It needs an **AMI** (the OS image) and an **instance type** (the hardware size).

Your goal: define a variable for instance type and launch an EC2 instance in the existing subnet.`,
  concepts: ['variables', 'var.x references', 'EC2 instances', 'AMIs'],
  targetResources: [
    {
      type: 'aws_instance',
      displayName: 'EC2 Instance',
      requiredArgs: {
        ami: 'any',
        instance_type: 'any',
      },
    },
  ],
  starterCode: `provider "aws" {
  region = "us-east-1"
}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "web" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
}

# Create a variable for the instance type
# Then launch an EC2 instance in the subnet above
#
# variable "instance_type" {
#   default = "t2.micro"
# }
`,
  hints: [
    'Define a variable block with a default value',
    'Add: variable "instance_type" { default = "t2.micro" }',
    'Create the instance: resource "aws_instance" "web" { ami = "ami-0c55b159cbfafe1f0" instance_type = var.instance_type subnet_id = aws_subnet.web.id }',
  ],
  validationRules: [],
  scoring: {
    basePoints: 700,
    timeBonusThreshold: 180,
    securityBonusPoints: 0,
    efficiencyBonusPoints: 100,
  },
}
