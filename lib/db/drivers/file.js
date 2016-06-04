'use strict';

const fs = require('fs');
const writeFile = require('write-file-atomic');
const crypto = require('crypto');

function isObject(val) {
  return Object.prototype.toString.call(val) === '[object Object]';
}

class FileStorage {
  constructor(options) {
    Object.assign(this, options);
  }

  _readData(file) {
    return new Promise(resolve => {
      const hash = crypto.createHash('sha512').update(this.prefix + file).digest('hex');
      fs.readFile(this.path + hash, 'utf8', (err, data) => {
        if (err) {
          return resolve(null);
        }

        return resolve(data);
      });
    }).then(JSON.parse);
  }

  _writeData(file, data) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha512').update(this.prefix + file).digest('hex');
      writeFile(this.path + hash, JSON.stringify(data), err => {
        if (err) {
          return reject(err);
        }

        return resolve('OK');
      });
    });
  }

  flushdb() {
    return new Promise((resolve, reject) => {
      fs.readdir(this.path, (err, files) => {
        if (err) {
          return reject(err);
        }

        for (const file of files) {
          fs.unlink(this.path + file, err => {
            if (err) {
              return reject(err);
            }
          });
        }

        return resolve('OK');
      });
    });
  }

  get(key, field) {
    return this._readData(key).then(file => {
      if (file) {
        if (field !== undefined) {
          return file[field] || null;
        }
        return file;
      }

      return null;
    });
  }

  hgetall() {
    return this.get.apply(this, arguments);
  }

  set(key, field, value) {
    if (typeof field === 'string' && value === undefined) {
      return this._writeData(key, field);
    }
    return this._readData(key).then(file => {
      if (isObject(field)) {
        file = Object.assign({}, file, field);
      } else {
        file = Object.assign({}, file, { [field]: value });
      }

      return this._writeData(key, file);
    });
  }

  del(key) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha512').update(this.prefix + key).digest('hex');
      fs.unlink(this.path + hash, err => {
        if (err) {
          return reject(err);
        }

        return resolve('OK');
      });
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
  return new FileStorage(config);
};
