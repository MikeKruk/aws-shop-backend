import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const products = [
	{
		id: '5156c8f1-f30f-494d-b093-943c7b2c77f8',
		title: 'AK-47 | Redline',
		description: 'A popular AK-47 skin featuring red lines',
		price: 15,
	},
	{
		id: '7119744a-547b-4e10-b84b-4deb8474c307',
		title: 'AWP | Dragon Lore',
		description: 'A legendary skin for a sniper rifle',
		price: 1500,
	},
	{
		id: '6fcf2d3d-97ac-4c8b-9cb6-29a42c80d1b7',
		title: 'Logitech G Pro X Superlight',
		description: 'Professional gaming mouse for CS2',
		price: 159,
	},
	{
		id: '204abb8b-d0ce-4426-8e2e-eb7bfa0ab5a4',
		title: 'HyperX Alloy FPS Pro',
		description: 'Mechanical keyboard for esports',
		price: 89,
	},
	{
		id: 'cdf0e0ce-620e-44a3-89f8-c56b66b84106',
		title: 'SteelSeries QcK Heavy',
		description: 'Professional gaming mat',
		price: 49,
	},
];

const stocks = [
	{ product_id: '5156c8f1-f30f-494d-b093-943c7b2c77f8', count: 2 },
	{ product_id: '7119744a-547b-4e10-b84b-4deb8474c307', count: 2 },
	{ product_id: '6fcf2d3d-97ac-4c8b-9cb6-29a42c80d1b7', count: 2 },
	{ product_id: '204abb8b-d0ce-4426-8e2e-eb7bfa0ab5a4', count: 2 },
	{ product_id: 'cdf0e0ce-620e-44a3-89f8-c56b66b84106', count: 2 },
];

async function fillTables() {
	try {
		for (const product of products) {
			await ddbDocClient.send(
				new PutCommand({
					TableName: 'Products',
					Item: product,
				})
			);
		}

		for (const stack of stocks) {
			await ddbDocClient.send(
				new PutCommand({
					TableName: 'Stocks',
					Item: stack,
				})
			);
		}
	} catch (error) {
		console.error('Error filling tables:', error);
	}
}

fillTables();
