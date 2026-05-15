import { handler } from '../src/handlers/getProductsById';
import { products } from '../src/mocks/products';

const mockEvent = {
	pathParameters: {
		productId: '7119744a-547b-4e10-b84b-4deb8474c307',
	},
} as any;

describe('getProductsListById', () => {
	test('should return 200 and product when valid id is provided', async () => {
		const result = await handler(mockEvent);

		expect(result.statusCode).toBe(200);
		expect(JSON.parse(result.body)).toEqual(products[1]);
	});

	test('should return 404 when product is not found', async () => {
		const result = await handler({
			pathParameters: {
				productId: '1',
			},
		} as any);

		expect(result.statusCode).toBe(404);
		expect(JSON.parse(result.body)).toEqual({
      message: 'Product not found',
    });
	});

  test('should return 400 when id is invalid or missing', async () => {
		const result = await handler({
			pathParameters: {
				productId: null,
			},
		} as any);

		expect(result.statusCode).toBe(400);
		expect(JSON.parse(result.body)).toEqual({
      message: 'Invalid id',
    });
	});
});
