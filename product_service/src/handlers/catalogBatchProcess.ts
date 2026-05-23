import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import {
	DynamoDBDocumentClient,
	TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { SQSEvent } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { CSVProduct } from '../types/CSVproduct';
import { parseProduct } from '../utils/parseProduct';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
const sns = new SNSClient({});

export async function handler(event: SQSEvent) {
	console.log('catalogBatchProcess event:', event);
	const createdProducts: CSVProduct[] = [];

	for (const record of event.Records) {
		try {
			const product = parseProduct(record.body);
			if (!product) {
				console.error('Invalid product data:', record.body);
				continue;
			}
			const id = randomUUID();

			await ddbDocClient.send(
				new TransactWriteCommand({
					TransactItems: [
						{
							Put: {
								TableName: process.env.PRODUCTS_TABLE,
								Item: {
									id,
									title: product.title,
									description: product.description,
									price: product.price,
								},
							},
						},
						{
							Put: {
								TableName: process.env.STOCKS_TABLE,
								Item: {
									product_id: id,
									count: product.count,
								},
							},
						},
					],
				})
			);
			createdProducts.push(product);
		} catch (error) {
			console.error('Error processing record:', record, error);
		}
	}

	if (createdProducts.length > 0) {
		try {
			await sns.send(
				new PublishCommand({
					TopicArn: process.env.SNS_TOPIC_ARN,
					Message: [
						`Products successfully imported: ${createdProducts.length}`,
						'',
						...createdProducts.map(
							(product, index) =>
								`${index + 1}. Title: ${product.title}
                Description: ${product.description}
                Price: ${product.price}
                Count: ${product.count}
                `
						),
					].join('\n'),
					Subject: 'Product imported successfully',
				})
			);
		} catch (error) {
			console.error('Error sending notification:', error);
		}
	}
}
