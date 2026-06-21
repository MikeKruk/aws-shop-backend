import * as dotenv from 'dotenv';
import http from 'http';
import https from 'https';

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
	console.log('url', req.url);

	const [pathName, queryString] = req.url.split('?');
	const pathParts = pathName.split('/').filter(Boolean);

	const serviceName = pathParts[0];
	const servicePath = process.env[serviceName.toUpperCase()];

	console.log({ pathName, queryString, pathParts, serviceName, servicePath });

	if (!servicePath) {
		res.writeHead(502, { 'Content-Type': 'application/json' });
		return res.end(JSON.stringify({ message: 'Cannot process request' }));
	}

	const restPath = pathParts.slice(1).join('/');
	const forwardPath = `/${restPath}${queryString ? `?${queryString}` : ''}`;
	console.log('forwardPath', forwardPath);

	const targetUrl = `${servicePath}${forwardPath}`;
	console.log('targetUrl', targetUrl);

	const client = servicePath.startsWith('https') ? https : http;

	const reqBodyChunks = [];

	req.on('data', chunk => reqBodyChunks.push(chunk));

	req.on('end', () => {
		const reqBody = Buffer.concat(reqBodyChunks);

		const proxyReq = client.request(
			targetUrl,
			{ method: req.method, headers: req.headers },
			proxyRes => {
				const resBodyChunks = [];

				proxyRes.on('data', chunk => resBodyChunks.push(chunk));

				proxyRes.on('end', () => {
					const responseBody = Buffer.concat(resBodyChunks);
					res.writeHead(proxyRes.statusCode, proxyRes.headers);
					res.end(responseBody);
				});
			},
		);

		proxyReq.on('error', err => {
			console.error('Proxy error:', err);
			res.writeHead(502, { 'Content-Type': 'application/json' });
			return res.end(JSON.stringify({ message: 'Cannot process request' }));
		});

		if (reqBody.length > 0) {
			proxyReq.write(reqBody);
		}

		proxyReq.end();
	});
});

server.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
