import Joi from 'joi';
import { errors } from '../lib/errors';

export function validateUserId(value: unknown) {
	return Joi.string()
		.label('User Id')
		.length(8)
		.required()
		.messages({
			'string.required': errors.InvalidParameterError.isRequired('User Id'),
			'string.length': errors.InvalidParameterError.invalidFixedLength('User Id', 8),
			'string.base': errors.InvalidParameterError.invalidType('User Id', 'string'),
		})
		.validate(value).error;
}

export function validatePatchUserBody(body: unknown) {
	const schema = Joi.object({
		update: Joi.object({
			name: Joi.string()
				.label('Name')
				.max(64)
				.optional()
				.messages({
					'string.base': errors.InvalidParameterError.invalidType('Name', 'string'),
					'string.required': errors.InvalidParameterError.isRequired('Name'),
					'string.max': errors.InvalidParameterError.invalidMaxLength('Name', 64),
				}),
			email: Joi.string()
				.email({ tlds: false })
				.label('Email')
				.max(254)
				.optional()
				.messages({
					'string.base': errors.InvalidParameterError.invalidType('Email', 'string'),
					'string.required': errors.InvalidParameterError.isRequired('Email'),
					'string.max': errors.InvalidParameterError.invalidMaxLength('Email', 254),
					'string.email': 'Please make sure the email you provide is valid',
				}),
			password: Joi.string()
				.label('Password')
				.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]*$/)
				.min(8)
				.max(256)
				.optional()
				.messages({
					'string.base': errors.InvalidParameterError.invalidType('Password', 'string'),
					'string.required': errors.InvalidParameterError.isRequired('Password'),
					'string.min': errors.InvalidParameterError.invalidMinLength('Password', 8),
					'string.max': errors.InvalidParameterError.invalidMaxLength('Password', 254),
					'string.pattern.base':
						'Password must contain one uppercase letter, one lowercase letter, one number and one special character',
				}),
		})
			.min(1)
			.required()
			.messages({
				'object.min': errors.InvalidParameterError.MinOptionRequired(1),
			}),
		password: Joi.string()
			.label('Password')
			.required()
			.messages({
				'string.base': errors.InvalidParameterError.invalidType('Password', 'string'),
				'string.required': errors.InvalidParameterError.isRequired('Password'),
			}),
	});

	return schema.validate(body).error;
}
