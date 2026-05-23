import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as path from 'path';

export class ImportServiceStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		// The code that defines your stack goes here
		const bucket = s3.Bucket.fromBucketName(
			this,
			'import-service-bucket',
			'nodejs-aws-shop-react-import-mikemo'
		);

		const catalogItemsQueue = sqs.Queue.fromQueueArn(
			this,
			'CatalogItemsQueue',
			`arn:aws:sqs:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:catalog-items-queue`
		);

		const lambdaProps = {
			runtime: Runtime.NODEJS_LATEST,
			handler: 'handler',
			environment: {
				REGION: cdk.Stack.of(this).region,
				BUCKET_NAME: bucket.bucketName,
			},
		};

		const importProductsFile = new NodejsFunction(this, 'importProductsFile', {
			entry: path.join(__dirname, '../src/handlers/importProductsFile.ts'),
			...lambdaProps,
		});

		const importFileParser = new NodejsFunction(this, 'importFileParser', {
			entry: path.join(__dirname, '../src/handlers/importFileParser.ts'),
			...lambdaProps,
			environment: {
				QUEUE_URL: catalogItemsQueue.queueUrl,
				...lambdaProps.environment,
			},
		});

		bucket.grantReadWrite(importProductsFile);
		bucket.grantReadWrite(importFileParser);
		catalogItemsQueue.grantSendMessages(importFileParser);

		const api = new apigateway.RestApi(this, 'ImportServiceApi', {
			restApiName: 'Import Service API',
			defaultCorsPreflightOptions: {
				allowOrigins: apigateway.Cors.ALL_ORIGINS,
				allowMethods: apigateway.Cors.ALL_METHODS,
			},
			deployOptions: {
				stageName: 'dev',
			},
		});

		const importResource = api.root.addResource('import');
		importResource.addMethod(
			'GET',
			new apigateway.LambdaIntegration(importProductsFile)
		);

		new cdk.CfnOutput(this, 'ApiEndpoint', {
			value: api.url,
			description: 'API endpoint',
		});
	}
}
