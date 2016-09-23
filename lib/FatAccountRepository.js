'use strict';

const _ = require('lodash');

class FatAccountRepository {

  add(repository) {
  }

  update(repository) {
  }

  getById(id) {
  }

  findAll() {
  }

  findTransactionsByAccountId(accountId) {
  }

  findTransactionsByAccountIdAndDates(accountId, beginningDate, endingDate) {
  }

  findTransactionsByAccountIdAndCategory(accountId, category) {
  }

  findTransactions(criteria) {
  }
}

class MemoryFatAccountRepository {

  constructor() {
    this._accounts = [];
  }

  add(account) {
    this._accounts.push(account);
  }

  getById(id) {
    return _.find(this._accounts, a => a.id === id);
  }

  findTransactions(criteria) {
    // ?
  }
}

module.exports = FatAccountRepository;
