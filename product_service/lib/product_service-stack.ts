import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as path from 'path';

export class ProductServiceStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		// The code that defines your stack goes here

		const getProductsList = new NodejsFunction(this, 'GetProductsList', {
			runtime: Runtime.NODEJS_LATEST,
			entry: path.join(__dirname, '../src/handlers/getProductsList.ts'),
			handler: 'handler',
		});

		const getProductsById = new NodejsFunction(this, 'GetProductsById', {
			runtime: Runtime.NODEJS_LATEST,
			entry: path.join(__dirname, '../src/handlers/getProductsById.ts'),
			handler: 'handler',
		});

		const api = new apigateway.RestApi(this, 'ProductServiceApi', {
      restApiName: 'Product Service API',
			defaultCorsPreflightOptions: {
				allowOrigins: apigateway.Cors.ALL_ORIGINS,
				allowMethods: apigateway.Cors.ALL_METHODS,
			},
      deployOptions: {
        stageName: 'dev'
      }
		});

		const products = api.root.addResource('products');
		products.addMethod(
			'GET',
			new apigateway.LambdaIntegration(getProductsList)
		);

		const product = products.addResource('{productId}');
		product.addMethod('GET', new apigateway.LambdaIntegration(getProductsById));

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API endpoint'
    })
	}
}
