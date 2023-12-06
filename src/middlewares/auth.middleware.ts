import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, errors } from '../lib/errors';

/**
 * Validate the token
 * @param req - The request object
 * @param res - The response object
 * @param next - The next function
 */
export function validateToken(req: Request, res: Response, next: NextFunction) {
	// check if token exists
	const { token }: { token: string } = req.cookies;
	if (!token) {
		const uuid = randomUUID();
		return next(new UnauthorizedError(errors.UnauthorizedError.notLoggedIn(), { uuid }));
	}

	// verify token
	jwt.verify(token, process.env.ENCRYPTION_KEY, (error) => {
		// check if session is still valid
		if (error instanceof jwt.TokenExpiredError) {
			const uuid = randomUUID();
			return next(new UnauthorizedError(errors.UnauthorizedError.tokenExpired('login'), { uuid }));
		}

		// handle other error
		if (error instanceof jwt.JsonWebTokenError) {
			const uuid = randomUUID();
			return next(new UnauthorizedError(errors.UnauthorizedError.invalidToken(), { uuid }));
		}

		return true;
	});

	return next();
}
