export {};

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			DB_CONNECTION_URL: string;
			CACHE_CONNECTION_URL: string;
			HTTP_PORT: string;
			HTTP_HOST: string;
			BASE_URL: string;
			ENCRYPTION_KEY: string;
			MAIL_USER: string;
			MAIL_PASSWORD: string;
		}
	}
}
