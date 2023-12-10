import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import Cryptr from 'cryptr';
import { Device } from '@prisma/client';
import { validateAccessId, validateDeviceId } from '../schemas/devices.schema';
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
export function checkAccessKey(req: Request, res: Response, next: NextFunction) {}

/**
 * TODO:
 * Delete user
 * Handle possible database errors
 * Rewrite POST>/:deviceId/measurements
 * Rewrite validateAccessKey function
 */

/**
 * `devices.route.ts`
 * router.post('/:deviceId/measurements', validateAccessKey, controller[':deviceId'].measurements.post);
 * 
 * `devices.controller.ts`
 * post: async (req: Request, res: Response) => {
				// validate body
				const schema = Joi.object({
					deviceId: Joi.string().required(), // given via middleware
					tds: Joi.number().min(0).max(4000).required(),
					ph: Joi.number().min(0).max(14).required(),
					turbidity: Joi.number().min(0).max(3000).required(),
					waterTemperature: Joi.number().min(-55).max(125).required(),
					batteryLevel: Joi.number().min(0).max(1000),
					coordinates: Joi.object({
						lat: Joi.string().required(),
						long: Joi.string().required(),
					}).required(),
				});

				const bodyValidation = schema.validate(req.body).error;
				if (bodyValidation) return res.status(400).send({ message: bodyValidation.message });

				// eslint-disable-next-line prefer-destructuring
				const body: {
					deviceId: string;
					tds: number;
					ph: number;
					turbidity: number;
					waterTemperature: number;
					batteryLevel: number;
					coordinates: {
						lat: string;
						long: string;
					};
				} = req.body;

				const risk = calculateRisk({
					ph: body.ph,
					turbidity: body.turbidity,
					temperature: body.waterTemperature,
					tds: body.tds,
				});

				// set new values in database
				await db.device.update({
					where: { id: body.deviceId },
					data: {
						...body,
						risk, // change later
					},
				});

				logger.info('Updated a device', { deviceId: body.deviceId }); // logging

				return 0;
			},

	`devices.middleware.ts`
	export function validateAccessKey(req: Request, res: Response, next: NextFunction) {
	const { accessKey } = req.query;

	// validate access key
	if (!accessKey) return res.status(400).json({ message: 'No access key provided' });
	if (typeof accessKey !== 'string') return res.status(401).json({ message: '"accessKey" must be a string' });

	// verify jwt key
	jwt.verify(accessKey, process.env.ENCRYPTION_KEY!, async (error) => {
		if (error) return res.status(400).json({ message: 'Failed to authenticate token' });
		const decoded = jwt.decode(accessKey) as jwt.JwtPayload & { deviceId: string };
		const device = await db.device.findUnique({
			where: { id: decoded.deviceId },
			select: { accessKey: true },
		});
		if (!device) return res.status(400).json({ message: 'Device does not exist' });
		if (device.accessKey !== accessKey)
			return res.status(401).json({ message: 'Invalid access key provided' });

		// set deviceId in body
		req.body.deviceId = decoded.deviceId;

		return 0;
	});

	return next();
}
 */
