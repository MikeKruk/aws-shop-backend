import {
	APIGatewayAuthorizerCallback,
	APIGatewayAuthorizerResult,
	APIGatewayTokenAuthorizerEvent,
	Context,
} from 'aws-lambda';

type Effect = 'Allow' | 'Deny';

const generatePolicy = (
	principalId: string,
	effect: Effect,
	resource: string
): APIGatewayAuthorizerResult => ({
	principalId,
	policyDocument: {
		Version: '2012-10-17',
		Statement: [
			{
				Action: 'execute-api:Invoke',
				Effect: effect,
				Resource: resource,
			},
		],
	},
});

export async function handler(
	event: APIGatewayTokenAuthorizerEvent,
	_: Context,
	callback: APIGatewayAuthorizerCallback
) {
	console.log('basicAuthorizer event:', JSON.stringify(event));

	const header = event.authorizationToken;

	if (!header) {
		return callback('Unauthorized');
	}

	try {
		const [schema, token] = header.split(' ');

		if (schema !== 'Basic' || !token) {
			return callback('Unauthorized');
		}

		const decode = Buffer.from(token, 'base64').toString('utf-8');
		const [login, password] = decode.split(':');

		if (!login || !password) {
			return callback('Unauthorized');
		}

		const storedPassword = process.env[login];
		const effect: Effect = storedPassword === password ? 'Allow' : 'Deny';

		callback(null, generatePolicy(login, effect, event.methodArn));
	} catch (error) {
		callback('Unauthorized');
	}
}
