class CustomError extends Error {
	constructor (message, httpStatusCode) {
		super(message)
		this.httpStatusCode = httpStatusCode || 500
	}
}
module.exports = CustomError