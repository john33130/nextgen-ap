import { Device } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import containsEmoji from 'contains-emoji';
import nearbySort from 'nearby-sort';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { InvalidParameterError, UnexpectedError, errors } from '../lib/errors';
import { calculateRisk, getDeviceCredentials, removeSensitiveDataFromDevice } from '../helpers/devices.helpers';
import {
	DeviceMeasurements,
	GetNearestLocationBody,
	Location,
	PatchDeviceCredentialsBody,
	PostDeviceMeasurementsBody,
} from '../types';
import {
	validateGetNearestBody,
	validatePatchDeviceBody,
	validatePostMeasurementsBody,
} from '../schemas/devices.schema';
import logger from '../config/logger';

export default {
	'[deviceId]': {
		credentials: {
			get: async (req: Request, res: Response, next: NextFunction) => {
				const { deviceId } = req.params as { deviceId: string };

				let device: Device | null;

				// get device
				try {
					device = (await prisma.device.findUnique({ where: { deviceId } })) as Device;
				} catch (error) {
					const uuid = randomUUID();
					const message = errors.UnexpectedError.noDatabaseConnection();
					return next(new UnexpectedError(message, { uuid, error }));
				}

				return res.status(200).json(removeSensitiveDataFromDevice(device));
			},

			patch: async (req: Request, res: Response, next: NextFunction) => {
				// validate body
				const preValidationBody: PatchDeviceCredentialsBody<false> = req.body;
				const bodyIsValid = validatePatchDeviceBody(preValidationBody);
				if (bodyIsValid instanceof Error) {
					const uuid = randomUUID();
					return next(new InvalidParameterError(bodyIsValid.message, { uuid }));
				}

				// change body type
				const { body }: { body: PatchDeviceCredentialsBody<true> } = req;

				// check if `update.emoji` is emoij
				if (body.update.emoji && !containsEmoji(body.update.emoji)) {
					const uuid = randomUUID();
					const message = errors.InvalidParameterError.invalidType('Emoji', 'emoji');
					return next(new UnexpectedError(message, { uuid }));
				}

				const { deviceId } = req.params as { deviceId: string };

				let oldDevice: Device;

				try {
					oldDevice = (await prisma.device.findUnique({ where: { deviceId } })) as Device; // get old device data
				} catch (error) {
					const uuid = randomUUID();
					const message = errors.UnexpectedError.noDatabaseConnection();
					return next(new UnexpectedError(message, { uuid, error }));
				}

				// check if name is different
				if (oldDevice.name === body.update.name) {
					const uuid = randomUUID();
					const message = errors.InvalidParameterError.DifferentValuesRequired();
					return next(new InvalidParameterError(message, { uuid, key: 'name' }));
				}

				// check if emoji is different
				if (oldDevice.emoji === body.update.emoji) {
					const uuid = randomUUID();
					const message = errors.InvalidParameterError.DifferentValuesRequired();
					return next(new InvalidParameterError(message, { uuid, key: 'emoji' }));
				}

				let deviceOwnedByUserWithSameName: { deviceId: string } | null;

				// check if given name is duplicate in users devices
				try {
					deviceOwnedByUserWithSameName = await prisma.device.findUnique({
						where: { name: body.update.name, ownerId: oldDevice.ownerId, deviceId },
						select: { deviceId: true },
					});
				} catch (error) {
					const uuid = randomUUID();
					const message = errors.UnexpectedError.noDatabaseConnection();
					return next(new UnexpectedError(message, { uuid, error }));
				}

				if (deviceOwnedByUserWithSameName) {
					const uuid = randomUUID();
					const message = errors.InvalidParameterError.duplicateDeviceName();
					return next(new InvalidParameterError(message, { uuid, key: 'emoji' }));
				}

				let newDevice: Device | null;

				try {
					newDevice = await prisma.device.update({
						where: { deviceId },
						data: body.update,
					});
				} catch (error) {
					const uuid = randomUUID();
					const message = errors.UnexpectedError.noDatabaseConnection();
					return next(new UnexpectedError(message, { uuid, error }));
				}

				try {
					deviceOwnedByUserWithSameName = await prisma.device.findUnique({
						where: { name: body.update.name, ownerId: oldDevice.ownerId, deviceId },
						select: { deviceId: true },
					});
				} catch (error) {
					const uuid = randomUUID();
					const message = errors.UnexpectedError.noDatabaseConnection();
					return next(new UnexpectedError(message, { uuid, error }));
				}

				return res.status(200).json({
					oldDevice: removeSensitiveDataFromDevice(getDeviceCredentials(oldDevice)),
					newDevice: removeSensitiveDataFromDevice(getDeviceCredentials(newDevice)),
				});
			},
		},

		measurements: {
			get: async (req: Request, res: Response, next: NextFunction) => {
				const { deviceId } = req.params as { deviceId: string };

				let measurements: DeviceMeasurements | null;

				// get device
				try {
					measurements = (await prisma.device.findUnique({
						where: { deviceId },
						select: {
							ph: true,
							tds: true,
							turbidity: true,
							waterTemperature: true,
							risk: true,
							updatedAt: true,
						},
					})) as Device;
				} catch (error) {
					const uuid = randomUUID();
					const message = errors.UnexpectedError.noDatabaseConnection();
					return next(new UnexpectedError(message, { uuid, error }));
				}

				return res.status(200).json(measurements);
			},

			post: async (req: Request, res: Response, next: NextFunction) => {
				// validate body
				const preValidationBody: PostDeviceMeasurementsBody<false> = req.body;
				const bodyIsValid = validatePostMeasurementsBody(preValidationBody);
				if (bodyIsValid instanceof Error) {
					const uuid = randomUUID();
					return next(new InvalidParameterError(bodyIsValid.message, { uuid }));
				}

				// change type
				const { body } = req as { body: PostDeviceMeasurementsBody<true> };

				// calculate risk
				const risk = calculateRisk(body.tds, body.waterTemperature, body.turbidity, body.ph);

				// decode token
				const decoded = jwt.decode(req.cookies.token) as jwt.JwtPayload & { deviceId: string };

				try {
					await prisma.device.update({
						where: { deviceId: decoded.deviceId },
						data: {
							...body,
							risk,
						},
					});
				} catch (error) {
					const uuid = randomUUID();
					const message = errors.UnexpectedError.noDatabaseConnection();
					return next(new UnexpectedError(message, { uuid, error }));
				}

				logger.info('Update device with new measurements', { deviceId: decoded.deviceId }); // log info

				return res.send(200).json({ message: 'Updated device information' });
			},
		},
	},

	nearest: {
		get: async (req: Request, res: Response, next: NextFunction) => {
			// validate body
			const preValidationBody: GetNearestLocationBody<false> = req.body;
			const bodyIsValid = validateGetNearestBody(preValidationBody);
			if (bodyIsValid instanceof Error) {
				const uuid = randomUUID();
				return next(new InvalidParameterError(bodyIsValid.message, { uuid }));
			}

			// change type
			const { body }: { body: GetNearestLocationBody<true> } = req;

			const locations: Location[] = []; // initalize array

			// get all locations
			try {
				(
					await prisma.device.findMany({ select: { coordinates: true, location: true } })
				).forEach((device) => {
					if (
						!device.coordinates ||
						typeof device.coordinates !== 'object' ||
						Array.isArray(device.coordinates) ||
						!device.coordinates.lat ||
						device.coordinates.long ||
						typeof device.coordinates.lat !== 'number' ||
						typeof device.coordinates.long !== 'number' ||
						!device.location
					) {
						return 0;
					}

					// actual code
					return locations.push({
						lat: device.coordinates.lat,
						long: device.coordinates.long,
						name: device.location,
					});
				});
			} catch (error) {
				const uuid = randomUUID();
				const message = errors.UnexpectedError.noDatabaseConnection();
				return next(new UnexpectedError(message, { uuid, error }));
			}

			const closest: Location = (await nearbySort(body, locations))[0];

			return res.status(200).json(closest);
		},
	},

	get: async (req: Request, res: Response, next: NextFunction) => {
		let devices: { deviceId: string }[] = [];

		try {
			devices = await prisma.device.findMany({ select: { deviceId: true } });
		} catch (error) {
			const uuid = randomUUID();
			const message = errors.UnexpectedError.noDatabaseConnection();
			return next(new UnexpectedError(message, { uuid, error }));
		}

		return res.status(200).json(devices);
	},
};
