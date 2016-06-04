'use strict';

const co = require('co');
const crypto = require('crypto');
const uuid = require('uuid');
const router = require('express').Router();

const security = require('../config').security;
const db = require('../db');

router.post('/registration', (req, res) => {
  co(function* () {
    if (!req.body.login || !req.body.password || !req.body.rePassword) {
      return res.api(403, 'Login and password is required');
    }
    const pass = security.password;
    if (req.body.password.length < pass.minLength) {
      return res.api(403, `Password should contain at least ${pass.minLength} characters`);
    }
    if (req.body.password !== req.body.rePassword) {
      return res.api(403, 'Password and re-entered password does not match');
    }
    const salt = crypto.randomBytes(security.salt.size).toString('hex');
    const userId = uuid.v4();
    const password = crypto.pbkdf2Sync(
      req.body.password,
      salt,
      pass.iterations,
      pass.keylen,
      pass.digest
    ).toString('hex');
    const data = { login: req.body.login, salt, password, userId, tokens: JSON.stringify([]) };
    const setLogin = yield db.set(req.body.login, userId);
    if (setLogin === 'OK') {
      const setUser = yield db.set(userId, data);
      if (setUser === 'OK') {
        return res.api(200, 'Ok');
      }
    }

    res.api(500, 'Something went wrong');
  }).catch(e => {
    res.api(500, e);
  });
});

router.post('/login', (req, res) => {
  co(function* () {
    const login = req.body.login;
    const password = req.body.password;
    if (login && password) {
      const userId = yield db.get(login);
      if (userId) {
        const user = yield db.hgetall(userId);
        if (user) {
          const pass = security.password;
          const hash = crypto.pbkdf2Sync(
            password,
            user.salt,
            pass.iterations,
            pass.keylen,
            pass.digest
          ).toString('hex');
          if (hash === user.password) {
            const tokens = JSON.parse(user.tokens);
            const authToken = crypto.randomBytes(security.authToken.size).toString('hex');
            tokens.push(authToken);
            yield db.set(userId, 'tokens', JSON.stringify(tokens));
            return res.api(200, { userId, authToken });
          }
        }
      }
    }

    res.api(403, 'Wrong login and/or password');
  }).catch(e => {
    res.api(500, e);
  });
});

router.post('/logout', (req, res) => {
  co(function* () {
    const user = yield db.hgetall(req.userId);
    const tokens = JSON.parse(user.tokens);
    const index = tokens.indexOf(req.authToken);
    tokens.splice(index, 1);
    yield db.set(req.userId, 'tokens', JSON.stringify(tokens));
    res.api(200, 'Ok');
  }).catch(e => {
    res.api(500, e);
  });
});

module.exports = router;
