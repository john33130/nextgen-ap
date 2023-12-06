import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import http from 'http';
import { readdirSync } from 'fs';
import { CronJob } from 'cron';
import dayjs from 'dayjs';
import prisma from './config/prisma';
import configuration from './config/configuration';
import { path } from './lib/fs';
import pkg from './lib/pkg';

import logger from './config/logger';
import errorMiddleware from './middlewares/error.middleware';

const app = express();

export default () => {
	// logging requests
	app.use(
		morgan(':method :url :status :res[content-length] - :response-time ms', {
			stream: { write: (info) => logger.http(info) },
		})
	);

	app.use(compression()); // compress data
	app.use(express.json()); // parsing json
	app.use(cookieParser()); // store and read cookies
	app.use(cors()); // set cors rules

	// set ratelimiting
	app.use(
		rateLimit({
			windowMs: configuration.rateLimit.interval,
			limit: configuration.rateLimit.tokens,
			standardHeaders: 'draft-7',
			legacyHeaders: false,
		})
	);

	// import routes
	readdirSync(path('./routes'))
		.filter((file) => file.endsWith('.ts') || file.endsWith('.js'))
		.forEach(async (filename) => {
			const route = `/api/${filename.split('.')[0]}`;
			app.use(route, (await import(`./routes/${filename}`)).default, errorMiddleware);
		});

	// set root route
	app.get('/', async (req, res) =>
		res.status(200).json({
			api: {
				host: req.get('host'),
				environment: process.env.NODE_ENV!,
				build: `v${pkg.version!}`,
				uptime: Math.floor(process.uptime()),
			},
			about: {
				description:
					'This REST API is used to authenticate users and get information for the frontend',
			},
			resources: ['/auth', '/users', '/devices'],
		})
	);

	app.set('json spaces', 2); // make json text formatted

	// start cron job to delete users
	new CronJob(
		'0 0 * * *',
		async () => {
			(
				await prisma.user.findMany({
					where: { deactivated: { equals: true } },
					select: { userId: true, deactivationDate: true },
				})
			).forEach(async (user) => {
				// calculate if user should be deleted
				const targetDate = dayjs(user.deactivationDate);
				const lastWeekDate = dayjs().subtract(30, 'days');
				if (targetDate.isBefore(lastWeekDate) || targetDate.isSame(lastWeekDate)) {
					await prisma.user.delete({ where: user });
					logger.info('Deleted a user from the database', { userId: user.userId });
				}
			});
		},
		null
	).start();

	const server = http.createServer(app);

	// start server
	server.listen(process.env.HTTP_PORT as unknown as number, process.env.HTTP_HOST, () =>
		logger.info(`Server running on port ${process.env.HTTP_PORT}`)
	);
};
