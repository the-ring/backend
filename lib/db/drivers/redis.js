'use strict';

const redis = require('redis');

function isObject(val) {
  return Object.prototype.toString.call(val) === '[object Object]';
}

class RedisStorage {
  constructor(options) {
    Object.assign(this, options);

    this._client = redis.createClient(this.port, this.host, options);
  }

  _send() {
    return new Promise((resolve, reject) => {
      const cb = (err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve(res);
      };

      const command = arguments[0];
      if (arguments.length === 1) {
        this._client[command](cb);
      } else if (arguments.length === 2) {
        this._client[command](arguments[1], cb);
      } else if (arguments.length === 3) {
        this._client[command](arguments[1], arguments[2], cb);
      } else if (arguments.length === 4) {
        this._client[command](arguments[1], arguments[2], arguments[3], cb);
      }
    });
  }

  flushdb() {
    return this._send('flushdb');
  }

  get(key, field) {
    if (field !== undefined) {
      return this._send('hget', key, field);
    }
    return this._send('get', key);
  }

  hgetall(key) {
    return this._send('hgetall', key);
  }

  set(key, field, value) {
    if (typeof field === 'string') {
      if (value !== undefined) {
        return this._send('hset', key, field, value);
      }

      return this._send('set', key, field);
    } else if (isObject(field)) {
      return this._send('hmset', key, field);
    }
  }

  del(key) {
    return this._send('del', key);
  }

  expire(key, time) {
    return this._send('expire', key, time);
  }
}

module.exports = function (config) {
  return new RedisStorage(config);
};
