/* eslint-disable no-console */

const { default: chalk } = require('chalk');
const { randomBytes } = require('crypto');
const fs = require('fs');

function log(...strings) {
	console.log(chalk.cyanBright('[PREINSTALL]'), ...strings);
}

if (process.env.CI) {
	log('CI detected, skipping');
	process.exit(0);
}

const env = {
	DB_CONNECTION_URL: '',
	CACHE_CONNECTION_URL: '',
	HTTP_PORT: 3000,
	HTTP_HOST: '0.0.0.0',
	BASE_URL: '',
	ENCRYPTION_KEY: randomBytes(24).toString('hex'),
	NODE_ENV: process.env.NODE_ENV || 'development',
	MAIL_USER: '',
	MAIL_PASSWORD: '',
};

if (!process.env.ENCRYPTION_KEY && !fs.existsSync('./.env')) {
	log('Generating encryption key');
	fs.writeFileSync(
		'./.env',
		Object.entries(env)
			.map(([k, v]) => `${k}=${v}`)
			.join('\n')
	);
	log('Created .env file');
	log(
		chalk.yellowBright(
			"WARNING: make sure you keep your environment variables safe, and DON'T lose your encryption key"
		)
	);
} else {
	log('Everything up-to-date');
}
