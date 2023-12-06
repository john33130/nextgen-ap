import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { ApplicationError } from '../types';
import logger from '../config/logger';
import { InvalidParameterError } from '../lib/errors';

/**
 * Handle errors in our application
 * @param error - The error
 * @param req - The request object
 * @param res - The response object
 * @param next - The next function
 */
export default (error: ApplicationError, req: Request, res: Response, next: NextFunction) => {
	// handle invalid json errors
	if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
		error = new InvalidParameterError(error.message, { uuid: randomUUID() });
	}

	// log and store data
	logger.error(error.message, {
		...error.data,
		error,
		status: error.status,
		route: req.url,
	});

	// let the user know what the problem is
	res.status(error.status).json({
		error: true,
		uuid: error.data.uuid,
		status: error.status,
		type: error.name,
		message: error.message,
	});

	next();
};
