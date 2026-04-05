import type { LevelDefinition } from '../types/index'

export const level4: LevelDefinition = {
  id: 4,
  title: 'Lock the Door',
  subtitle: 'Securing your infrastructure',
  description: `## Security Groups

A **security group** is a virtual firewall that controls traffic to your resources.

**Ingress rules** control incoming traffic, **egress rules** control outgoing traffic. Each rule specifies ports, protocols, and allowed IP ranges.

**Warning:** Opening SSH (port 22) to \`0.0.0.0/0\` means anyone on the internet can attempt to connect — always restrict it!

Your goal: create a security group with safe ingress rules.`,
  concepts: ['security groups', 'ingress/egress rules', 'nested blocks', 'security best practices'],
  targetResources: [
    {
      type: 'aws_security_group',
      displayName: 'Security Group',
      requiredArgs: {
        vpc_id: 'any',
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

resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  subnet_id     = aws_subnet.web.id
}

# Create a security group that:
# - Allows HTTP (port 80) from anywhere (0.0.0.0/0)
# - Allows SSH (port 22) from your IP only (e.g., "10.0.0.0/8")
# - WARNING: Opening SSH to 0.0.0.0/0 will cost you points!
`,
  hints: [
    'Security groups need a vpc_id and ingress blocks',
    'Each ingress block needs: from_port, to_port, protocol, cidr_blocks',
    'For SSH, use a specific CIDR like "10.0.0.0/8" — not "0.0.0.0/0"!',
  ],
  validationRules: [
    {
      type: 'no_open_ssh',
      message: 'SSH (port 22) is open to 0.0.0.0/0 — this is a security risk!',
    },
  ],
  scoring: {
    basePoints: 700,
    timeBonusThreshold: 240,
    securityBonusPoints: 200,
    efficiencyBonusPoints: 100,
  },
}
