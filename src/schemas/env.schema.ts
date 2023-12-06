import Joi from 'joi';

export default Joi.object({
	DB_CONNECTION_URL: Joi.string().required(),
	CACHE_CONNECTION_URL: Joi.string().required(),
	HTTP_PORT: Joi.string().required(),
	HTTP_HOST: Joi.string().required(),
	BASE_URL: Joi.string().required(),
	ENCRYPTION_KEY: Joi.string().required(),
	MAIL_USER: Joi.string().required(),
	MAIL_PASSWORD: Joi.string().required(),
});
