import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { Runtime, Tracing } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { Datadog } from "datadog-cdk-constructs-v2";
import { join } from "path";


interface ServiceProps{
    name: string,
    path: string,
    environment: any
}

interface PocServiceProps{
    productTable : ITable,
    roleTable: ITable
}



export class Services extends Construct{

    public readonly productMicroservice: NodejsFunction;
    public readonly subscribeMicroservice: NodejsFunction;
    public readonly roleMicroservice: NodejsFunction;

    constructor(scope:Construct, id:string, props: PocServiceProps,datadog:Datadog){
        super(scope,id)
        this.productMicroservice = this.createProductFunction(props.productTable)
        this.subscribeMicroservice = this.createSubscribeFunction(props.productTable)
        this.roleMicroservice = this.createRoleFunction(props.roleTable);

        datadog.addLambdaFunctions([this.productMicroservice,this.subscribeMicroservice]);
  

    }


    private createRoleFunction(roleTable: ITable) : NodejsFunction {
      const nodeJsFunctionProps: NodejsFunctionProps = {
        bundling: {
          externalModules: [
            'aws-sdk'
          ]
        },
        environment: {
          PRIMARY_KEY: 'id',
          DYNAMODB_TABLE: roleTable.tableName
        },
        runtime: Runtime.NODEJS_14_X,
        tracing: Tracing.ACTIVE
      }
  
      // Product microservices lambda function
      const roleFunction = new NodejsFunction(this, 'roleLambdaFunction', {
        entry: join(__dirname, `/../src/role/index.js`),
        ...nodeJsFunctionProps,
      });
  
      roleTable.grantReadWriteData(roleFunction); 
      
      return roleFunction;
    }
    


    private createProductFunction(productTable: ITable) : NodejsFunction {
        const nodeJsFunctionProps: NodejsFunctionProps = {
          bundling: {
            externalModules: [
              'aws-sdk'
            ]
          },
          environment: {
            PRIMARY_KEY: 'id',
            DYNAMODB_TABLE: productTable.tableName
          },
          runtime: Runtime.NODEJS_14_X,
          tracing: Tracing.ACTIVE
        }
    
        // Product microservices lambda function
        const productFunction = new NodejsFunction(this, 'productLambdaFunction', {
          entry: join(__dirname, `/../src/product/index.js`),
          ...nodeJsFunctionProps,
        });
    
        productTable.grantReadWriteData(productFunction); 
        
        return productFunction;
      }

      private createSubscribeFunction(productTable: ITable) : NodejsFunction {
        const nodeJsFunctionProps: NodejsFunctionProps = {
          bundling: {
            externalModules: [
              'aws-sdk'
            ]
          },
          environment: {
            PRIMARY_KEY: 'id',
            DYNAMODB_TABLE: productTable.tableName
          },
          runtime: Runtime.NODEJS_14_X,
          tracing: Tracing.ACTIVE
        }
    
        // Product microservices lambda function
        const subscribeFunction = new NodejsFunction(this, 'subscribeLambdaFunction', {
          entry: join(__dirname, `/../src/subscriber/index.js`),
          ...nodeJsFunctionProps,
        });
    
        productTable.grantReadWriteData(subscribeFunction); 
        
        return subscribeFunction;
      }
    

    private createProductService(props: PocServiceProps) : NodejsFunction{
        const environment = {
            PRIMARY_KEY : 'id',
            DYNAMODB_TABLE:props.productTable.tableName
        }
        const sprops: ServiceProps = {
            name : 'productLambdaFunction',
            path:`/../src/product/index.js`,
            environment : environment
        }
       const func:NodejsFunction =  this.createFunction(sprops)
       props.productTable.grantFullAccess(func);
       return func;

    }

    private createFunction(sprops:ServiceProps):NodejsFunction{
        const nodeJSFunctionProps: NodejsFunctionProps = this.funcProps(sprops.environment);        
        const func = new NodejsFunction(this,sprops.environment,{
            entry: join(__dirname,sprops.path),
            ...nodeJSFunctionProps
          })
        return func  
    }

    private funcProps(env:any):NodejsFunctionProps{
        const nodeJSFunctionProps: NodejsFunctionProps = {
            bundling: {
              externalModules: [
                'aws-sdk'
              ]
            },
            environment:env,
            runtime: Runtime.NODEJS_16_X
            
          }
          return nodeJSFunctionProps;
    }
}