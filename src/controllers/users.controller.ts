import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { validatePatchUserBody } from '../schemas/users.schema';
import {
	EmailAlreadyExistsError,
	InvalidParameterError,
	UnauthorizedError,
	UnexpectedError,
	errors,
} from '../lib/errors';
import prisma from '../config/prisma';
import { addDevicesToUserBody, removeSensitiveDataFromUser } from '../helpers/users.helpers';
import { PatchUserCredentialsBody } from '../types';

export default {
	'[userId]': {
		credentials: {
			get: async (req: Request, res: Response, next: NextFunction) => {
				const { userId } = req.params as { userId: string };

				let user: User | null;

				// get user
				try {
					user = (await prisma.user.findUnique({ where: { userId } })) as User;
				} catch (error) {
					const uuid = randomUUID();
					const message = errors.UnexpectedError.noDatabaseConnection();
					return next(new UnexpectedError(message, { uuid, error }));
				}

				return res
					.status(200)
					.json(await addDevicesToUserBody(removeSensitiveDataFromUser(user)));
			},

			patch: async (req: Request, res: Response, next: NextFunction) => {
				// validate body
				const preValidationBody: PatchUserCredentialsBody<false> = req.body;
				const bodyIsValid = validatePatchUserBody(preValidationBody);
				if (bodyIsValid instanceof Error) {
					const uuid = randomUUID();
					return next(new InvalidParameterError(bodyIsValid.message, { uuid }));
				}

				// change body type
				const { body }: { body: PatchUserCredentialsBody<true> } = req;

				const { userId } = req.params as { userId: string };

				let oldUser: User | null;

				try {
					oldUser = (await prisma.user.findUnique({ where: { userId } })) as User; // get old user data
				} catch (error) {
					const uuid = randomUUID();
					const message = errors.UnexpectedError.noDatabaseConnection();
					return next(new UnexpectedError(message, { uuid, error }));
				}

				// check if name is different
				if (oldUser.name === body.update.name) {
					const uuid = randomUUID();
					const message = errors.InvalidParameterError.DifferentValuesRequired();
					return next(new InvalidParameterError(message, { uuid, key: 'name' }));
				}

				// check if email is different
				if (oldUser.email === body.update.email) {
					const uuid = randomUUID();
					const message = errors.InvalidParameterError.DifferentValuesRequired();
					return next(new InvalidParameterError(message, { uuid, key: 'email' }));
				}

				// check if password is different
				if (
					body.update.password &&
					(await bcrypt.compare(body.update.password, oldUser.password))
				) {
					const uuid = randomUUID();
					const message = errors.InvalidParameterError.DifferentValuesRequired();
					return next(new InvalidParameterError(message, { uuid, key: 'password' }));
				}

				// check if given email is available
				if (
					body.update.email &&
					(await prisma.user.count({ where: { email: body.update.email } }))
				) {
					const uuid = randomUUID();
					return next(new EmailAlreadyExistsError({ uuid }));
				}

				// check if valid password is given
				const passwordValid = await bcrypt.compare(body.password, oldUser.password);
				if (!passwordValid) {
					const uuid = randomUUID();
					const message = errors.UnauthorizedError.invalidUserCredentials();
					return next(new UnauthorizedError(message, { uuid }));
				}

				// hash updated password if present
				if (body.update.password) {
					body.update.password = await bcrypt.hash(
						body.update.password,
						await bcrypt.genSalt()
					);
				}

				let newUser: User | null;

				// update user
				try {
					newUser = await prisma.user.update({
						where: { userId },
						data: body.update,
					});
				} catch (error) {
					const uuid = randomUUID();
					const message = errors.UnexpectedError.noDatabaseConnection();
					return next(new UnexpectedError(message, { uuid, error }));
				}

				return res.status(200).json({
					oldUser: removeSensitiveDataFromUser(oldUser),
					newUser: removeSensitiveDataFromUser(newUser),
				});
			},
		},

		delete: (req: Request, res: Response, next: NextFunction) => {
			/**
			 * Proces:
			 * 1. User request delete
			 * 2. User gets send an email with route /delete?token=<TOKEN>
			 * 3. Validate token and stop if not valid (anymore)
			 * 4. Set `deactivated` and `deactivationDate` in database
			 * 5. Log user out
			 * 6. Return to user 200 OK
			 */
		},
	},
};
