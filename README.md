# Bank Transactions

Rewriting the '/transfer' api in NodeJS to facilitate transfer of money between two accounts


## Prerequisites

  - NodeJS 10.13.0
  - mySQL
  - Docker, docker-compose


## Installing

  Execute the commands in the following order for local setup

     - git clone https://github.com/tinaoct1/bank-transactions.git
     - cd bank-transactions
     - setup mysql with config specified in .env and create a database called bank_transactions
     - mysql -u root -ppassword bank_transactions < sample_data_dump.sql (This is to setup the sample data)
     - node app.js

     - Call http://localhost:3000/transfer with headers: {content-type: application/json}
       and body: {"from": "456","to": "123","amount": 2.5}


  For docker setup
     - docker-compose up (at root level)
     - Call http://localhost:8080/transfer with headers: {content-type: application/json}
          and body: {"from": "456","to": "123","amount": 2.5}

## Running the tests

    npm test
