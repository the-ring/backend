'use strict';

const co = require('co');
const crypto = require('crypto');
const router = require('express').Router();

const config = require('../config');
const db = require('../db');
const helpers = require('../helpers');

const security = config.security;
const revalidateGoogle = helpers.revalidateGoogle;
const getGoogleSummaries = helpers.getGoogleSummaries;
const getYandexSummaries = helpers.getYandexSummaries;

router.get('/', (req, res) => {
  co(function* () {
    const login = yield db.get(req.userId, 'login');
    const name = yield db.get(req.userId, 'name');
    const image = yield db.get(req.userId, 'image');
    const yandex = yield db.get(req.userId, 'yandex');
    const google = yield db.get(req.userId, 'google');
    res.api(200, {
      login,
      name,
      image,
      yandex: yandex === 'true',
      google: google === 'true'
    });
  }).catch(e => {
    res.api(500, e);
  });
});

router.put('/', (req, res) => {
  co(function* () {
    const pass = security.password;
    const user = yield db.hgetall(req.userId);

    if (req.body.password) {
      if (req.body.password.length < pass.minLength) {
        return res.api(403, `Password should contain at least ${pass.minLength} characters`);
      }
      if (req.body.password !== req.body.rePassword) {
        return res.api(403, 'Password and re-entered password does not match');
      }
      user.salt = crypto.randomBytes(security.salt.size).toString('hex');
      user.password = crypto.pbkdf2Sync(
        req.body.password,
        user.salt,
        pass.iterations,
        pass.keylen,
        pass.digest
      ).toString('hex');
      yield db.set(req.userId, { salt: user.salt, password: user.password });
    }

    if (req.body.login !== user.login) {
      yield db.del(user.login);
      user.login = req.body.login || user.login;
      yield db.set(user.login, req.userId);
      yield db.set(req.userId, 'login', user.login);
    }

    user.name = req.body.name || user.name;
    const md5 = crypto.createHash('md5').update(user.login).digest('hex');
    user.image = `https://secure.gravatar.com/avatar/${md5}?d=retro`;
    user.google = req.body.google || user.google;
    user.yandex = req.body.yandex || user.yandex;

    yield db.set(req.userId, {
      name: user.name,
      image: user.image,
      google: !!user.google + '', yandex: !!user.yandex + '' // eslint-disable-line prefer-template
    });

    res.api(200, {
      login: user.login,
      name: user.name,
      image: user.image,
      yandex: user.yandex === 'true',
      google: user.google === 'true'
    });
  }).catch(e => {
    res.api(500, e);
  });
});

router.get('/counters', (req, res) => {
  co(function* () {
    let googleToken = yield db.get(`${req.userId}:connect.google`, 'token');
    const yandexToken = yield db.get(`${req.userId}:connect.yandex`, 'token');
    let counters = yield db.get(req.userId, 'counters');
    counters = counters ? JSON.parse(counters) : {};
    counters.google = counters.google || {};
    counters.yandex = counters.yandex || {};

    if (!googleToken) {
      googleToken = yield* revalidateGoogle(req.userId);
    }

    return co(function* () {
      const google = yield co(function* () {
        const g = (yield getGoogleSummaries(googleToken)).body.items;
        const output = {};
        g.forEach(n => {
          n.webProperties.forEach(n => {
            const counter = counters.google[`ga:${n.profiles[0].id}`] || {};
            output[`ga:${n.profiles[0].id}`] = {
              id: n.id,
              name: n.name,
              site: n.websiteUrl,
              ga: `ga:${n.profiles[0].id}`,
              used: !!counter.used
            };
          });
        });
        return output;
      });

      const yandex = yield co(function* () {
        const y = (yield getYandexSummaries(yandexToken)).body.counters;
        const output = {};
        y.forEach(n => {
          const counter = counters.yandex[`ga:${n.id}`] || {};
          output[`ga:${n.id}`] = {
            id: n.id,
            name: n.name,
            site: n.site,
            ga: `ga:${n.id}`,
            used: !!counter.used
          };
        });
        return output;
      });

      yield db.set(req.userId, 'counters', JSON.stringify({ google, yandex }));

      res.api(200, { google, yandex });
    });
  }).catch(e => {
    res.api(500, e);
  });
});

module.exports = router;
