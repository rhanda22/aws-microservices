import { EventBus, Rule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { IStateMachine } from "aws-cdk-lib/aws-stepfunctions";
import { Construct } from "constructs";
import * as targets from 'aws-cdk-lib/aws-events-targets';

interface EventBusProps{
    publisher : IFunction,
    publisher2 : IFunction,
    subscriber: IFunction,
    stateMachine: IStateMachine
}

export class PocEventBus extends Construct {

    constructor(scope: Construct, id: string, props: EventBusProps){
        super(scope,id);

        const bus = new EventBus(this,'PocEventBus',{
            eventBusName: 'PocEventBus'
        });

         const productCreationRule = new Rule(this, 'ProductCreationRule',{
            eventBus : bus,
            enabled:true,
            description: 'When new product is created',
            eventPattern :{
                source: ['com.poc.product.createproduct'],
                detailType: ['ProductCreated']
            },
            ruleName: 'ProductCreationRule'
         })

         const roleCreationRule = new Rule(this, 'RoleCreationRule',{
            eventBus : bus,
            enabled:true,
            description: 'When new role is created',
            eventPattern :{
                source: ['com.poc.role.createrole'],
                detailType: ['RoleCreated']
            },
            ruleName: 'RoleCreationRule'
         })

         roleCreationRule.addTarget(new LambdaFunction(props.subscriber))
         roleCreationRule.addTarget(new targets.SfnStateMachine(props.stateMachine))

         productCreationRule.addTarget(new LambdaFunction(props.subscriber))
         productCreationRule.addTarget(new targets.SfnStateMachine(props.stateMachine))

         bus.grantPutEventsTo(props.publisher)
         bus.grantPutEventsTo(props.publisher2)

    }

    
}