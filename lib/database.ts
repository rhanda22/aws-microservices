import { RemovalPolicy } from "aws-cdk-lib";
import { AttributeType, BillingMode, ITable, Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class PocDatabase extends Construct{

    public readonly productTable: ITable;
    public readonly roleTable:ITable;


    constructor(scope: Construct, id: string){
        super(scope,id)
        this.productTable = this.createProductTable()
        this.roleTable = this.createRoleTable()
        

    }

    private createRoleTable() : ITable{
      return this.createTable('role','id')
}

    private createProductTable() : ITable{
            return this.createTable('product','id')
    }

    private createTable(name:string, id:string, sortKey?:string) : ITable{
        const table  = new Table(this,name,{
            partitionKey: {
              name:id,
              type: AttributeType.STRING
            },
            tableName: name,
            removalPolicy: RemovalPolicy.DESTROY,
            billingMode: BillingMode.PAY_PER_REQUEST
          })

          return table;
    }

}