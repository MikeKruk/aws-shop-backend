import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
	DynamoDBDocumentClient,
	TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { apiResponseFormat } from '../utils/apiResponase';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export async function handler(
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
	console.log('createProduct event:', event);
	try {
		const body =
			typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

		const { title, description, price, count } = body;

		if (
			!title ||
			!description ||
			typeof count !== 'number' ||
			typeof price !== 'number'
		) {
			return apiResponseFormat(400, { message: 'Missing required fields' });
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
								title,
								description,
								price,
							},
						},
					},
					{
						Put: {
							TableName: process.env.STOCKS_TABLE,
							Item: {
								product_id: id,
								count: count,
							},
						},
					},
				],
			})
		);

		return apiResponseFormat(201, { id, title, description, price, count });
	} catch (error) {
		console.error('getProductsById error:', error);
		return apiResponseFormat(500, { message: 'Internal server error' });
	}
}
