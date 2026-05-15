import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../src/handlers/getProductsList';
import { products } from '../src/mocks/products';

describe('getProductsList', () => {
	test('should return 200 and list of products', async () => {
		const result = await handler({} as APIGatewayProxyEvent);

		expect(result.statusCode).toBe(200);
		expect(JSON.parse(result.body)).toEqual(products);
	});

	test('should return array with correct product structure', async () => {
		const result = await handler({} as APIGatewayProxyEvent);
		const body = JSON.parse(result.body);

		expect(body[0]).toHaveProperty('id');
		expect(body[0]).toHaveProperty('title');
		expect(body[0]).toHaveProperty('description');
		expect(body[0]).toHaveProperty('price');
	});
});
