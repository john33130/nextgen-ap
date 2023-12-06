import { User } from '@prisma/client';
import { randomUUID } from 'crypto';
import merge from 'deepmerge';
import prisma from '../config/prisma';
import { UserNotFoundError, errors } from '../lib/errors';
import { UserWithDevices, UserWithoutSensitiveData } from '../types';

/**
 * Remove sensitive data from a user object
 * @param body - The user object
 */
export function removeSensitiveDataFromUser(body: User): UserWithoutSensitiveData {
	const data: Partial<User> = body;
	delete data.password;
	return data as UserWithoutSensitiveData;
}

/**
 * Add an array with owned devices to the user object
 * @param body - The user body
 */
export async function addDevicesToUserBody(body: User | UserWithoutSensitiveData): Promise<UserWithDevices> {
	const user = await prisma.user.findUnique({
		where: { userId: body.userId },
		select: { devices: true, userId: true },
	});

	// check if user exists
	if (!user) {
		throw new UserNotFoundError(errors.UserNotFoundError.noUserIdMatch(body.userId), {
			uuid: randomUUID(),
		});
	}

	// get devices
	const devices: string[] = [];
	(await prisma.user.findUnique({ where: { userId: user.userId }, select: { devices: true } }))?.devices.forEach(
		(device) => devices.push(device.deviceId)
	);

	return merge(body, { devices });
}
