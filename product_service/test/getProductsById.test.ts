const mockSend = jest.fn();

jest.mock('@aws-sdk/client-dynamodb', () => {
	return {
		DynamoDBClient: jest.fn().mockImplementation(() => ({
			send: mockSend,
		})),
	};
});

jest.mock('@aws-sdk/lib-dynamodb', () => {
	return {
		DynamoDBDocumentClient: {
			from: jest.fn().mockReturnValue({ send: mockSend }),
		},
		GetCommand: jest
			.fn()
			.mockImplementation(args => ({ __type: 'Get', ...args })),
	};
});

import { handler } from '../src/handlers/getProductsById';
import { mockProduct, mockStock } from './mocks/products';

describe('getProductsListById', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test('should return 200 and product when valid id is provided', async () => {
		mockSend
			.mockResolvedValueOnce({
				Item: mockProduct[0],
			})
			.mockResolvedValueOnce({
				Item: mockStock[0],
			});
		const result = await handler({
			pathParameters: {
				productId: '7119744a-547b-4e10-b84b-4deb8474c307',
			},
		} as any);

		expect(result.statusCode).toBe(200);
		expect(JSON.parse(result.body)).toEqual({
			...mockProduct[0],
			count: mockStock[0].count,
		});
	});

	test('should return 404 when product is not found', async () => {
		mockSend
			.mockResolvedValueOnce({
				Item: undefined,
			})
			.mockResolvedValueOnce({
				Item: undefined,
			});
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
