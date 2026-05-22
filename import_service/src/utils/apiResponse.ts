import { APIGatewayProxyResult } from 'aws-lambda';

type ResponseBody = Record<string, unknown> | string;
export function apiResponse(statusCode: number, body: ResponseBody): APIGatewayProxyResult {
	return {
		statusCode,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Credentials': true,
			'Content-Type': 'application/json',
		},
		body: typeof body === 'string' ? body : JSON.stringify(body),
	};
}
