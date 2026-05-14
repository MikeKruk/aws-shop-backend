import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { products } from '../mocks/products';

export async function handler(
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
	try {
		console.log('getProductsById event:', event);
		const id = event.pathParameters?.productId;

		if (!id) {
			return {
				statusCode: 400,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Credentials': true,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ message: 'Invalid id' }),
			};
		}

		const product = products.find(product => product.id === id);

		if (!product) {
			return {
				statusCode: 404,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Credentials': true,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ message: 'Product not found' }),
			};
		}

		return {
			statusCode: 200,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Credentials': true,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(product),
		};
	} catch (error) {
		console.error('getProductsById error:', error);
		return {
			statusCode: 500,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Credentials': true,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ message: 'Internal server error' }),
		};
	}
}
