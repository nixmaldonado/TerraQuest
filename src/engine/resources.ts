import type { ResourceDefinition } from '../types/index'

export const RESOURCE_REGISTRY: Record<string, ResourceDefinition> = {
  aws_vpc: {
    type: 'aws_vpc',
    displayName: 'AWS VPC',
    category: 'network',
    args: [
      {
        name: 'cidr_block',
        argType: 'string',
        required: true,
        description: 'The IPv4 CIDR block for the VPC (e.g., "10.0.0.0/16")',
        validPattern: /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/,
      },
    ],
    outputs: ['id', 'cidr_block'],
    visual: {
      icon: 'vpc',
      color: '#3b82f6',
      width: 500,
      height: 300,
      contains: ['aws_subnet', 'aws_security_group'],
    },
  },

  aws_subnet: {
    type: 'aws_subnet',
    displayName: 'AWS Subnet',
    category: 'network',
    args: [
      {
        name: 'vpc_id',
        argType: 'reference',
        required: true,
        description: 'The VPC ID this subnet belongs to',
        referenceType: 'aws_vpc',
      },
      {
        name: 'cidr_block',
        argType: 'string',
        required: true,
        description: 'The IPv4 CIDR block for the subnet (e.g., "10.0.1.0/24")',
        validPattern: /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/,
      },
      {
        name: 'availability_zone',
        argType: 'string',
        required: true,
        description: 'The availability zone for the subnet (e.g., "us-east-1a")',
      },
    ],
    outputs: ['id', 'cidr_block', 'vpc_id'],
    visual: {
      icon: 'subnet',
      color: '#06b6d4',
      width: 300,
      height: 200,
      containedBy: 'aws_vpc',
      contains: ['aws_instance', 'aws_db_instance'],
    },
  },

  aws_instance: {
    type: 'aws_instance',
    displayName: 'AWS EC2 Instance',
    category: 'compute',
    args: [
      {
        name: 'ami',
        argType: 'string',
        required: true,
        description:
          'The Amazon Machine Image ID that determines what OS your instance runs (e.g., "ami-0c55b159cbfafe1f0")',
        validPattern: /^ami-[a-f0-9]+$/,
      },
      {
        name: 'instance_type',
        argType: 'string',
        required: true,
        description: 'The size of the instance (e.g., "t2.micro" for the free tier)',
        validValues: ['t2.micro', 't2.small', 't2.medium', 't3.micro', 't3.small', 't3.medium'],
      },
      {
        name: 'subnet_id',
        argType: 'reference',
        required: false,
        description: 'The subnet to launch the instance in',
        referenceType: 'aws_subnet',
      },
      {
        name: 'vpc_security_group_ids',
        argType: 'list',
        required: false,
        description: 'A list of security group IDs to attach to the instance',
      },
    ],
    outputs: ['id', 'public_ip', 'private_ip'],
    visual: {
      icon: 'server',
      color: '#f97316',
      width: 120,
      height: 80,
      containedBy: 'aws_subnet',
    },
  },

  aws_security_group: {
    type: 'aws_security_group',
    displayName: 'AWS Security Group',
    category: 'network',
    args: [
      {
        name: 'vpc_id',
        argType: 'reference',
        required: true,
        description: 'The VPC ID this security group belongs to',
        referenceType: 'aws_vpc',
      },
      {
        name: 'name',
        argType: 'string',
        required: false,
        description: 'A human-friendly name for the security group',
      },
      {
        name: 'description',
        argType: 'string',
        required: false,
        description: 'A description of the security group\'s purpose',
      },
      {
        name: 'ingress',
        argType: 'block',
        required: false,
        description: 'Inbound traffic rules — defines what traffic is allowed to reach your resources',
      },
      {
        name: 'egress',
        argType: 'block',
        required: false,
        description: 'Outbound traffic rules — defines what traffic your resources can send',
      },
    ],
    outputs: ['id', 'name'],
    visual: {
      icon: 'shield',
      color: '#ef4444',
      width: 120,
      height: 80,
      containedBy: 'aws_vpc',
    },
  },

  aws_s3_bucket: {
    type: 'aws_s3_bucket',
    displayName: 'AWS S3 Bucket',
    category: 'storage',
    args: [
      {
        name: 'bucket',
        argType: 'string',
        required: true,
        description: 'A globally unique name for the S3 bucket',
      },
      {
        name: 'acl',
        argType: 'string',
        required: false,
        description: 'The access control policy for the bucket',
        validValues: ['private', 'public-read', 'public-read-write'],
      },
    ],
    outputs: ['id', 'arn', 'bucket'],
    visual: {
      icon: 'bucket',
      color: '#10b981',
      width: 120,
      height: 80,
    },
  },

  aws_db_instance: {
    type: 'aws_db_instance',
    displayName: 'AWS RDS Database',
    category: 'database',
    args: [
      {
        name: 'engine',
        argType: 'string',
        required: true,
        description: 'The database engine to use (e.g., "postgres")',
        validValues: ['mysql', 'postgres', 'mariadb'],
      },
      {
        name: 'instance_class',
        argType: 'string',
        required: true,
        description: 'The compute and memory capacity of the DB instance (e.g., "db.t2.micro")',
      },
      {
        name: 'allocated_storage',
        argType: 'number',
        required: true,
        description: 'The amount of storage in GB to allocate to the database',
      },
      {
        name: 'name',
        argType: 'string',
        required: false,
        description: 'The name of the database to create when the instance is created',
      },
      {
        name: 'subnet_id',
        argType: 'reference',
        required: false,
        description: 'The subnet to place the database instance in',
        referenceType: 'aws_subnet',
      },
    ],
    outputs: ['id', 'endpoint', 'address'],
    visual: {
      icon: 'database',
      color: '#8b5cf6',
      width: 120,
      height: 80,
      containedBy: 'aws_subnet',
    },
  },

  aws_lb: {
    type: 'aws_lb',
    displayName: 'AWS Load Balancer',
    category: 'loadbalancer',
    args: [
      {
        name: 'load_balancer_type',
        argType: 'string',
        required: true,
        description: 'The type of load balancer: "application" for HTTP/HTTPS or "network" for TCP/UDP',
        validValues: ['application', 'network'],
      },
      {
        name: 'name',
        argType: 'string',
        required: false,
        description: 'A name for the load balancer',
      },
      {
        name: 'subnets',
        argType: 'list',
        required: false,
        description: 'A list of subnet IDs to attach to the load balancer',
      },
    ],
    outputs: ['id', 'dns_name', 'arn'],
    visual: {
      icon: 'loadbalancer',
      color: '#f59e0b',
      width: 120,
      height: 80,
    },
  },
}

export function getResourceDef(type: string): ResourceDefinition | undefined {
  return RESOURCE_REGISTRY[type]
}
