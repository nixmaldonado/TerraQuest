import type { LevelDefinition } from '../types/index'

export const level5: LevelDefinition = {
  id: 5,
  title: 'The Full Stack',
  subtitle: 'Putting it all together',
  description: `## Complete Infrastructure

Time to build a full stack! You need a **VPC**, **subnet**, **security group**, **EC2 instance**, and **S3 bucket**.

Use **outputs** to expose important values like instance IDs and bucket ARNs. Outputs make your infrastructure queryable after deployment.

This is your final challenge — put everything you have learned together!`,
  concepts: ['outputs', 'full architecture', 'dependency graphs'],
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
    {
      type: 'aws_security_group',
      displayName: 'Security Group',
      requiredArgs: {
        vpc_id: 'any',
      },
    },
    {
      type: 'aws_instance',
      displayName: 'EC2 Instance',
      requiredArgs: {
        ami: 'any',
        instance_type: 'any',
      },
    },
    {
      type: 'aws_s3_bucket',
      displayName: 'S3 Bucket',
      requiredArgs: {
        bucket: 'any',
      },
    },
  ],
  starterCode: `provider "aws" {
  region = "us-east-1"
}

# Build the complete infrastructure:
# 1. A VPC
# 2. A subnet inside the VPC
# 3. A security group for the VPC
# 4. An EC2 instance in the subnet
# 5. An S3 bucket for storage
# 6. Output the instance ID and bucket ARN
`,
  hints: [
    'Start with the VPC and work outward — subnet, then security group, then instance',
    'Don\'t forget the S3 bucket — it\'s standalone, no VPC needed',
    'Add outputs: output "instance_id" { value = aws_instance.YOUR_NAME.id }',
  ],
  validationRules: [
    {
      type: 'has_output',
      message: 'Add output blocks to expose important values from your infrastructure',
    },
  ],
  scoring: {
    basePoints: 1000,
    timeBonusThreshold: 300,
    securityBonusPoints: 100,
    efficiencyBonusPoints: 200,
  },
}
