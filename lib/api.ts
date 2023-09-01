import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

interface ApiProps{
    productService: IFunction,
    roleService:IFunction
}

export class Api extends Construct{

    constructor(scope:Construct, id: string, props: ApiProps){
        super(scope,id)
        this.createProductApi(props)
        this.createRoleApi(props);

    }

    private createRoleApi(props:ApiProps) : LambdaRestApi{

        const apigw = new LambdaRestApi(this,'roleApi',{
            restApiName : 'Role Service',
            handler: props.roleService,
            proxy: false,
            deployOptions:{
                dataTraceEnabled:true,
                tracingEnabled:true
            }
          })
      
          const role = apigw.root.addResource('role');
          role.addMethod('GET');
          role.addMethod('POST');
      
          const singleRole = role.addResource('{id}')
          singleRole.addMethod('GET');
          singleRole.addMethod('PUT');
          singleRole.addMethod('DELETE');
        
        return apigw;
    }

    private createProductApi(props:ApiProps) : LambdaRestApi{

        const apigw = new LambdaRestApi(this,'productApi',{
            restApiName : 'Product Service',
            handler: props.productService,
            proxy: false,
            deployOptions:{
                dataTraceEnabled:true,
                tracingEnabled:true
            }
          })
      
          const product = apigw.root.addResource('product');
          product.addMethod('GET');
          product.addMethod('POST');
      
          const singleProduct = product.addResource('{id}')
          singleProduct.addMethod('GET');
          singleProduct.addMethod('PUT');
          singleProduct.addMethod('DELETE');
        
        return apigw;
    }
}