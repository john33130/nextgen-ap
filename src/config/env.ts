/* eslint-disable no-console */

import { parse } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import chalk from 'chalk';
import schema from '../schemas/env.schema';

/**
 * Configure the environment variables
 */
export default () => {
	if (!existsSync('./.env')) {
		console.log(chalk.redBright('Error: no .env file found, please run the prestart-script'));
		process.exit(1);
	}

	const env = parse(readFileSync('./.env', { encoding: 'utf8' }));

	const result = schema.validate(env);
	if (result.error instanceof Error) {
		console.log(chalk.redBright(`Error: the environment variable ${result.error.message}`));
		process.exit(1);
	}

	Object.entries(env).forEach(([k, v]) => (process.env[k] = v));
};
