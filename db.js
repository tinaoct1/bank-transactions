const mysql = require('mysql')
const util = require('bluebird')

const connection = mysql.createConnection({
	host     : process.env.MYSQL_HOST,
	user     : process.env.MYSQL_USER,
	password : process.env.MYSQL_PASSWORD,
	database : process.env.MYSQL_DATABASE,
	port     : process.env.MYSQL_PORT
})

connection.query = util.promisify(connection.query)
connection.beginTransaction = util.promisify(connection.beginTransaction)
connection.rollback = util.promisify(connection.rollback)
connection.commit = util.promisify(connection.commit)
connection.connect = util.promisify(connection.connect)

module.exports = connection