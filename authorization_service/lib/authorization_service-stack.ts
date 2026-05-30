import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { GITHUB_ACCOUNT_LOGIN } from '../src/constants';

dotenv.config();

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const password = process.env[GITHUB_ACCOUNT_LOGIN];

    if(!password) {
      throw new Error('GITHUB_ACCOUNT_LOGIN is not defined');
    }

    // The code that defines your stack goes here
    const basicAuthorizer = new NodejsFunction(this, 'BasicAuthorizer', {
      entry: path.join(__dirname, '../src/handlers/basicAuthorizer.ts'),
      runtime: Runtime.NODEJS_LATEST,
			handler: 'handler',
			environment: {
				[GITHUB_ACCOUNT_LOGIN]: password,
			},
    })

    
  }
}
