'use strict';

const deepAssign = require('deep-assign');
const defaultConfig = {
  api: {
    yandex: {
      oauth: 'https://oauth.yandex.ru/token',
      url: 'https://api-metrika.yandex.ru',
      clientId: '',
      clientSecret: ''
    },
    google: {
      oauth: 'https://www.googleapis.com/oauth2/v4/token',
      url: 'https://www.googleapis.com',
      clientId: '',
      clientSecret: ''
    }
  },
  security: {
    password: {
      iterations: 1e3, // 1000
      keylen: 256,
      digest: 'sha256',
      minLength: 6
    },
    salt: {
      size: 128
    },
    authToken: {
      size: 128
    }
  },
  cache: {
    period: 18e5 // 30 min
  },
  backend: {
    url: 'http://localhost:3000/',
    redirectGoogle: 'connect/google/token',
    redirectYandex: 'connect/yandex/token',
    port: 3000
  },
  tmp: {
    path: `${__dirname}/../tmp/`
  },
  db: {
    type: 'file',
    redis: {
      port: 6379,
      host: '127.0.0.1',
      prefix: 'the-ring:demo:'
    },
    file: {
      path: `${__dirname}/../tmp/db/`,
      prefix: 'the-ring:demo:'
    },
    memory: {
      prefix: 'the-ring:demo:'
    }
  }
};

let config;

try {
  // eslint-disable-next-line import/no-unresolved, global-require
  config = require('../config');
} catch (e) {
  config = {};
}

const finalConfig = deepAssign({}, defaultConfig, config);

if (!finalConfig.api.yandex.clientId) {
  throw new ReferenceError('Yandex clientId is required');
}

if (!finalConfig.api.yandex.clientSecret) {
  throw new ReferenceError('Yandex clientSecret is required');
}

if (!finalConfig.api.google.clientId) {
  throw new ReferenceError('Google clientId is required');
}

if (!finalConfig.api.google.clientSecret) {
  throw new ReferenceError('Google clientSecret is required');
}

module.exports = finalConfig;
