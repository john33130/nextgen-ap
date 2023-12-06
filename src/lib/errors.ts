/* eslint-disable max-classes-per-file */

import { ApplicationErrorData } from '../types';

export const errors = {
	UserNotFoundError: {
		noEmailMatch: (email: string) => `	The user (${email}) was not found`,
		noUserIdMatch: (userId: string) => `The user (${userId}) was not found`,
	},
	InvalidParameterError: {
		invalidType: (key: string, expected: string) => `${key} must be a "${expected}"`,
		invalidFixedLength: (key: string, expected: number) => `${key} must have a length of ${expected}`,
		invalidMinLength: (key: string, expected: number) => `${key} must be longer then ${expected - 1}`,
		invalidMaxLength: (key: string, expected: number) => `${key} must be shorter then ${expected + 1}`,
		isRequired: (key: string) => `${key} is required`,
		MinOptionRequired: (amount: number) => `Atleast ${amount} option(s) is required`,
		DifferentValuesRequired: () => 'Please make sure the the values you enter are different',
		duplicateDeviceName: () => 'You already have a device with the same name',
	},
	UnauthorizedError: {
		invalidUserCredentials: () => `You have entered an invalid email or password`,
		invalidAccessKey: () => `An invalid access key was provided`,
		invalidToken: () => `An invalid token was provided`,
		tokenExpired: (method: 'login' | 'register') => `The session has expired. Please ${method} again`,
		accountNotActivated: () => `This account is not activated yet`,
		notLoggedIn: () => `You are not logged in`,
	},
	ForbiddenError: {
		noPermissionToUser: () => "You don't have access to this user",
		noPermissionToDevice: () => "You don't have access to this device",
	},
	DeviceNotFoundError: {
		noDeviceIdMatch: (deviceId: string) => `The device (${deviceId}) was not found`,
	},
	UnexpectedError: {
		noDatabaseConnection: () => 'Failed to connect to the database',
		noCacheUser: () => 'Did not find a user with that id in the cache',
	},
};

export class BaseError extends Error {
	public readonly data;

	public readonly status;

	public readonly internal;

	public readonly reason;

	/**
	 * Create a BaseError instance
	 * @param data - Extra data to capture
	 * @param message - The message of the error
	 * @param status - The HTTP status code
	 */
	constructor(data: ApplicationErrorData, message?: string | null, status?: number | null, reason?: string) {
		super();

		Error.captureStackTrace(this, this.constructor);

		this.name = this.constructor.name;
		this.message = message || 'Something went wrong. Please try again.';
		this.status = status || 500;
		this.data = data;
		this.reason = reason || null; // extra explenation that wouldn't make sense to the user
		this.internal = true; // used to check if error is custom
	}
}

export class UserNotFoundError extends BaseError {
	/**
	 * Create a UserNotFoundError instance
	 * @param message - The message of the error
	 * @param data - Extra data to capture
	 */
	constructor(message: string, data: ApplicationErrorData) {
		super(data, message, 404);
	}
}

export class DeviceNotFoundError extends BaseError {
	/**
	 * Create a DeviceNotFoundError instance
	 * @param message - The message of the error
	 * @param data - Extra data to capture
	 */
	constructor(message: string, data: ApplicationErrorData) {
		super(data, message, 404);
	}
}

export class InvalidParameterError extends BaseError {
	/**
	 * Create a InvalidParameterError instance
	 * @param message - The message of the error
	 * @param data - Extra data to capture
	 */
	constructor(message: string, data: ApplicationErrorData) {
		super(data, message, 400);
	}
}

export class EmailAlreadyExistsError extends BaseError {
	/**
	 * Create a EmailAlreadyExistsError instance
	 * @param data - Extra data to capture
	 */
	constructor(data: ApplicationErrorData) {
		super(data, 'This email is already linked to an account', 408);
	}
}

export class UnexpectedError extends BaseError {
	/**
	 * Create a UnexpectedError instance
	 * @param message - The message of the error
	 * @param data - Extra data to capture
	 */
	constructor(message: string, data: ApplicationErrorData) {
		super(data, message, 500);
	}
}

export class UnauthorizedError extends BaseError {
	/**
	 * Create a UnauthorizedError instance
	 * @param message - The message of the error
	 * @param data - Extra data to capture
	 */
	constructor(message: string, data: ApplicationErrorData) {
		super(data, message, 401);
	}
}
export class ForbiddenError extends BaseError {
	/**
	 * Create a UnauthorizedError instance
	 * @param message - The message of the error
	 * @param data - Extra data to capture
	 */
	constructor(message: string, data: ApplicationErrorData) {
		super(data, message, 403);
	}
}

export class AlreadyLoggedInError extends BaseError {
	/**
	 * Create a UnauthorizedError instance
	 * @param data - Extra data to capture
	 */
	constructor(data: ApplicationErrorData) {
		super(data, 'You are already logged in', 403);
	}
}
