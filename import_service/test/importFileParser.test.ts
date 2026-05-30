import { Readable } from 'stream';

const mockS3Send = jest.fn();
const mockSQSSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => {
	return {
		S3Client: jest.fn().mockImplementation(() => ({ send: mockS3Send })),
		CopyObjectCommand: jest
			.fn()
			.mockImplementation(args => ({ __type: 'Copy', ...args })),
		GetObjectCommand: jest
			.fn()
			.mockImplementation(args => ({ __type: 'Get', ...args })),
		DeleteObjectCommand: jest
			.fn()
			.mockImplementation(args => ({ __type: 'Delete', ...args })),
	};
});

jest.mock('@aws-sdk/client-sqs', () => {
	return {
		SQSClient: jest.fn().mockImplementation(() => ({ send: mockSQSSend })),
		SendMessageCommand: jest
			.fn()
			.mockImplementation(args => ({ __type: 'SendMessage', ...args })),
	};
});

import { S3Event } from 'aws-lambda';
import { handler } from '../src/handlers/importFileParser';

const mockEvent = {
	Records: [
		{
			s3: {
				bucket: {
					name: 'test-bucket',
				},
				object: {
					key: 'uploaded/name.csv',
				},
			},
		},
	],
} as unknown as S3Event;

describe('importFileParser ', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		process.env.REGION = 'us-east-1';
		process.env.BUCKET_NAME = 'test-bucket';
		process.env.QUEUE_URL = 'test-queue-url';
    mockSQSSend.mockResolvedValue({});
	});

	test('should send each CSV record to SQS', async () => {
		const stream = new Readable({
			read() {
				this.push('title;price\n');
				this.push('AK-47;15\n');
				this.push(null);
			},
		});

		mockS3Send.mockResolvedValue({
			Body: stream,
		});

		await handler(mockEvent);

		expect(mockSQSSend).toHaveBeenCalledTimes(1);
		expect(mockSQSSend).toHaveBeenCalledWith(
			expect.objectContaining({
				__type: 'SendMessage',
				MessageBody: JSON.stringify({ title: 'AK-47', price: '15' }),
			})
		);
	});

	test('should copy and delete file after parsing', async () => {
		const stream = new Readable({
			read() {
				this.push('title;price\n');
				this.push('AK-47;15\n');
				this.push(null);
			},
		});

		mockS3Send
			.mockResolvedValueOnce({
				Body: stream,
			})
			.mockResolvedValueOnce({})
			.mockResolvedValueOnce({});
		await handler(mockEvent);

		expect(mockS3Send).toHaveBeenCalledTimes(3);
	});
});
