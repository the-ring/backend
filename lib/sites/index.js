'use strict';

const co = require('co');
const router = require('express').Router();

const db = require('../db');

router.get('/', (req, res) => {
  co(function* () {
    let sites = yield db.get(req.userId, 'sites');
    sites = sites ? JSON.parse(sites) : {};
    res.api(200, sites);
  }).catch(e => {
    res.api(500, e);
  });
});

router.post('/', (req, res) => {
  co(function* () {
    const id = req.body.id;
    const title = req.body.title;
    const url = req.body.url;
    const google = req.body.google;
    const yandex = req.body.yandex;
    if (id && title && url && google && yandex) {
      let counters = yield db.get(req.userId, 'counters');
      counters = JSON.parse(counters);
      let sites = yield db.get(req.userId, 'sites');
      sites = sites ? JSON.parse(sites) : {};
      sites[id] = Object.assign({}, sites[id], req.body);
      counters.google[sites[id].google].used = true;
      counters.yandex[sites[id].yandex].used = true;
      yield db.set(req.userId, 'counters', JSON.stringify(counters));
      yield db.set(req.userId, 'sites', JSON.stringify(sites));
      return res.api(200, sites[id]);
    }

    res.api(400, 'One of the properties is missed');
  }).catch(e => {
    res.api(500, e);
  });
});

module.exports = router;
