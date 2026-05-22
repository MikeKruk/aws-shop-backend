import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { apiResponseFormat } from '../utils/apiResponase';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export async function handler(
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
	try {
		console.log('getProductsById event:', event);
		const id = event.pathParameters?.productId;

		if (!id) {
			return apiResponseFormat(400, { message: 'Invalid id' });
		}

		const [productResult, stockResult] = await Promise.all([
			ddbDocClient.send(
				new GetCommand({
					TableName: process.env.PRODUCTS_TABLE,
					Key: {
						id: id,
					},
				})
			),
			ddbDocClient.send(
				new GetCommand({
					TableName: process.env.STOCKS_TABLE,
					Key: {
						product_id: id,
					},
				})
			),
		]);

		if (!productResult.Item) {
			return apiResponseFormat(404, { message: 'Product not found' });
		}

		const product = {
			...productResult.Item,
			count: stockResult.Item ? stockResult.Item.count : 0,
		};

		return apiResponseFormat(200, product);
	} catch (error) {
		console.error('getProductsById error:', error);
		return apiResponseFormat(500, { message: 'Internal server error' });
	}
}
