import { APIGatewayProxyResult } from 'aws-lambda';

type ResponseBody = Record<string, unknown> | Array<unknown>;

export function apiResponseFormat(
	statusCode: number,
	body: ResponseBody
): APIGatewayProxyResult {
	{
		return {
			statusCode,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Credentials': true,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		};
	}
}
