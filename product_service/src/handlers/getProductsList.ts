import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { products } from '../mocks/products';
import { apiResponseFormat } from '../utils/apiResponase';

export async function handler(
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
	try {
		console.log('getProductsList event:', event);
		return apiResponseFormat(200, products);
	} catch (error) {
		console.error('getProductsList error:', error);
		return apiResponseFormat(500, { error: 'Internal server error' });
	}
}
