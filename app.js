if (process.env.NODE_ENV !== 'production') {
	require('dotenv').load()
}
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const morgan = require('morgan')
const logger = require('./services/ErrorLoggingService')

const TransactionService = require('./services/TransactionService')
app.use(bodyParser.json())
app.use(morgan('combined'))
app.set('port', process.env.PORT)

app.get('/', (req, res) => res.send('OK'))


app.post('/transfer', (req, res) => {
	return TransactionService.transfer(req.body).then(response => {
		logger.info(JSON.stringify(response))
		return res.send(response)
	}).catch(err => {
		logger.error(err.message)
		return res.status(err.httpStatusCode || 500).send(err.message)
	})
})

app.all('*',(req,res) => res.status(404).send('404 Invalid Request'))

app.listen(app.get('port'));

console.log('Express server listening on port ' + app.get('port'))

//todo gracefully shutdown node
