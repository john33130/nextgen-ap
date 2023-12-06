import { Device } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import containsEmoji from 'contains-emoji';
import prisma from '../config/prisma';
import { InvalidParameterError, UnexpectedError, errors } from '../lib/errors';
import { calculateRisk, getDeviceCredentials, removeSensitiveDataFromDevice } from '../helpers/devices.helpers';
import { DeviceMeasurements, PatchDeviceCredentialsBody, PostDeviceMeasurementsBody } from '../types';
import { validatePatchDeviceBody, validatePostMeasurementsBody } from '../schemas/devices.schema';

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

				const oldDevice = (await prisma.device.findUnique({ where: { deviceId } })) as Device; // get old device data

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

				// check if given name is duplicate in users devices
				const deviceOwnedByUserWithSameName = await prisma.device.findUnique({
					where: { name: body.update.name, ownerId: oldDevice.ownerId, deviceId },
				});

				if (deviceOwnedByUserWithSameName) {
					const uuid = randomUUID();
					const message = errors.InvalidParameterError.duplicateDeviceName();
					return next(new InvalidParameterError(message, { uuid, key: 'emoji' }));
				}

				const newDevice = await prisma.device.update({
					where: { deviceId },
					data: body.update,
				});

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

				res.status(200).json(measurements);
			},

			post: (req: Request, res: Response, next: NextFunction) => {},
		},
	},

	'nearest-device': {
		get: (req: Request, res: Response, next: NextFunction) => {},
	},

	get: (req: Request, res: Response, next: NextFunction) => {},
};
