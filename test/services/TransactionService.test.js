process.env.NODE_ENV = 'test';

const TransactionService = require('../../services/TransactionService')
const assert = require('assert')
const sinon = require('sinon')
const Promise = require('bluebird')

describe('TransactionService', () => {
	
	describe('#transfer', () => {
		describe('when input params are invalid', () => {
			let mockDb
			
			beforeEach(() => {
				mockDb = sinon.mock(require('../../db'))
				mockDb.expects('beginTransaction').returns({});
				mockDb.expects('rollback').returns({});
				mockDb.expects('query').withArgs('UPDATE balances SET balance = ? WHERE account_nr = ?', [undefined, "1001"]).returns({});
			})
			
			afterEach(() => {
				mockDb.restore()
			})
			
			it('should throw an error if params are invalid is not present', async() => {
				return TransactionService.transfer({}).catch(e => {
					assert.equal(e.message, 'This is not a valid request')
				})
			})
			
			it('should throw an error if params are invalid is not present', async() => {
				return TransactionService.transfer({from: '123'}).catch(e => {
					assert.equal(e.message, 'This is not a valid request')
				})
			})
			
			it('should throw an error if params are invalid is not present', async() => {
				return TransactionService.transfer({to: '123'}).catch(e => {
					assert.equal(e.message, 'This is not a valid request')
				})
			})
			
			it('should throw an error if params are invalid is not present', async() => {
				return TransactionService.transfer({amount: 123}).catch(e => {
					assert.equal(e.message, 'This is not a valid request')
				})
			})
			
			it('should throw an error if params are invalid is not present', async() => {
				return TransactionService.transfer({from: 123, to: 123}).catch(e => {
					assert.equal(e.message, 'This is not a valid request')
				})
			})
			
			it('should throw an error if params are invalid is not present', async() => {
				return TransactionService.transfer({from: 123, to: 123, amount: 10}).catch(e => {
					assert.equal(e.message, 'You cannot transfer to yourself')
				})
			})
			
			it('should throw an error if params are invalid is not present', async() => {
				return TransactionService.transfer({from: 123, to: 456, amount: 0}).catch(e => {
					assert.equal(e.message, 'This is not a valid request')
				})
			})
			
			
			it('should throw an error if params are invalid is not present', async() => {
				return TransactionService.transfer({from: 123, to: 456, amount: "0"}).catch(e => {
					assert.equal(e.message, 'You cannot transfer this amount')
				})
			})
			////////////////////////////test for verifying params end here///////////////////////////
			
			///////////////////////////////test for verifying transfer///////////////////////////////
			
			it('should throw an error if from is not found in the database', async() => {
				mockDb.expects('query').withArgs("SELECT balance FROM balances WHERE account_nr =1001").returns([]);
				mockDb.expects('query').withArgs("SELECT balance FROM balances WHERE account_nr =1002").returns([]);
				return TransactionService.transfer({from: '1001', to: '1002', amount: 10}).catch(e => {
					assert.equal(e.message, 'Invalid sender account number')
				})
			})
			
			it('should throw an error if to is not found in the database', async() => {
				mockDb.expects('query').withArgs("SELECT balance FROM balances WHERE account_nr =1001").returns([{balance: 1000}]);
				mockDb.expects('query').withArgs("SELECT balance FROM balances WHERE account_nr =1002").returns([]);
				return TransactionService.transfer({from: '1001', to: '1002', amount: 10}).catch(e => {
					assert.equal(e.message, 'Invalid receiver account number')
				})
			})
			
			it('should throw an error if balance is not sufficient', async() => {
				mockDb.expects('query').withArgs("SELECT balance FROM balances WHERE account_nr =1001").returns([{balance: 10}]);
				mockDb.expects('query').withArgs("SELECT balance FROM balances WHERE account_nr =1002").returns([{balance: 20}]);
				return TransactionService.transfer({from: '1001', to: '1002', amount: 100}).catch(e => {
					assert.equal(e.message, 'You have insufficient balance to perform this action')
				})
			})
			
			it('should return correct response when all inputs are correct', async() => {
				mockDb.expects('query').withArgs("SELECT balance FROM balances WHERE account_nr =1001").returns([{balance: 1000}]);
				mockDb.expects('query').withArgs("SELECT balance FROM balances WHERE account_nr =1002").returns([{balance: 2000}]);
				mockDb.expects('query').withArgs("UPDATE balances SET balance = ? WHERE account_nr = ?", [900, "1001"]).returns([{}]);
				mockDb.expects('query').withArgs("UPDATE balances SET balance = ? WHERE account_nr = ?", [2100, "1002"]).returns([{}]);
				mockDb.expects('query').withArgs("INSERT INTO transactions SET ?", { reference: sinon.match.any, amount: 100, account_nr: '1001' }).returns([{}]);
				mockDb.expects('query').withArgs("INSERT INTO transactions SET ?", { reference: sinon.match.any, amount: 100, account_nr: '1002' }).returns([{}]);
				mockDb.expects('commit').returns({})
				return TransactionService.transfer({from: '1001', to: '1002', amount: 100}).then(res => {
					assert.equal(res.transferred, 100)
					assert.deepEqual(res.from, { id: '1001', balance: 900 })
					assert.deepEqual(res.to, { id: '1002', balance: 2100 })
				})
			})
			
			
			it('should throw an error when user clicks on transfer button with same params within 5 seconds', async() => {
				mockDb.expects('query').withArgs("SELECT balance FROM balances WHERE account_nr =1001").returns([{balance: 1000}]);
				mockDb.expects('query').withArgs("SELECT balance FROM balances WHERE account_nr =1002").returns([{balance: 2000}]);
				mockDb.expects('query').withArgs("UPDATE balances SET balance = ? WHERE account_nr = ?", [890, "1001"]).returns([{}]);
				mockDb.expects('query').withArgs("UPDATE balances SET balance = ? WHERE account_nr = ?", [2110, "1002"]).returns([{}]);
				mockDb.expects('query').withArgs("INSERT INTO transactions SET ?", { reference: sinon.match.any, amount: 110, account_nr: '1001' }).returns([{}]);
				mockDb.expects('query').withArgs("INSERT INTO transactions SET ?", { reference: sinon.match.any, amount: 110, account_nr: '1002' }).returns([{}]);
				mockDb.expects('commit').returns({})
				mockDb.expects('beginTransaction').returns({});
				
				return TransactionService.transfer({from: '1001', to: '1002', amount: 110}).then(()=> {
					return TransactionService.transfer({from: '1001', to: '1002', amount: 110}).catch(e => {
						assert.equal(e.message, 'This is a duplicate request. Please wait for 5 seconds to transfer again')
					})
				})
			})
			
			it('should do the transfer if the amount is different for consecutive requests', async() => {
				mockDb.expects('query').withArgs("SELECT balance FROM balances WHERE account_nr =1001").returns([{balance: 1000}]);
				mockDb.expects('query').withArgs("SELECT balance FROM balances WHERE account_nr =1002").returns([{balance: 2000}]);
				mockDb.expects('query').withArgs("UPDATE balances SET balance = ? WHERE account_nr = ?", [900, "1001"]).returns([{}]);
				mockDb.expects('query').withArgs("UPDATE balances SET balance = ? WHERE account_nr = ?", [2100, "1002"]).returns([{}]);
				mockDb.expects('query').withArgs("INSERT INTO transactions SET ?", { reference: sinon.match.any, amount: 100, account_nr: '1001' }).returns([{}]);
				mockDb.expects('query').withArgs("INSERT INTO transactions SET ?", { reference: sinon.match.any, amount: 100, account_nr: '1002' }).returns([{}]);
				mockDb.expects('commit').returns({})
				mockDb.expects('beginTransaction').returns({})
				mockDb.expects('query').withArgs("SELECT balance FROM balances WHERE account_nr =1001").returns([{balance: 900}]);
				mockDb.expects('query').withArgs("SELECT balance FROM balances WHERE account_nr =1002").returns([{balance: 2100}]);
				mockDb.expects('query').withArgs("UPDATE balances SET balance = ? WHERE account_nr = ?", [795, "1001"]).returns([{}]);
				mockDb.expects('query').withArgs("UPDATE balances SET balance = ? WHERE account_nr = ?", [2205, "1002"]).returns([{}]);
				mockDb.expects('query').withArgs("INSERT INTO transactions SET ?", { reference: sinon.match.any, amount: 105, account_nr: '1001' }).returns([{}]);
				mockDb.expects('query').withArgs("INSERT INTO transactions SET ?", { reference: sinon.match.any, amount: 105, account_nr: '1002' }).returns([{}]);
				mockDb.expects('commit').returns({})
				
				return TransactionService.transfer({from: '1001', to: '1002', amount: 100}).then(()=> {
					return TransactionService.transfer({from: '1001', to: '1002', amount: 105}).then(res => {
						assert.equal(res.transferred, 105)
						assert.deepEqual(res.from, { id: '1001', balance: 795 })
						assert.deepEqual(res.to, { id: '1002', balance: 2205 })
					})
				})
			})
			
			
			
			////////////////////////////test for verifying transfer ends here///////////////////////
		})
	
	})
})