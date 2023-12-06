import winston from 'winston';
import { format } from 'logform';
import { MESSAGE } from 'triple-beam';
import DailyRotateFile from 'winston-daily-rotate-file';
import { CustomLogger, LogData } from '../types';
import pkg from '../lib/pkg';
import configuration from './configuration';

export default ((): CustomLogger => {
	const levels = {
		error: 0,
		warn: 1,
		info: 2,
		http: 3,
		debug: 4,
	};

	const transports = [
		new winston.transports.Console({
			format: format.combine(
				format.timestamp({ format: 'YYYY/MM/DD HH:mm:ss' }),
				format((info: LogData) => {
					info.level = `[${info.level.toUpperCase()}]`;
					format.colorize().transform(info, { level: true }); // colorize level
					info.message ??= 'No message was provided';
					info[MESSAGE] = `${info.timestamp} ${info.level} ${info.message}`;
					if (info.error)
						info[MESSAGE] += `\nAn error was provided:\n${info.error.stack}`;

					return info;
				})()
			),
		}),
		new DailyRotateFile({
			datePattern: 'YYYY-MM-DD',
			dirname: configuration.logs.files?.directory,
			eol: '\n',
			extension: '.log',
			filename: '%DATE%',
			format: format.combine(format.timestamp(), format.json()),
			maxFiles: configuration.logs.files?.keepFor
				? `${configuration.logs.files?.keepFor}d`
				: undefined,
			silent: !configuration.logs.files?.enabled,
		}),
	];

	const defaultMeta = {
		build: pkg.version || 'unknown',
		service: 'backend',
	};

	return winston.createLogger({
		defaultMeta,
		level: configuration.logs.level,
		levels,
		transports,
	}) as unknown as CustomLogger;
})();
