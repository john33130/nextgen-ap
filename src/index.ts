/* eslint-disable no-console */

import chalk from 'chalk';
import figlet from 'figlet';
import pkg from './lib/pkg';
import env from './config/env';
import server from './server';
import logger from './config/logger';

console.log(chalk.cyanBright(figlet.textSync('NextGen'))); // print banner

// check for package.json version
if (!pkg.version) {
	console.log(chalk.redBright('Fatal: "version" is not defined in package.json'));
	process.exit(1);
}

process.title = 'ng-backend'; // set process title
process.env.NODE_ENV ??= 'development'; // make sure env is set
env(); // load env variables

server(); // start the server

process.on('unhandledRejection', (error: Error) => logger.error('An uncaught error occured', { error }));
