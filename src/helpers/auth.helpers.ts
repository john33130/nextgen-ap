import { Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { UserNotFoundError, errors } from '../lib/errors';
import prisma from '../config/prisma';
import configuration from '../config/configuration';

/**
 * Set a JSON Web Token
 * @param res - The response object
 * @param userId - The user id
 */
export function setToken(res: Response, userId: string) {
	const token = jwt.sign({ userId }, process.env.ENCRYPTION_KEY!, { expiresIn: configuration.auth.expiresIn });
	res.cookie('token', token, { httpOnly: true, maxAge: configuration.auth.expiresIn });
}

/**
 * Check if credentials match
 * @param email - The email of the user
 * @param password - The password of the user
 */
export async function validateCredentials(email: string, password: string): Promise<boolean> {
	const user = await prisma.user.findUnique({ where: { email }, select: { password: true } });
	if (!user) throw new UserNotFoundError(errors.UserNotFoundError.noEmailMatch(email), { uuid: randomUUID() });
	return bcrypt.compare(password, user.password);
}
