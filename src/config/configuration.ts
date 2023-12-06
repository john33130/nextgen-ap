/* eslint-disable no-console */

import fs from 'fs';
import chalk from 'chalk';
import { parse } from 'yaml';
import { ConfigOptions } from '../types';
import schema from '../schemas/config.schema';

/**
 * Return the configuration file
 */
export default ((): ConfigOptions => {
	if (!fs.existsSync('./config.yaml')) {
		if (!fs.existsSync('./example.config.yaml')) {
			console.log(chalk.redBright('No configuration file found, nor an example file to copy from'));
			process.exit(1);
		}

		fs.copyFileSync('./example.config.yaml', './config.yaml');
		console.log('Created a new configuration file');
	}

	const config = parse(fs.readFileSync('./config.yaml', { encoding: 'utf8' }));

	const result = schema.validate(config);
	if (result.error instanceof Error) {
		const { message } = result.error;
		const location = result.error.details[0].type;
		console.log(chalk.redBright(`Fatal: ${message} at "${location}" in the configuration file`));
		process.exit(1);
	}

	return config as ConfigOptions;
})();
