'use strict';

var Bluebird = require('bluebird');
var _ = require('lodash');

class MemoryDatabaseFromHell {

  constructor() {
    this.collections = {};
  }

  initialize() {
    return Bluebird.resolve();
  }

  close() {
  }

  findAll(collectionName, criteria, options) {
    return Bluebird.try(() => {
      var documents = this._documentsFrom(collectionName);
      if (criteria) {
        var filtered = _.filter(documents, document => {
          return this._match(document, criteria);
        });
        return this._withFindOptionsApplied(filtered, options || {});
      }
      return documents;
    });
  }

  _withFindOptionsApplied(documents, options) {
    if (options.orderBy) {
      var order = options.orderBy.order || 'asc';
      return _.orderBy(documents, options.orderBy.key, order);
    }
    return documents;
  }

  findFirst(collectionName, criteria) {
    return this.findAll(collectionName, criteria).then(documents => {
      return _.first(documents);
    });
  }

  findNear() {
    // mock me please :)
    return Bluebird.resolve([]);
  }

  count(collectionName, criteria) {
    return this.findAll(collectionName, criteria).then(documents => {
      return documents.length;
    });
  }

  add(collectionName, document) {
    return Bluebird.try(() => {
      this.addDocument(collectionName, document);
      return {};
    });
  }

  updateFirst(collectionName, criteria, modification, options) {
    let _options = _.defaults(options || {}, {upsert: false});
    return this.findFirst(collectionName, criteria).then(foundDocument => {
      let document = foundDocument;
      if (!document) {
        if (!_options.upsert) {
          return;
        }
        document = _.clone(criteria);
        this.addDocument(collectionName, document);
      }
      if (modification.$set) {
        _.assign(document, modification.$set);
      }
      if (modification.$push) {
        _.forEach(_.keys(modification.$push), k => {
          let values = document[k] || [];
          values.push(modification.$push[k]);
          document[k] = values;
        });
      }
      if (modification.$pull) {
        _.forEach(_.keys(modification.$pull), k => {
          _.remove(document[k], v => _.isEqual(v, modification.$pull[k]));
        });
      }
    });
  }

  replaceFirst(collectionName, criteria, document, options) {
    let _options = _.defaults(options || {}, {upsert: false});
    return this.findFirst(collectionName, criteria).then(oldDocument => {
      if (oldDocument) {
        _.forOwn(oldDocument, (value, key) => {
          delete oldDocument[key];
        });
        _.assign(oldDocument, document);
      } else {
        if (_options.upsert) {
          return this.add(collectionName, document);
        }
      }
      return Bluebird.resolve();
    });
  }

  deleteFirst(collectionName, criteria) {
    return this.findFirst(collectionName, criteria).then(document => {
      this.collections[collectionName] = _.without(this._documentsFrom(collectionName), document);
    });
  }

  addDocument(collectionName, document) {
    if (!this.collections[collectionName]) {
      this.collections[collectionName] = [];
    }
    this._documentsFrom(collectionName).push(document);
  }

  _documentsFrom(collectionName) {
    return this.collections[collectionName] || [];
  }

  _match(document, criteria) {
    return !_.some(_.keys(criteria), key => {
      if (_.get(criteria, key) === null) {
        return this._isPresent(_.get(document, key));
      }
      if (_.isArray(_.get(document, key)) && !_.isArray(_.get(criteria, key))) {
        return !_.includes(_.get(document, key), _.get(criteria, key));
      }
      if (_.isObject(_.get(criteria, key)) && _.isObject(_.get(document, key))) {
        return !this._match(_.get(document, key), _.get(criteria, key));
      }
      if (_.get(criteria, key) !== _.get(document, key)) {
        return true;
      }
      return false;
    });
  }

  _isPresent(o) {
    return o !== null && !_.isUndefined(o);
  }
}

module.exports = MemoryDatabaseFromHell;
