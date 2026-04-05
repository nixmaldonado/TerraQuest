import type { LevelDefinition } from '../types/index'

export const level1: LevelDefinition = {
  id: 1,
  title: 'First Light',
  subtitle: 'Your first deployment',
  description: `## Welcome to Terraform!

**Provider blocks** tell Terraform which cloud platform to talk to (AWS, GCP, Azure, etc.).
**Resource blocks** define the actual infrastructure you want to create.

Your goal: configure the AWS provider and create an S3 bucket.`,
  concepts: ['provider blocks', 'resource blocks', 'basic arguments'],
  targetResources: [
    {
      type: 'aws_s3_bucket',
      displayName: 'S3 Bucket',
      requiredArgs: {
        bucket: 'any',
      },
    },
  ],
  starterCode: `# Welcome to TerraQuest!
#
# Your mission: Configure the AWS provider and create an S3 bucket.
#
# Step 1: Add a provider block for AWS with a region
# Step 2: Create an S3 bucket resource
#
# provider "aws" {
#   region = "us-east-1"
# }
`,
  hints: [
    'Start with a provider block — every Terraform config needs one',
    'Use: provider "aws" { region = "us-east-1" }',
    'Now add: resource "aws_s3_bucket" "my_bucket" { bucket = "my-unique-bucket" }',
  ],
  validationRules: [
    {
      type: 'has_provider',
      message: 'You need a provider block to tell Terraform which cloud to use',
    },
  ],
  scoring: {
    basePoints: 500,
    timeBonusThreshold: 120,
    securityBonusPoints: 0,
    efficiencyBonusPoints: 100,
  },
}
