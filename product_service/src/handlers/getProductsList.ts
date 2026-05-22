import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { apiResponseFormat } from '../utils/apiResponase';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export async function handler(
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
	try {
		const [productsResult, stocksResult] = await Promise.all([
			ddbDocClient.send(
				new ScanCommand({
					TableName: process.env.PRODUCTS_TABLE,
				})
			),
			ddbDocClient.send(
				new ScanCommand({
					TableName: process.env.STOCKS_TABLE,
				})
			),
		]);

		const joinedProducts = (productsResult.Items || []).map(product => {
			const stock = (stocksResult.Items || []).find(
				stock => stock.product_id === product.id
			);

			return {
				...product,
				count: stock ? stock.count : 0,
			};
		});
		console.log('getProductsList event:', event);
		return apiResponseFormat(200, joinedProducts);
	} catch (error) {
		console.error('getProductsList error:', error);
		return apiResponseFormat(500, { error: 'Internal server error' });
	}
}
