import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import Cryptr from 'cryptr';
import { Device } from '@prisma/client';
import { validateAccessKey, validateDeviceId } from '../schemas/devices.schema';
import {
	DeviceNotFoundError,
	ForbiddenError,
	InvalidParameterError,
	UnauthorizedError,
	UnexpectedError,
	errors,
} from '../lib/errors';
import prisma from '../config/prisma';

const { decrypt } = new Cryptr(process.env.ENCRYPTION_KEY);

/**
 * Check if the user has access to this device
 * @param req - The request object
 * @param res - The response object
 * @param next - The next function
 */
export async function checkAccessToDevice(req: Request, res: Response, next: NextFunction) {
	// validate device id
	const preValidationDeviceId = req.params.deviceId;
	const valid = validateDeviceId(preValidationDeviceId);
	if (valid instanceof Error) {
		const uuid = randomUUID();
		return next(new InvalidParameterError(valid.message, { uuid }));
	}

	// change type
	const { deviceId } = req.params as { deviceId: string };

	let device: Device | null;

	try {
		device = await prisma.device.findUnique({ where: { deviceId } });
	} catch (error) {
		const uuid = randomUUID();
		const message = errors.UnexpectedError.noDatabaseConnection();
		return next(new UnexpectedError(message, { uuid }));
	}

	// check if device exists
	if (!device) {
		const uuid = randomUUID();
		const message = errors.DeviceNotFoundError.noDeviceIdMatch(deviceId);
		return next(new DeviceNotFoundError(message, { uuid }));
	}

	// don't need to validate because we already did that at this point
	const token = jwt.decode(req.cookies.token) as jwt.JwtPayload & { userId: string }; // decode token

	// check if user id in token has link with device
	if (token.userId !== device.ownerId) {
		const uuid = randomUUID();
		const message = errors.ForbiddenError.noPermissionToDevice();
		return next(new ForbiddenError(message, { uuid }));
	}

	return next();
}

/**
 * Validate the access key of an incoming request
 * @param req - The request object
 * @param res - The response object
 * @param next - The next function
 */
export function checkAccessKey(req: Request, res: Response, next: NextFunction) {
	// validate access key
	const preValidationAccessKey: unknown = req.query.accesssKey;
	const valid = validateAccessKey(preValidationAccessKey);
	if (valid instanceof Error) {
		const uuid = randomUUID();
		return next(new InvalidParameterError(valid.message, { uuid }));
	}

	// change type
	const { accessKey } = req.query as { accessKey: string };

	// verify jwt
	jwt.verify(accessKey, process.env.ENCRYPTION_KEY, async (jwtError: unknown) => {
		if (jwtError) {
			const uuid = randomUUID();
			const message = errors.UnauthorizedError.invalidAccessKey();
			return next(new UnauthorizedError(message, { uuid }));
		}

		const decoded = jwt.decode(accessKey) as jwt.JwtPayload & { deviceId: string };

		let device: { accessKey: string } | null;

		try {
			device = await prisma.device.findUnique({
				where: { deviceId: decoded.deviceId },
				select: { accessKey: true },
			});
		} catch (error) {
			const uuid = randomUUID();
			const message = errors.UnexpectedError.noDatabaseConnection();
			return next(new UnexpectedError(message, { uuid }));
		}

		// check if device exists
		if (!device) {
			const uuid = randomUUID();
			const message = errors.DeviceNotFoundError.noDeviceIdMatch(decoded.deviceId);
			return next(new DeviceNotFoundError(message, { uuid }));
		}

		// check if keys match
		if (decrypt(device.accessKey) !== accessKey) {
			const uuid = randomUUID();
			const message = errors.UnauthorizedError.invalidToken();
			return next(new UnauthorizedError(message, { uuid }));
		}

		return true;
	});

	return next();
}
