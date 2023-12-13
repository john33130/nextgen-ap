import Joi from 'joi';
import { errors } from '../lib/errors';

export function validateDeviceId(value: unknown) {
	return Joi.string()
		.label('Device Id')
		.length(8)
		.required()
		.messages({
			'string.required': errors.InvalidParameterError.isRequired('Device Id'),
			'string.length': errors.InvalidParameterError.invalidFixedLength('Device Id', 8),
			'string.base': errors.InvalidParameterError.invalidType('Device Id', 'string'),
		})
		.validate(value).error;
}

export function validatePatchDeviceBody(body: unknown) {
	const schema = Joi.object({
		update: Joi.object({
			name: Joi.string()
				.label('Name')
				.max(32)
				.optional()
				.messages({
					'string.base': errors.InvalidParameterError.invalidType('Name', 'string'),
					'string.required': errors.InvalidParameterError.isRequired('Name'),
					'string.max': errors.InvalidParameterError.invalidMaxLength('Name', 32),
				}),
			emoji: Joi.string()
				.label('Emoji')
				.length(2)
				.optional()
				.messages({
					'string.base': errors.InvalidParameterError.invalidType('Emoji', 'string'),
					'string.required': errors.InvalidParameterError.isRequired('Emoji'),
					'string.length': errors.InvalidParameterError.invalidFixedLength('Emoji', 2),
				}),
		})
			.min(1)
			.required()
			.messages({
				'object.min': errors.InvalidParameterError.MinOptionRequired(1),
			}),
	});

	return schema.validate(body).error;
}

export function validatePostMeasurementsBody(body: unknown) {
	const schema = Joi.object({
		tds: Joi.number()
			.label('TDS')
			.min(1)
			.max(3000)
			.optional()
			.messages({
				'number.min': errors.InvalidParameterError.invalidMinLength('TDS', 1),
				'number.max': errors.InvalidParameterError.invalidMaxLength('TDS', 3000),
				'number.required': errors.InvalidParameterError.isRequired('TDS'),
				'number.base': errors.InvalidParameterError.invalidType('TDS', 'number'),
			}),
		ph: Joi.number()
			.label('PH')
			.min(1)
			.max(14)
			.optional()
			.messages({
				'number.min': errors.InvalidParameterError.invalidMinLength('PH', 1),
				'number.max': errors.InvalidParameterError.invalidMaxLength('PH', 14),
				'number.required': errors.InvalidParameterError.isRequired('PH'),
				'number.base': errors.InvalidParameterError.invalidType('PH', 'number'),
			}),
		turbidity: Joi.number()
			.label('Turbidity')
			.min(1)
			.max(3000)
			.optional()
			.messages({
				'number.min': errors.InvalidParameterError.invalidMinLength('Turbidity', 1),
				'number.max': errors.InvalidParameterError.invalidMaxLength('Turbidity', 3000),
				'number.required': errors.InvalidParameterError.isRequired('Turbidity'),
				'number.base': errors.InvalidParameterError.invalidType('Turbidity', 'number'),
			}),
		waterTemperature: Joi.number()
			.label('Water Temperature')
			.min(-55)
			.max(125)
			.optional()
			.messages({
				'number.min': errors.InvalidParameterError.invalidMinLength('Water Temperature', -55),
				'number.max': errors.InvalidParameterError.invalidMaxLength('Water Temperature', 125),
				'number.required': errors.InvalidParameterError.isRequired('Water Temperature'),
				'number.base': errors.InvalidParameterError.invalidType('Water Temperature', 'number'),
			}),
		batteryLevel: Joi.number()
			.label('Battery Level')
			.min(0)
			.max(100)
			.required()
			.messages({
				'number.min': errors.InvalidParameterError.invalidMinLength('Battery Level', 1),
				'number.max': errors.InvalidParameterError.invalidMaxLength('Battery Level', 100),
				'number.required': errors.InvalidParameterError.isRequired('Battery Level'),
				'number.base': errors.InvalidParameterError.invalidType('Battery Level', 'number'),
			}),
		coordinates: Joi.object({
			lat: Joi.number()
				.label('Latitude')
				.required()
				.messages({
					'number.required': errors.InvalidParameterError.isRequired('Latitude'),
					'number.base': errors.InvalidParameterError.invalidType('Latitude', 'number'),
				}),
			long: Joi.number()
				.label('Longitude')
				.required()
				.messages({
					'number.required': errors.InvalidParameterError.isRequired('Longitude'),
					'number.base': errors.InvalidParameterError.invalidType('Longitude', 'number'),
				}),
		}).required(),
	});

	return schema.validate(body).error;
}

export function validateGetNearestBody(body: unknown) {
	const schema = Joi.object({
		lat: Joi.number().label('Latitude').required(),
		long: Joi.number().label('Longitude').required(),
	}).messages({
		'string.required': errors.InvalidParameterError.isRequired('Access Key'),
		'string.base': errors.InvalidParameterError.invalidType('Access Key', 'string'),
	});

	return schema.validate(body).error;
}

export function validateAccessKey(value: unknown) {
	return Joi.string()
		.label('Access key')
		.required()
		.messages({
			'string.required': errors.InvalidParameterError.isRequired('Access Key'),
			'string.base': errors.InvalidParameterError.invalidType('Access Key', 'string'),
		})
		.validate(value).error;
}
