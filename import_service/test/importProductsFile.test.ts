import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../src/handlers/importProductsFile';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

jest.mock('@aws-sdk/client-s3', () => {
	return {
		S3Client: jest.fn().mockImplementation(() => {
			return {
				send: jest.fn(),
			};
		}),
		PutObjectCommand: jest.fn(),
	};
});

jest.mock('@aws-sdk/s3-request-presigner', () => {
	return {
		getSignedUrl: jest.fn().mockResolvedValue('https://signed-url'),
	};
});

describe('importProductsFile ', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		process.env.REGION = 'us-east-1';
		process.env.BUCKET_NAME = 'test-bucket';
	});

	test('should return 200 and signed url when name is provided', async () => {
		const event = {
			queryStringParameters: {
				name: 'name.csv',
			},
		} as Partial<APIGatewayProxyEvent> as APIGatewayProxyEvent;

		const result = await handler(event);

		expect(result.statusCode).toBe(200);
		expect(result.body).toBe('https://signed-url');
		expect(getSignedUrl).toHaveBeenCalledTimes(1);
	});

  test('should return 400 and error message when name is missing', async () => {
		const event = {
			queryStringParameters: null,
		} as Partial<APIGatewayProxyEvent> as APIGatewayProxyEvent;

		const result = await handler(event);

		expect(result.statusCode).toBe(400);
		expect(JSON.parse(result.body).message).toBe('Missing fileName parameter');
    expect(getSignedUrl).not.toHaveBeenCalled();
	});
});
