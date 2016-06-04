'use strict';

const co = require('co');
const yarl = require('yarl');

const db = require('../db');
const config = require('../config');

const api = config.api;

const get = yarl.get;
const post = yarl.post;

module.exports.parseState = function parseState(state) {
  return new Buffer(state, 'base64').toString().split('|');
};

module.exports.checkingAuth = function checkingAuth(whitelist) {
  const paths = [
    '/ping',
    '/auth/registration',
    '/auth/login',
    '/connect/yandex',
    '/connect/google',
    '/connect/yandex/token',
    '/connect/google/token'
  ].concat(whitelist || []);
  return (req, res, next) => {
    co(function* () {
      const pathname = req._parsedUrl.pathname;
      if (paths.indexOf(pathname) !== -1) {
        return next();
      }

      const userId = req.get('X-User-Id') || req.query.userId || req.body.userId;
      const authToken = req.get('X-Auth-Token') || req.query.authToken || req.body.authToken;
      if (userId && authToken) {
        const user = yield db.get(userId, 'userId');
        let tokens = yield db.get(userId, 'tokens');
        if (user && tokens) {
          tokens = JSON.parse(tokens);
          const index = tokens.indexOf(authToken);
          if (index !== -1) {
            req.userId = userId;
            req.authToken = authToken;
            return next();
          }
        }
      }

      res.api(403, 'Wrong userId and/or authToken');
    }).catch(e => {
      res.api(500, e);
    });
  };
};

module.exports.getYandexToken = function getYandexToken(code) {
  return post(api.yandex.oauth, {
    body: {
      grant_type: 'authorization_code',
      code,
      client_id: api.yandex.clientId,
      client_secret: api.yandex.clientSecret
    },
    json: true
  });
};

module.exports.getGoogleToken = function getGoogleToken(code) {
  return post(api.google.oauth, {
    body: {
      grant_type: 'authorization_code',
      code,
      client_id: api.google.clientId,
      client_secret: api.google.clientSecret,
      redirect_uri: `${config.backend.url}${config.backend.redirectGoogle}`
    },
    json: true
  });
};

function getGoogleRefreshToken(refresh) {
  return post(api.google.oauth, {
    body: {
      grant_type: 'refresh_token',
      client_id: api.google.clientId,
      client_secret: api.google.clientSecret,
      refresh_token: refresh
    },
    json: true
  });
}

module.exports.revalidateGoogle = function* revalidateGoogle(userId) {
  return yield co(function* () {
    const refresh = yield db.get(userId, 'google.refresh');
    const g = (yield getGoogleRefreshToken(refresh)).body;
    yield db.set(`${userId}:connect.google`, {
      token: g.access_token,
      expires: g.expires_in
    });
    db.expire(`${userId}:connect.google`, g.expires_in - 1);
    return g.access_token;
  });
};

module.exports.getGoogleSummaries = function getGoogleSummaries(token) {
  return get(`${api.google.url}/analytics/v3/management/accountSummaries`, {
    query: {
      oauth_token: token
    },
    json: true
  });
};

module.exports.getYandexSummaries = function getYandexSummaries(token) {
  return get(`${api.yandex.url}/management/v1/counters`, {
    query: {
      oauth_token: token
    },
    json: true
  });
};

module.exports.getGoogleQuery = function getGoogleQuery(query) {
  return get(`${api.google.url}/analytics/v3/data/ga`, {
    query,
    json: true
  });
};

module.exports.getYandexQuery = function getYandexQuery(query) {
  return get(`${api.yandex.url}/analytics/v3/data/ga`, {
    query,
    json: true
  });
};
