import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { S3Event } from 'aws-lambda';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

const client = new S3Client({
	region: process.env.REGION,
});

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

		await new Promise((res, rej) => {
			stream
				.pipe(csvParser())
				.on('data', data => console.log(data))
				.on('end', res)
				.on('error', rej);
		});
	}
}
