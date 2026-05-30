const mockDDBSend = jest.fn();
const mockSNSSend = jest.fn();

jest.mock('@aws-sdk/client-dynamodb', () => {
	return {
		DynamoDBClient: jest.fn().mockImplementation(() => ({
			send: mockDDBSend,
		})),
	};
});

jest.mock('@aws-sdk/lib-dynamodb', () => {
	return {
		DynamoDBDocumentClient: {
			from: jest.fn().mockReturnValue({ send: mockDDBSend }),
		},
		TransactWriteCommand: jest
			.fn()
			.mockImplementation(args => ({ __type: 'Transact', ...args })),
	};
});

jest.mock('@aws-sdk/client-sns', () => {
	return {
		SNSClient: jest.fn().mockImplementation(() => ({
			send: mockSNSSend,
		})),
		PublishCommand: jest
			.fn()
			.mockImplementation(args => ({ __type: 'Publish', ...args })),
	};
});

import { SQSEvent } from 'aws-lambda';
import { handler } from '../src/handlers/catalogBatchProcess';

const callHandlerWithValidRecord = async () => {
	await handler({
		Records: [
			{
				body: '{"id": "7119744a-547b-4e10-b84b-4deb8474c307", "title": "Product 1", "description": "Description 1", "price": 10, "count": 10}',
			},
		],
	} as SQSEvent);
};

const callHandlerWithInvalidRecord = async () => {
	await handler({
		Records: [
			{
				body: '{"id": "7119744a-547b-4e10-b84b-4deb8474c307", "description": "Description 1", "price": 10, "count": 10}',
			},
		],
	} as SQSEvent);
};

describe('catalogBatchProcess', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockDDBSend.mockResolvedValue({});
	});

	test('should create products in DynamoDB for valid records', async () => {
		await callHandlerWithValidRecord();

		expect(mockDDBSend).toHaveBeenCalledTimes(1);
	});

	test('should skip invalid records and not call DynamoDB', async () => {
		await callHandlerWithInvalidRecord();

		expect(mockDDBSend).not.toHaveBeenCalled();
	});

	test('should send SNS notification after creating products', async () => {
		await callHandlerWithValidRecord();

		expect(mockSNSSend).toHaveBeenCalledTimes(1);
	});

	test('should not send SNS notification if no products were created', async () => {
		await callHandlerWithInvalidRecord()

		expect(mockSNSSend).not.toHaveBeenCalled();
	});

  test('should continue processing records if one fails in DynamoDB', async () => {
    mockDDBSend.mockRejectedValueOnce(new Error('DynamoDB error')).mockResolvedValueOnce({});
    await handler({
      Records: [
        {
          body: '{"id": "7119744a-547b-4e10-b84b-4deb8474c307", "title": "Product 1", "description": "Description 1", "price": 10, "count": 10}',
        },
        {
          body: '{"id": "7119744a-547b-4e10-b84b-4deb8474c398", "title": "Product 2", "description": "Description 2", "price": 1, "count": 2}',
        },
      ],
    } as SQSEvent);

		expect(mockDDBSend).toHaveBeenCalledTimes(2);
	});
});
