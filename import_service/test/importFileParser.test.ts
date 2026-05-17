import { S3Client } from '@aws-sdk/client-s3';
import { S3Event } from 'aws-lambda';
import { Readable } from 'stream';
import { handler } from '../src/handlers/importFileParser';

jest.mock('@aws-sdk/client-s3', () => {
	return {
		S3Client: jest.fn(),
		CopyObjectCommand: jest.fn(),
		GetObjectCommand: jest.fn(),
		DeleteObjectCommand: jest.fn(),
	};
});

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
	let mockSend: jest.Mock;
	beforeEach(() => {
		jest.clearAllMocks();
		process.env.REGION = 'us-east-1';
		process.env.BUCKET_NAME = 'test-bucket';

		const stream = new Readable({
			read() {
				this.push('title;price\n');
				this.push('AK-47;15\n');
				this.push(null);
			},
		});

		mockSend = jest.fn().mockResolvedValue({ Body: stream });
		(S3Client as jest.Mock).mockImplementation(() => {
			return {
				send: mockSend,
			};
		});
	});

	test('should parse CSV and log each record', async () => {
		const consoleSpy = jest.spyOn(console, 'log');

		await handler(mockEvent);

		expect(consoleSpy).toHaveBeenCalledWith('CSV row', {
			title: 'AK-47',
			price: '15',
		});
	});

	test('should copy and delete file after parsing', async () => {
		await handler(mockEvent);

		expect(mockSend).toHaveBeenCalledTimes(3);
	});
});
