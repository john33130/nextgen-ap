import Joi from 'joi';
import { errors } from '../lib/errors';

export function validateSignupBody(body: unknown) {
	const schema = Joi.object({
		name: Joi.string()
			.label('Name')
			.max(64)
			.required()
			.messages({
				'string.base': errors.InvalidParameterError.invalidType('Name', 'string'),
				'string.required': errors.InvalidParameterError.isRequired('Name'),
				'string.max': errors.InvalidParameterError.invalidMaxLength('Name', 64),
			}),
		email: Joi.string()
			.email({ tlds: false })
			.label('Email')
			.max(254)
			.required()
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
			.required()
			.messages({
				'string.base': errors.InvalidParameterError.invalidType('Password', 'string'),
				'string.required': errors.InvalidParameterError.isRequired('Password'),
				'string.min': errors.InvalidParameterError.invalidMinLength('Password', 8),
				'string.max': errors.InvalidParameterError.invalidMaxLength('Password', 254),
				'string.pattern.base':
					'Password must contain one uppercase letter, one lowercase letter, one number and one special character',
			}),
	});

	return schema.validate(body).error;
}

export function validateActivateToken(value: unknown, decoded: boolean) {
	return (
		decoded
			? Joi.string()
					.label('Token')
					.required()
					.messages({
						'string.required': errors.InvalidParameterError.isRequired('Token'),
						'string.base': errors.InvalidParameterError.invalidType(
							'Token',
							'string'
						),
					})
			: Joi.object({
					userid: Joi.string()
						.length(8)
						.required()
						.messages({
							'string.length':
								errors.InvalidParameterError.invalidFixedLength(
									'Token',
									8
								),
						}),
					email: Joi.string().required(), // at the point of using this we already validated the email
			  }).messages({
					'string.required': errors.InvalidParameterError.isRequired('Token'),
					'string.base': errors.InvalidParameterError.invalidType('Token', 'string'),
			  })
	).validate(value);
}

export function validateLoginBody(body: unknown) {
	const schema = Joi.object({
		email: Joi.string()
			.label('Email')
			.max(254)
			.required()
			.messages({
				'string.base': errors.InvalidParameterError.invalidType('Email', 'string'),
				'string.required': errors.InvalidParameterError.isRequired('Email'),
				'string.max': errors.InvalidParameterError.invalidMaxLength('Email', 254),
				'string.email': 'Please make sure you provide a valid email',
			}),
		password: Joi.string()
			.label('Password')
			.max(256)
			.required()
			.messages({
				'string.base': errors.InvalidParameterError.invalidType('Password', 'string'),
				'string.required': errors.InvalidParameterError.isRequired('Password'),
				'string.max': errors.InvalidParameterError.invalidMaxLength('Password', 254),
			}),
	});

	return schema.validate(body).error;
}
