import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
	DynamoDBDocumentClient,
	TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { SQSEvent } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { parseProduct } from '../utils/parseProduct';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export async function handler(event: SQSEvent) {
	console.log('catalogBatchProcess event:', event);

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
		} catch (error) {
			console.error('Error processing record:', record, error);
		}
	}
}
