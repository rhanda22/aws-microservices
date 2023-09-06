import * as cdk from 'aws-cdk-lib';
import { RemovalPolicy } from 'aws-cdk-lib';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { JsonPath, StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { join } from 'path';
import { PocDatabase } from './database';
import { Services } from './service';
import { Api } from './api';
import { PocEventBus } from './eventbus';
import { Datadog } from "datadog-cdk-constructs-v2";
import { StateMachineTarget } from './state-machine';
import * as iam from 'aws-cdk-lib/aws-iam';
// import * as sqs from 'aws-cdk-lib/aws-sqs';


export interface StackProps{
  dept: string,
  project: string,
  env: string,
  role?:iam.IRole

}


export class AwsMicroservicesStack extends cdk.Stack {

  constructor(scope: Construct, id: string,sprops:StackProps,props?: cdk.StackProps) {
    super(scope, id, props);

    const datadog = new Datadog(this, "Datadog", {
      nodeLayerVersion: 84,
      extensionLayerVersion: 32,
      site: "datadoghq.com",
      apiKey: "c0ac8f1786bec64bb761950e434fe271",
      service:"poc"
    });

    const serviceRole = iam.Role.fromRoleArn(
      this,
      'imported-role',
      `arn:aws:iam::${cdk.Stack.of(this).account}:role/lambdadynamo`,
      {mutable: false},
    );

    console.log('importedRole 👉', serviceRole.roleName);

    sprops.role = serviceRole;

    const database = new PocDatabase(this,'pocDatabase',sprops.dept,sprops.project,sprops.env);

    const services = new Services(this,'pocServices',{productTable:database.productTable,roleTable:database.roleTable},datadog,sprops)
    
    const pocApi = new Api(this,'pocApi',{productService:services.productMicroservice,roleService:services.roleMicroservice})

    const stateMachine = new StateMachineTarget(this,'auditStateMachine',{logicalEnv:"dev",accountId:"poc"})

    const eventBus = new PocEventBus(this, 'pocEventBus',{publisher:services.productMicroservice, publisher2:services.roleMicroservice,
      subscriber:services.subscribeMicroservice,stateMachine:stateMachine.stateMachine})
 
  }
}
