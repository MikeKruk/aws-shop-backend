import * as dotenv from 'dotenv';
import http from 'http';
import https from 'https';

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

	const [pathName, queryString] = req.url.split('?');
	const pathParts = pathName.split('/').filter(Boolean);

	const serviceName = pathParts[0];
	const servicePath = process.env[serviceName.toUpperCase()];


	if (!servicePath) {
		res.writeHead(502, { 'Content-Type': 'application/json' });
		return res.end(JSON.stringify({ message: 'Cannot process request' }));
	}

	const restPath = pathParts.slice(1).join('/');
	const forwardPath = `/${restPath}${queryString ? `?${queryString}` : ''}`;

	const targetUrl = `${servicePath}${forwardPath}`;

	const proxyHeaders = { ...req.headers };
	delete proxyHeaders.host;

	const client = servicePath.startsWith('https') ? https : http;

	const reqBodyChunks = [];

	req.on('data', chunk => reqBodyChunks.push(chunk));

	req.on('end', () => {
		const reqBody = Buffer.concat(reqBodyChunks);

		const proxyReq = client.request(
			targetUrl,
			{ method: req.method, headers: proxyHeaders },
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
