const { createLogger, format, transports } = require('winston')
require('winston-daily-rotate-file')

const dailyRotateFileTransport = new transports.DailyRotateFile({
	filename: `logs/%DATE%.log`,
	datePattern: 'DD-MM-YYYY'
})

const logger = createLogger({
	format: format.combine(
		format.timestamp({format: 'HH:mm:ss'}),
		format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)),
	transports: [
		new transports.Console({
			level: 'debug',
			format: format.combine(
				format.colorize(),
				format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
			)
		}),
		dailyRotateFileTransport
	]
})

module.exports = logger
