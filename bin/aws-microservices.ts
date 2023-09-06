#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsMicroservicesStack } from '../lib/aws-microservices-stack';

const app = new cdk.App();
const awsSvc = new AwsMicroservicesStack(app, 'AwsMicroservicesStack',{dept:'cm',env:'d',project:'apiim'}, {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
   env: {},
   tags:{

   }

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

cdk.Tags.of(awsSvc).add('ApplicationGroup','APIIM')
cdk.Tags.of(awsSvc).add('ApplicationSubGroup','APIIM')
cdk.Tags.of(awsSvc).add('Department','cm')
cdk.Tags.of(awsSvc).add('Enviornment','d')
cdk.Tags.of(awsSvc).add('Project','apiim')

//department-project-env-name


