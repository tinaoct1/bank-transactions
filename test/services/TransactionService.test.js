process.env.NODE_ENV = 'test';

const TransactionService = require('../../services/TransactionService')
const assert = require('assert')
const sinon = require('sinon')

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

describe('TransactionService', () => {
	describe('#transfer', () => {
		////////////////////////////Test for verifying params///////////////////////////
		it('should throw an error if params are invalid is not present', async () => {
			return TransactionService.transfer({}).catch(e => {
				assert.equal(e.message, 'This is not a valid request')
			})
		})
		
		it('should throw an error if params are invalid is not present', async () => {
			return TransactionService.transfer({from: '123'}).catch(e => {
				assert.equal(e.message, 'This is not a valid request')
			})
		})
		
		it('should throw an error if params are invalid is not present', async () => {
			return TransactionService.transfer({to: '123'}).catch(e => {
				assert.equal(e.message, 'This is not a valid request')
			})
		})
		
		it('should throw an error if params are invalid is not present', async () => {
			return TransactionService.transfer({amount: 123}).catch(e => {
				assert.equal(e.message, 'This is not a valid request')
			})
		})
		
		it('should throw an error if params are invalid is not present', async () => {
			return TransactionService.transfer({from:123, to:123}).catch(e => {
				assert.equal(e.message, 'This is not a valid request')
			})
		})
		
		it('should throw an error if params are invalid is not present', async () => {
			return TransactionService.transfer({from:123, to:123, amount: 10}).catch(e => {
				assert.equal(e.message, 'You cannot transfer to yourself')
			})
		})
		
		it('should throw an error if params are invalid is not present', async () => {
			return TransactionService.transfer({from:123, to:456, amount: 0}).catch(e => {
				assert.equal(e.message, 'This is not a valid request')
			})
		})
		
		
		it('should throw an error if params are invalid is not present', async () => {
			return TransactionService.transfer({from:123, to:456, amount: "0"}).catch(e => {
				assert.equal(e.message, 'You cannot transfer this amount')
			})
		})
		////////////////////////////test for verifying params end here///////////////////////////
		
		///////////////////////////////test for verifying transfer///////////////////////////////
		
		it('should throw an error if from is not found in the database', async () => {
			mockDb.expects('query').withArgs("SELECT balance FROM balances WHERE account_nr =1001").returns([]);
			mockDb.expects('query').withArgs("SELECT balance FROM balances WHERE account_nr =1002").returns([]);
			return TransactionService.transfer({from:'1001', to:'1002', amount: 10}).catch(e => {
				assert.equal(e.message, 'Invalid sender account number')
			})
		})
		
		it('should throw an error if to is not found in the database', async () => {
			mockDb.expects('query').withArgs("SELECT balance FROM balances WHERE account_nr =1001").returns([{balance: 1000}]);
			mockDb.expects('query').withArgs("SELECT balance FROM balances WHERE account_nr =1002").returns([]);
			return TransactionService.transfer({from:'1001', to:'1002', amount: 10}).catch(e => {
				assert.equal(e.message, 'Invalid receiver account number')
			})
		})
		
		it('should throw an error if balance is not sufficient', async () => {
			mockDb.expects('query').withArgs("SELECT balance FROM balances WHERE account_nr =1001").returns([{balance: 10}]);
			mockDb.expects('query').withArgs("SELECT balance FROM balances WHERE account_nr =1002").returns([{balance: 20}]);
			return TransactionService.transfer({from:'1001', to:'1002', amount: 100}).catch(e => {
				assert.equal(e.message, 'You have insufficient balance to perform this action')
			})
		})
		
		describe('when everything goes well', () => {
			let queryStub
			
			beforeEach(() => {
				queryStub = sinon.stub(require('../../db'), 'query')
			})
			
			afterEach(() => {
				queryStub.restore()
			})
			
			it.skip('should throw an error if balance is not sufficient', async () => {
				mockDb.expects('query').withArgs("SELECT balance FROM balances WHERE account_nr =1001").returns([{balance: 10}]);
				mockDb.expects('query').withArgs("SELECT balance FROM balances WHERE account_nr =1002").returns([{balance: 20}]);
				return TransactionService.transfer({from:'1001', to:'1002', amount: 100}).catch(e => {
					assert.equal(e.message, 'You have insufficient balance to perform this action')
				})
			})
		})
		
		
		////////////////////////////test for verifying transfer ends here///////////////////////
	})
})