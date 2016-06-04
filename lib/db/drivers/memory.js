'use strict';

function isObject(val) {
  return Object.prototype.toString.call(val) === '[object Object]';
}

class MemoryStorage {
  constructor(options) {
    Object.assign(this, options);
    this.storage = {};
  }

  _readData() {
    return Promise.resolve(this.storage);
  }

  _writeData(data) {
    this.storage = data;
    return Promise.resolve('OK');
  }

  flushdb() {
    return this._writeData({});
  }

  get(key, field) {
    return this._readData().then(file => {
      if (file) {
        if (file[key]) {
          if (field !== undefined) {
            return file[key][field] || null;
          }
          return file[key];
        }
      }

      return null;
    });
  }

  hgetall() {
    return this.get.apply(this, arguments);
  }

  set(key, field, value) {
    return this._readData().then(file => {
      if (typeof field === 'string') {
        if (value !== undefined) {
          file[key] = Object.assign({}, file[key], { [field]: value });
        } else {
          file[key] = field;
        }
      } else if (isObject(field)) {
        file[key] = Object.assign({}, file[key], field);
      }

      return this._writeData(file);
    });
  }

  del(key) {
    return this._readData().then(file => {
      if (file[key]) {
        delete file[key];
        return this._writeData(file);
      }

      return 'OK';
    });
  }

  expire(key, time) {
    setTimeout(() => {
      this.del(key);
    }, time * 1000);
    return Promise.resolve('OK');
  }
}

module.exports = function (config) {
  return new MemoryStorage(config);
};
