import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { products } from '../mocks/products';
import { apiResponseFormat } from '../utils/apiResponase';

export async function handler(
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
	try {
		console.log('getProductsById event:', event);
		const id = event.pathParameters?.productId;

		if (!id) {
			return apiResponseFormat(400, { message: 'Invalid id' });
		}

		const product = products.find(product => product.id === id);

		if (!product) {
			return apiResponseFormat(404, { message: 'Product not found' });
		}

		return apiResponseFormat(200, product);
	} catch (error) {
		console.error('getProductsById error:', error);
		return apiResponseFormat(500, { message: 'Internal server error' });
	}
}
