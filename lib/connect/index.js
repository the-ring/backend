'use strict';

const co = require('co');
const router = require('express').Router();

const config = require('../config');
const api = config.api;
const db = require('../db');
const helpers = require('../helpers');

const parseState = helpers.parseState;
const getGoogleToken = helpers.getGoogleToken;
const getYandexToken = helpers.getYandexToken;

router.get('/yandex', (req, res) => {
  const state = req.query.state;
  res.redirect(`https://oauth.yandex.ru/authorize?response_type=code&client_id=${api.yandex.clientId}&state=${state}&force_confirm=true`);
});

router.get('/google', (req, res) => {
  const state = req.query.state;
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${api.google.clientId}&redirect_uri=${config.backend.url}${config.backend.redirectGoogle}&scope=https://www.googleapis.com/auth/analytics.readonly&state=${state}&access_type=offline&prompt=consent`);
});

router.get('/yandex/token', (req, res) => {
  co(function* () {
    const code = req.query.code;
    let state = req.query.state;
    if (state) {
      state = parseState(state);
      const userId = state[0];
      const url = state[1];
      if (code) {
        if (userId && url) {
          const user = yield db.get(userId, 'userId');
          if (user) {
            const y = (yield getYandexToken(code)).body;
            yield db.set(`${userId}:connect.yandex`, {
              token: y.access_token,
              expires: y.expires_in
            });
            yield db.set(userId, 'yandex', 'true');
            return res.redirect(`${url}?yandex=true`);
          }
        }
      }

      return res.redirect(`${url}?yandex=false`);
    }

    res.api(500, 'Something went wrong');
  }).catch(e => {
    res.api(500, e);
  });
});

router.get('/google/token', (req, res) => {
  co(function* () {
    const code = req.query.code;
    let state = req.query.state;
    if (state) {
      state = parseState(state);
      const userId = state[0];
      const url = state[1];
      if (code) {
        if (userId && url) {
          const user = yield db.get(userId, 'userId');
          if (user) {
            const g = (yield getGoogleToken(code)).body;
            yield db.set(`${userId}:connect.google`, {
              token: g.access_token,
              expires: g.expires_in
            });
            db.expire(`${userId}:connect.google`, g.expires_in - 1);
            yield db.set(userId, { google: 'true', 'google.refresh': g.refresh_token });
            return res.redirect(`${url}?google=true`);
          }
        }
      }

      return res.redirect(`${url}?google=false`);
    }

    res.api(500, 'Something went wrong');
  }).catch(e => {
    res.api(500, e);
  });
});

module.exports = router;
