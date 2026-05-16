import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SIGNED_URL_EXPIRES_IN } from '../constants';
import { apiResponse } from '../utils/apiResponse';

const client = new S3Client({
	region: process.env.REGION,
});

export async function handler(
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
	console.log('importProductsFile event:', event);
	try {
		const fileName = event.queryStringParameters?.name;

		if (!fileName?.trim()) {
			return apiResponse(400, {
				message: 'Missing fileName parameter',
			});
		}

		const bucketName = process.env.BUCKET_NAME;
		const key = `uploaded/${fileName}`;

		const command = new PutObjectCommand({
			Bucket: bucketName,
			Key: key,
			ContentType: 'text/csv',
		});

		const signedUrl = await getSignedUrl(client, command, {
			expiresIn: SIGNED_URL_EXPIRES_IN,
		});

		return apiResponse(200, signedUrl);
	} catch (error) {
		console.error('importProductsFile error:', error);
		return apiResponse(500, { error: 'Internal server error' });
	}
}
