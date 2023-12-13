import { TransformableInfo } from 'logform';
import { Logger } from 'winston';
import { Device, RiskFactor, User } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import {
	BaseError,
	DeviceNotFoundError,
	EmailAlreadyExistsError,
	ForbiddenError,
	InvalidParameterError,
	UnauthorizedError,
	UnexpectedError,
	UserNotFoundError,
} from './lib/errors';

export interface ConfigOptions {
	logs: {
		files?: {
			enabled: boolean;
			directory: string;
			keepFor?: string;
		};
		level: string;
	};
	cache: { keepFor: number };
	auth: { expiresIn: number };
	rateLimit: {
		interval: number;
		tokens: number;
	};
}

export interface CustomLogMethodMetaData {
	[key: string]: unknown;
	error?: Error;
	uuid?: string;
}

export type CustomLogMethod = (message: string | null, ...meta: CustomLogMethodMetaData[]) => unknown;

export type CustomLogger = Omit<
	Logger,
	| 'error'
	| 'warn'
	| 'help'
	| 'data'
	| 'info'
	| 'debug'
	| 'prompt'
	| 'http'
	| 'verbose'
	| 'input'
	| 'silly'
	| 'emerg'
	| 'alert'
	| 'crit'
	| 'warning'
	| 'notice'
> & {
	error: CustomLogMethod;
	warn: CustomLogMethod;
	info: CustomLogMethod;
	http: CustomLogMethod;
	debug: CustomLogMethod;
};

export interface LoggerMetaData {
	build: string;
	service: string;
}

export type LogData = TransformableInfo & Partial<LoggerMetaData & CustomLogMethodMetaData>;

export interface ApplicationErrorData {
	uuid: string;
	[key: string]: unknown;
}

export type ApplicationError =
	| BaseError
	| UserNotFoundError
	| DeviceNotFoundError
	| InvalidParameterError
	| EmailAlreadyExistsError
	| UnexpectedError
	| UnauthorizedError
	| ForbiddenError;

export type AuthSignupBody<V extends boolean> = V extends true
	? {
			name: string;
			email: string;
			password: string;
	  }
	: unknown;

export type AuthLoginBody<V extends boolean> = V extends true
	? {
			email: string;
			password: string;
	  }
	: unknown;

export type PatchUserCredentialsBody<V extends boolean> = V extends true
	? {
			update: {
				name?: string;
				email?: string;
				password?: string;
			};
			password: string;
	  }
	: unknown;

export type PatchDeviceCredentialsBody<V extends boolean> = V extends true
	? {
			update: {
				name?: string;
				emoji?: string;
			};
	  }
	: unknown;

export type PostDeviceMeasurementsBody<V extends boolean> = V extends true
	? {
			tds?: number;
			ph?: number;
			turbidity?: number;
			waterTemperature?: number;
			batteryLevel: number;
			coordinates: {
				lat: number;
				long: number;
			};
	  }
	: unknown;

export type GetNearestLocationBody<V extends boolean> = V extends true
	? {
			lat: number;
			long: number;
	  }
	: unknown;

export interface TemporaryUser {
	userId: string;
	name: string;
	email: string;
	password: string;
}

export type UserWithoutSensitiveData = Omit<User, 'password'>;

export type DeviceWithoutSensitiveData = Omit<Device, 'accessKey'>;

export type UserWithDevices = (User | UserWithoutSensitiveData) & { devices: string[] };

export interface DeviceMeasurements {
	ph?: Decimal | null;
	tds?: number | null;
	waterTemperature?: Decimal | null;
	turbidity?: number | null;
	risk: RiskFactor | null;
}

export type DeviceCredentials = Omit<Device, keyof DeviceMeasurements>;

export type RiskLevel = 'HIGH' | 'MODERATE' | 'LOW' | 'UNKNOWN';

export interface Location {
	name: string;
	lat: number;
	long: number;
}
