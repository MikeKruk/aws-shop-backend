import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as path from 'path';

export class ProductServiceStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		// The code that defines your stack goes here

		const productsTable = dynamodb.Table.fromTableName(
			this,
			'ProductsTable',
			'Products'
		);
		const stocksTable = dynamodb.Table.fromTableName(
			this,
			'StocksTable',
			'Stocks'
		);

		const catalogItemsQueue = new sqs.Queue(this, 'CatalogItemsQueue', {
			queueName: 'catalog-items-queue',
		});

		const createProductTopic = new sns.Topic(this, 'CreateProductTopic', {
			topicName: 'createProductTopic',
		});

		const lambdaProps = {
			runtime: Runtime.NODEJS_LATEST,
			handler: 'handler',
			environment: {
				PRODUCTS_TABLE: productsTable.tableName,
				STOCKS_TABLE: stocksTable.tableName,
			},
		};

		const getProductsList = new NodejsFunction(this, 'GetProductsList', {
			entry: path.join(__dirname, '../src/handlers/getProductsList.ts'),
			...lambdaProps,
		});

		const getProductsById = new NodejsFunction(this, 'GetProductsById', {
			entry: path.join(__dirname, '../src/handlers/getProductsById.ts'),
			...lambdaProps,
		});

		const createProduct = new NodejsFunction(this, 'CreateProduct', {
			entry: path.join(__dirname, '../src/handlers/createProduct.ts'),
			...lambdaProps,
		});

		const catalogBatchProcess = new NodejsFunction(
			this,
			'CatalogBatchProcess',
			{
				entry: path.join(__dirname, '../src/handlers/catalogBatchProcess.ts'),
				...lambdaProps,
				environment: {
					SNS_TOPIC_ARN: createProductTopic.topicArn,
					...lambdaProps.environment,
				},
			}
		);

		createProductTopic.addSubscription(
			new snsSubscriptions.EmailSubscription('mi.kruk95@gmail.com')
		);

		catalogBatchProcess.addEventSource(
			new lambdaEventSources.SqsEventSource(catalogItemsQueue, {
				batchSize: 5,
			})
		);

		const api = new apigateway.RestApi(this, 'ProductServiceApi', {
			restApiName: 'Product Service API',
			defaultCorsPreflightOptions: {
				allowOrigins: apigateway.Cors.ALL_ORIGINS,
				allowMethods: apigateway.Cors.ALL_METHODS,
			},
			deployOptions: {
				stageName: 'dev',
			},
		});

		productsTable.grantReadData(getProductsList);
		stocksTable.grantReadData(getProductsList);

		productsTable.grantReadData(getProductsById);
		stocksTable.grantReadData(getProductsById);

		productsTable.grantWriteData(createProduct);
		stocksTable.grantWriteData(createProduct);

		productsTable.grantWriteData(catalogBatchProcess);
		stocksTable.grantWriteData(catalogBatchProcess);
		createProductTopic.grantPublish(catalogBatchProcess);

		const products = api.root.addResource('products');
		products.addMethod(
			'GET',
			new apigateway.LambdaIntegration(getProductsList)
		);
		products.addMethod('POST', new apigateway.LambdaIntegration(createProduct));

		const product = products.addResource('{productId}');
		product.addMethod('GET', new apigateway.LambdaIntegration(getProductsById));

		new cdk.CfnOutput(this, 'ApiEndpoint', {
			value: api.url,
			description: 'API endpoint',
		});

		new cdk.CfnOutput(this, 'SQSQueueURL', {
			value: catalogItemsQueue.queueUrl,
			description: 'SQS Queue URL',
		});
	}
}
