import { NextFunction, Response, Request } from 'express';
import { randomBytes, randomUUID } from 'crypto';
import ms from 'ms';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { setToken, validateCredentials } from '../helpers/auth.helpers';
import { addDevicesToUserBody, removeSensitiveDataFromUser } from '../helpers/users.helpers';
import { validateActivateToken, validateLoginBody, validateSignupBody } from '../schemas/auth.schemas';
import {
	AlreadyLoggedInError,
	EmailAlreadyExistsError,
	InvalidParameterError,
	UnauthorizedError,
	UnexpectedError,
	UserNotFoundError,
	errors,
} from '../lib/errors';
import { AuthLoginBody, AuthSignupBody, TemporaryUser } from '../types';
import prisma from '../config/prisma';
import keyv from '../config/keyv';
import nodemailer from '../config/nodemailer';

export default {
	signup: {
		post: async (req: Request, res: Response, next: NextFunction) => {
			// check if user is already logged in
			const decodedToken = jwt.decode(req.cookies.token) as jwt.JwtPayload & { userId: string };
			if (req.cookies.token && decodedToken.exp && decodedToken.exp > Math.floor(Date.now() / 1000)) {
				const uuid = randomUUID();
				return next(new AlreadyLoggedInError({ uuid }));
			}

			// validate body
			const preValidationBody: AuthSignupBody<false> = req.body;
			const valid = validateSignupBody(preValidationBody);
			if (valid instanceof Error) {
				const uuid = randomUUID();
				return next(new InvalidParameterError(valid.message, { uuid }));
			}

			// change type
			const { body }: { body: AuthSignupBody<true> } = req;

			let user: User | null;

			// check if user already exists
			try {
				user = await prisma.user.findUnique({ where: { email: body.email } });
			} catch (error) {
				const uuid = randomUUID();
				const message = errors.UnexpectedError.noDatabaseConnection();
				return next(new UnexpectedError(message, { uuid, error }));
			}

			if (user || (await keyv.has(`verify-emails/${body.email}`))) {
				const uuid = randomUUID();
				return next(new EmailAlreadyExistsError({ uuid }));
			}

			const userId = randomBytes(4).toString('hex'); // generate userId

			// save user as temporary user
			const temporaryUser: TemporaryUser = {
				...body,
				userId,
				password: await bcrypt.hash(body.password, await bcrypt.genSalt()),
			};

			await keyv.set(`cache/temp-user:${userId}`, temporaryUser, ms('10m'));

			setToken(res, userId); // set jwt

			// create verification token
			const verificationToken = jwt.sign({ userId, email: body.email }, process.env.ENCRYPTION_KEY, {
				expiresIn: ms('10m') / 1000,
			});
			const verificationUrl = `${process.env.BASE_URL}/auth/activate?token=${verificationToken}`; // put together verification url
			// send mail
			await nodemailer.sendMail({
				from: 'NextGen 🌊 <no.reply.nextgendevs@gmail.com>',
				to: [body.email],
				subject: 'Activate your account',
				html: `Please verify your account by clicking on the link <a href="${verificationUrl}">here</a>.`,
			});
			await keyv.set(`verify-emails/${body.email}`, true, ms('10m')); // make sure we keep track of if we send the email
			res.status(200).json({ message: 'Check your inbox for a verification email' });

			return true;
		},
	},

	login: {
		post: async (req: Request, res: Response, next: NextFunction) => {
			// check if user is already logged in
			const decodedToken = jwt.decode(req.cookies.token) as jwt.JwtPayload & { userId: string };
			if (req.cookies.token && decodedToken.exp && decodedToken.exp > Math.floor(Date.now() / 1000)) {
				const uuid = randomUUID();
				return next(new AlreadyLoggedInError({ uuid }));
			}

			// validate body
			const preValidationBody: AuthLoginBody<false> = req.body;
			const valid = validateLoginBody(preValidationBody);
			if (valid instanceof Error) {
				const uuid = randomUUID();
				return next(new InvalidParameterError(valid.message, { uuid }));
			}

			// change type
			const { body }: { body: AuthLoginBody<true> } = req;

			let user: User | null;

			// check if user exists
			try {
				user = await prisma.user.findUnique({ where: { email: body.email } });
			} catch (error) {
				const uuid = randomUUID();
				const message = errors.UnexpectedError.noDatabaseConnection();
				return next(new UnexpectedError(message, { uuid, error }));
			}

			if (!user) {
				const uuid = randomUUID();
				const message = errors.UserNotFoundError.noEmailMatch(body.email);
				return next(new UserNotFoundError(message, { uuid }));
			}

			// check if given credentials match
			const credentialsMatch = await validateCredentials(body.email, body.password);
			if (!credentialsMatch) {
				const uuid = randomUUID();
				const message = errors.UnauthorizedError.invalidUserCredentials();
				return next(new UnauthorizedError(message, { uuid }));
			}

			setToken(res, user.userId); // set jwt

			return res.status(200).json(await addDevicesToUserBody(removeSensitiveDataFromUser(user)));
		},
	},

	activate: {
		get: async (req: Request, res: Response, next: NextFunction) => {
			// validate body
			const preValidationToken = req.query.token;
			const tokenValid = validateActivateToken(preValidationToken, false);
			if (tokenValid instanceof Error) {
				const uuid = randomUUID();
				return next(new InvalidParameterError(tokenValid.message, { uuid }));
			}

			// change type
			const { token } = req.query as { token: string };

			// check if token is already registered
			const tokenCacheKey = `tokens/verify-email:${token};`;
			if (await keyv.has(tokenCacheKey)) {
				const uuid = randomUUID();
				return next(new UnauthorizedError(errors.UnauthorizedError.invalidToken(), { uuid }));
			}

			// verify token
			jwt.verify(token, process.env.ENCRYPTION_KEY, async (jwtError, preValidationDecodedToken) => {
				// check if session is still valid
				if (jwtError instanceof jwt.TokenExpiredError) {
					const uuid = randomUUID();
					const message = errors.UnauthorizedError.tokenExpired('register');
					return next(new UnauthorizedError(message, { uuid }));
				}

				// handle other error
				if (jwtError instanceof jwt.JsonWebTokenError) {
					const uuid = randomUUID();
					const message = errors.UnauthorizedError.invalidToken();
					return next(new UnauthorizedError(message, { uuid, error: jwtError }));
				}

				// validate decoded token
				const decodedTokenValid = validateActivateToken(preValidationDecodedToken, true);
				if (decodedTokenValid instanceof Error) {
					const uuid = randomUUID();
					return next(new InvalidParameterError(decodedTokenValid.message, { uuid }));
				}

				// change type
				const decoded = preValidationDecodedToken as jwt.JwtPayload & {
					userId: string;
					email: string;
				};

				const userCacheKey = `cache/temp-user:${decoded.userId}`;
				const data: TemporaryUser | undefined = await keyv.get(userCacheKey);
				if (!data) {
					const uuid = randomUUID();
					const message = errors.UnexpectedError.noCacheUser();
					return next(new UnexpectedError(message, { uuid }));
				}

				// create user account
				try {
					await prisma.user.create({ data: { ...data, activated: true } });
				} catch (error) {
					const uuid = randomUUID();
					const message = errors.UnexpectedError.noDatabaseConnection();
					return next(new UnexpectedError(message, { uuid, error }));
				}

				await keyv.set(tokenCacheKey, true, ms('10m')); // register token to prevent reusing tokens
				await keyv.delete(userCacheKey); // delete temporary user from cache

				return res.status(201).json({ message: 'User created successfully' });
			});

			return true;
		},
	},

	logout: {
		post: (req: Request, res: Response) => {
			res.cookie('token', '', { maxAge: 1 });
			res.status(200).json({ message: 'You have been logged out' });
		},
	},
};
