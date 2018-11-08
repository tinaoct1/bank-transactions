const connection = require('../db')
const Promise = require('bluebird')
const CustomError = require('../lib/CustomError')

let transactionToken = '_'
/*to handle multiple clicking of transfer button
 a sample transactionToken looks like this
 {timestamp}_{receiver_account_nr}_{sender_account_nr}_{amount}
 1541674654432_123_456_10 */
const validateParams = (params) => !!(params && params.to && params.from && params.amount)

async function verifyAccount(accountNumber, amount) {
	const balance = await connection.query("SELECT balance FROM balances WHERE account_nr =" + accountNumber)
	if (!amount && !balance.length) throw new CustomError('Invalid receiver account number', 400)
	if (amount && !balance.length) throw new CustomError('Invalid sender account number', 400)
	const accountBalance = balance[0].balance
	if (amount && ((accountBalance - amount) < 0)) throw new CustomError('You have insufficient balance to perform this action', 400)
	return accountBalance
}

async function deDupeEntry (transactionRef, params) {
	let [timeStamp, toToken, fromToken, amountToken] = transactionToken.split('_')
	if ((transactionRef - 5000) <= timeStamp) {//if the current transaction time is within 5seconds of the previous transaction
		if (toToken == params.to && fromToken == params.from && amountToken == params.amount) {//if all the params are exactly the same
			throw new CustomError('This is a duplicate request. Please wait for 5 seconds to transfer again')
		}
	}
}

async function updateAccount(newBalance, accountNumber) {
	await connection.query("UPDATE balances SET balance = ? WHERE account_nr = ?", [newBalance, accountNumber])
}

async function createTransaction(transactionObj) {
	await connection.query("INSERT INTO transactions SET ?", transactionObj)
}

async function transferAmount(params) {
	try {
		const begin = await connection.beginTransaction()
		const transactionRef = new Date().valueOf()
		await deDupeEntry(transactionRef, params)
		const verifiedAccounts = await Promise.all([verifyAccount(params.from, params.amount), verifyAccount(params.to)])
		const newSenderBalance = verifiedAccounts[0] - params.amount
		const newReceiverBalance = verifiedAccounts[1] + params.amount
		const updateAccounts = await Promise.all([updateAccount(newSenderBalance, params.from), updateAccount(newReceiverBalance, params.to)])
		const senderTransactionObj = {reference: transactionRef + '_' + params.to, amount: params.amount, account_nr: params.from}
		const receiverTransactionObj = {reference: transactionRef + '_' + params.from, amount: params.amount, account_nr: params.to}
		const createTransactions = await Promise.all([createTransaction(senderTransactionObj), createTransaction(receiverTransactionObj)])
		await connection.commit()
		transactionToken = senderTransactionObj.reference + '_' + params.from + '_' + params.amount//reassigning token with new values
		return ({transaction: senderTransactionObj.reference, senderBalance: newSenderBalance, receiverBalance: newReceiverBalance})
	} catch (err) {
		await connection.rollback()
		throw err
	}
}

async function transfer (params) {
	if (validateParams(params) === false) throw new CustomError('This is not a valid request', 400)
	if (typeof params.amount !== 'number') throw new CustomError('You cannot transfer this amount', 400)
	if (params.from === params.to) throw new CustomError('You cannot transfer to yourself')
	const transferObj = await transferAmount(params)
	return ({
		id: transferObj.transaction,
		from: {id: params.from, balance: transferObj.senderBalance},
		to: {id:params.to, balance: transferObj.receiverBalance},
		transferred:params.amount})
}

module.exports.transfer =  transfer
