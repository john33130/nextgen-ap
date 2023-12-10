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

export function validateAccessId(value: unknown) {
	return Joi.string()
		.label('Access Key')
		.required()
		.messages({
			'string.required': errors.InvalidParameterError.isRequired('Access Key'),
			'string.base': errors.InvalidParameterError.invalidType('Access Key', 'string'),
		})
		.validate(value).error;
}

export function validatePostMeasurementsBody(body: unknown) {
	const schema = Joi.object({
		tds: Joi.number().label('TDS').min(1).max(3000).optional(),
		ph: Joi.number().label('PH').min(1).max(14).optional(),
		turbidity: Joi.number().label('Turbidity').min(1).max(3000).optional(),
		waterTemperature: Joi.number().label('Water Temperature').min(-55).max(125).optional(),
		batteryLevel: Joi.number().label('Battery Level').min(0).max(100).required(),
		coordinates: Joi.object({
			lat: Joi.string().label('Latitude').required(),
			long: Joi.string().label('Longitude').required(),
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
