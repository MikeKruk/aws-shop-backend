import { APIGatewayProxyEvent } from 'aws-lambda';

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
		ScanCommand: jest
			.fn()
			.mockImplementation(args => ({ __type: 'Scan', ...args })),
	};
});

import { handler } from '../src/handlers/getProductsList';
import { mockProduct, mockStock } from './mocks/products';

describe('getProductsList', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockSend
			.mockResolvedValueOnce({
				Items: mockProduct,
			})
			.mockResolvedValueOnce({
				Items: mockStock,
			});
	});
	test('should return 200 and list of products', async () => {
		const result = await handler({} as APIGatewayProxyEvent);

		expect(result.statusCode).toBe(200);
	});

	test('should return array with correct product structure', async () => {
		const result = await handler({} as APIGatewayProxyEvent);
		const body = JSON.parse(result.body);

		expect(body[0]).toHaveProperty('id');
		expect(body[0]).toHaveProperty('title');
		expect(body[0]).toHaveProperty('description');
		expect(body[0]).toHaveProperty('price');
		expect(body[0]).toHaveProperty('count');
	});
});