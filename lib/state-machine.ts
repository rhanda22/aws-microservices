import { AttributeType, BillingMode, ITable, Table } from "aws-cdk-lib/aws-dynamodb";
import { Code, Runtime, Tracing } from "aws-cdk-lib/aws-lambda";
import { Bucket, BucketEncryption } from "aws-cdk-lib/aws-s3";
import { JsonPath, StateMachine } from "aws-cdk-lib/aws-stepfunctions";
import { Construct } from "constructs";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import { NodejsFunction, NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";
import { join } from "path";
import { Lambda } from "aws-cdk-lib/aws-ses-actions";
import * as lambda from "aws-cdk-lib/aws-lambda";

interface StateMachineTargetProps {
    logicalEnv: string;
    accountId: string;
  }
  
  export class StateMachineTarget extends Construct {
    
    public readonly stateMachine: StateMachine;
    public readonly bucket: Bucket;
    public readonly table: Table;
  
    constructor(scope: Construct, id: string, props: StateMachineTargetProps) {
      super(scope, id);
  
      const prefix = props.logicalEnv;
      
      // s3 bucket
      this.bucket = new Bucket(this, 'AuditEventsRaw', {
        bucketName: `${prefix}-audit-events-new`,
        encryption: BucketEncryption.KMS_MANAGED,
        
      });


  
      // lambda function
      const saveToS3Fn = new lambda.Function(this, 'SaveToS3Fn', {
        functionName: `${prefix}-save-to-s3`,
        runtime: Runtime.NODEJS_16_X,
        handler: 'index.handler',
        code: Code.fromAsset('./src/audit'),
        environment: {
          BUCKET_NAME: this.bucket.bucketName
        },
        tracing: Tracing.ACTIVE
      });
  
      this.bucket.grantWrite(saveToS3Fn);
  
      // dynamodb table
      this.table = new Table(this, 'AuditEventTable', {
        tableName: `${prefix}-audit-events`,
        partitionKey: {name: 'EventId', type: AttributeType.STRING},      	
        billingMode: BillingMode.PAY_PER_REQUEST
      });	
  
      this.table.addGlobalSecondaryIndex({	
        indexName: 'search-by-entity-id',	
        partitionKey: {name: 'EntityId', type: AttributeType.STRING},	
        sortKey: {name: 'Ts', type: AttributeType.NUMBER}	
      });	
  
      this.table.addGlobalSecondaryIndex({	
        indexName: 'search-by-author',	
        partitionKey: {name: 'Author', type: AttributeType.STRING},	
        sortKey: {name: 'Ts', type: AttributeType.NUMBER}	
      });
  
      // state machine
      const saveToS3Job = new tasks.LambdaInvoke(this, 'SaveToS3', {
        lambdaFunction: saveToS3Fn,
        
        payloadResponseOnly: true,
        resultPath: '$.detail.s3Key'
      });
  
      const saveToDbJob = new tasks.DynamoPutItem(this, 'SaveToDb', {
        item: {
          EventId: tasks.DynamoAttributeValue.fromString(JsonPath.stringAt('$.id')),
          EntityType: tasks.DynamoAttributeValue.fromString(JsonPath.stringAt('$.detail[\'entity-type\']')),
          EntityId: tasks.DynamoAttributeValue.fromString(JsonPath.stringAt('$.detail[\'entity-id\']')),
          Operation: tasks.DynamoAttributeValue.fromString(JsonPath.stringAt('$.detail.operation')),
          S3Key: tasks.DynamoAttributeValue.fromString(JsonPath.stringAt('$.detail.s3Key')),
          Author: tasks.DynamoAttributeValue.fromString(JsonPath.stringAt('$.detail.author')),
          Ts: tasks.DynamoAttributeValue.numberFromString(JsonPath.stringAt('$.detail.ts'))
        },
        table: this.table
      });
  
      const definition = saveToS3Job.next(saveToDbJob);
  
      this.stateMachine = new StateMachine(this, 'LogAuditEvent', {
        definition,
        stateMachineName: `${prefix}-log-audit-event`
      });
    }
}
