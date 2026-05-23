import {
	CopyObjectCommand,
	DeleteObjectCommand,
	GetObjectCommand,
	S3Client,
} from '@aws-sdk/client-s3';
import {
	SendMessageCommand,
	SendMessageCommandOutput,
	SQSClient,
} from '@aws-sdk/client-sqs';
import { S3Event } from 'aws-lambda';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

const client = new S3Client({
	region: process.env.REGION,
});
const sqs = new SQSClient({});

export async function handler(event: S3Event) {
	console.log('importFileParser event:', event);

	for (const record of event.Records) {
		const bucketName = record.s3.bucket.name;
		const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

		const command = new GetObjectCommand({
			Bucket: bucketName,
			Key: key,
		});

		const response = await client.send(command);
		const stream = response.Body as Readable;
		const sqsPromises: Promise<SendMessageCommandOutput>[] = [];

		await new Promise((res, rej) => {
			stream
				.pipe(
					csvParser({
						separator: ';',
					})
				)
				.on('data', async data => {
					sqsPromises.push(
						sqs.send(
							new SendMessageCommand({
								QueueUrl: process.env.QUEUE_URL,
								MessageBody: JSON.stringify(data),
							},)
						)
					);
				})
				.on('end', async () => {
					try {
						await Promise.all(sqsPromises);

						const copyCommand = new CopyObjectCommand({
							Bucket: bucketName,
							CopySource: `${bucketName}/${key}`,
							Key: key.replace('uploaded/', 'parsed/'),
						});
						const deleteCommand = new DeleteObjectCommand({
							Bucket: bucketName,
							Key: key,
						});

						await client.send(copyCommand);
						await client.send(deleteCommand);
						console.log('File moved from uploaded/ to parsed/');
						res(null);
					} catch (error) {
						console.error('importFileParser error:', error);
						rej(error);
					}
				})
				.on('error', error => {
					console.log('CSV parse error');
					rej(error);
				});
		});
	}
}
