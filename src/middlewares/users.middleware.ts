import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import {
	ForbiddenError,
	InvalidParameterError,
	UnauthorizedError,
	UnexpectedError,
	UserNotFoundError,
	errors,
} from '../lib/errors';
import { validateUserId } from '../schemas/users.schema';

/**
 * Validate if token has permissions to access the user
 * @param req - The request object
 * @param res - The response object
 * @param next - The next function
 */
export async function checkAccessToUser(req: Request, res: Response, next: NextFunction) {
	// validate user id
	const preValidationUserId = req.params.userId;
	const valid = validateUserId(preValidationUserId);
	if (valid instanceof Error) {
		const uuid = randomUUID();
		return next(new InvalidParameterError(valid.message, { uuid }));
	}

	// change type
	const { userId } = req.params as { userId: string };

	// check if token has same user id
	const token = jwt.decode(req.cookies.token) as jwt.JwtPayload & { userId: string };
	if (userId !== token.userId) {
		const uuid = randomUUID();
		return next(new ForbiddenError(errors.ForbiddenError.noPermissionToUser(), { uuid }));
	}

	let user: { activated: boolean } | null;

	try {
		user = await prisma.user.findUnique({ where: { userId }, select: { activated: true } });
	} catch (error) {
		const uuid = randomUUID();
		const message = errors.UnexpectedError.noDatabaseConnection();
		return next(new UnexpectedError(message, { uuid, error }));
	}

	// check if user exists
	if (!user) {
		const uuid = randomUUID();
		return next(new UserNotFoundError(errors.UserNotFoundError.noUserIdMatch(userId), { uuid }));
	}

	// check if user is verified
	if (!user.activated) {
		const uuid = randomUUID();
		return next(new UnauthorizedError(errors.UnauthorizedError.accountNotActivated(), { uuid }));
	}

	return next();
}
