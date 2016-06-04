'use strict';

const co = require('co');
const moment = require('moment');
const router = require('express').Router();

const config = require('../config');
const db = require('../db');
const helpers = require('../helpers');

const revalidateGoogle = helpers.revalidateGoogle;
const getGoogleQuery = helpers.getGoogleQuery;
const getYandexQuery = helpers.getYandexQuery;

function toObject(data, round) {
  const obj = {};
  for (let i = 0; i < data.length; i++) {
    const el = data[i];
    obj[el[0]] = round ? parseInt(el[1], 10) : parseFloat(parseFloat(el[1]).toFixed(2));
  }

  return obj;
}

function getData(req, res, metrics, options) {
  options = Object.assign({}, { dimensions: 'ga:date', sort: 'ga:date', round: false }, options);
  return co(function* () {
    const id = req.params.id;
    const force = req.query.force;
    if (id) {
      const monthly = req.params[0] === '/monthly';
      let sites = yield db.get(req.userId, 'sites');
      sites = sites ? JSON.parse(sites) : {};
      const site = sites[id];
      if (site) {
        const cache = yield db.hgetall(`${req.userId}:site.${id}.${metrics}.${monthly}`);
        let timestamp = Date.now();
        if (!force && cache && (timestamp - cache.timestamp < config.cache.period)) {
          return res.api(200, JSON.parse(cache.data), parseInt(cache.timestamp, 10));
        }

        let googleToken = yield db.get(`${req.userId}:connect.google`, 'token');
        const yandexToken = yield db.get(`${req.userId}:connect.yandex`, 'token');

        if (!googleToken) {
          googleToken = yield* revalidateGoogle(req.userId);
        }

        const start = monthly ?
          moment().subtract(1, 'months').format('YYYY-MM-DD') :
          moment().subtract(6, 'days').format('YYYY-MM-DD');
        const end = moment().format('YYYY-MM-DD');

        return co(function* () {
          let g = (yield getGoogleQuery({
            ids: site.google,
            'start-date': start,
            'end-date': end,
            metrics,
            dimensions: options.dimensions,
            sort: options.sort,
            oauth_token: googleToken,
            quotaUser: req.userId
          })).body.rows;
          let y = (yield getYandexQuery({
            ids: site.yandex,
            'start-date': start,
            'end-date': end,
            metrics,
            dimensions: options.dimensions,
            sort: options.sort,
            oauth_token: yandexToken,
            quotaUser: req.userId
          })).body.rows;

          g = toObject(g, options.round);
          y = toObject(y, options.round);
          const m = {};

          for (const key in g) {
            if (!y[key]) {
              y[key] = 0;
            }

            const _m = (g[key] + y[key]) / 2;
            m[key] = options.round ? Math.floor(_m) : parseFloat(_m.toFixed(2));
          }

          timestamp = Date.now();
          yield db.set(`${req.userId}:site.${id}.${metrics}.${monthly}`, {
            data: JSON.stringify({ google: g, yandex: y, median: m }),
            timestamp
          });
          db.expire(`${req.userId}:site.${id}.${metrics}.${monthly}`, config.cache.period / 1000);

          res.api(200, { google: g, yandex: y, median: m }, timestamp);
        });
      }

      return res.api(404, `Site with '${id}' id doesn't exist`);
    }

    res.api(400, 'Missed site id');
  }).catch(e => {
    res.api(500, e);
  });
}

router.get('/:id', (req, res) => {
  co(function* () {
    const id = req.params.id;
    if (id) {
      let sites = yield db.get(req.userId, 'sites');
      sites = sites ? JSON.parse(sites) : {};
      if (sites[id]) {
        return res.api(200, sites[id]);
      }

      return res.api(404, `Site with '${id}' id doesn't exist`);
    }

    res.api(400, 'Missed site id');
  }).catch(e => {
    res.api(500, e);
  });
});

router.put('/:id', (req, res) => {
  co(function* () {
    const id = req.params.id;
    const newId = req.body.id;
    if (id && newId) {
      let sites = yield db.get(req.userId, 'sites');
      sites = sites ? JSON.parse(sites) : {};
      if (sites[id]) {
        sites[newId] = Object.assign({}, sites[id], req.body);
        if (id !== newId) {
          delete sites[id];
        }
        yield db.set(req.userId, 'sites', JSON.stringify(sites));
        return res.api(200, sites[newId]);
      }

      return res.api(404, `Site with '${id}' id doesn't exist`);
    }

    res.api(400, 'Missed site id');
  }).catch(e => {
    res.api(500, e);
  });
});

router.delete('/:id', (req, res) => {
  co(function* () {
    const id = req.params.id;
    if (id) {
      let counters = yield db.get(req.userId, 'counters');
      counters = JSON.parse(counters);
      let sites = yield db.get(req.userId, 'sites');
      sites = sites ? JSON.parse(sites) : {};
      if (sites[id]) {
        counters.google[sites[id].google].used = false;
        counters.yandex[sites[id].yandex].used = false;
        delete sites[id];
        yield db.set(req.userId, 'counters', JSON.stringify(counters));
        yield db.set(req.userId, 'sites', JSON.stringify(sites));
        return res.api(200, 'Ok');
      }

      return res.api(404, `Site with '${id}' id doesn't exist`);
    }

    res.api(400, 'Missed site id');
  }).catch(e => {
    res.api(500, e);
  });
});

// Widgets

router.get('/:id/views*', (req, res) => {
  getData(req, res, 'ga:pageviews', { round: true });
});

router.get('/:id/users*', (req, res) => {
  getData(req, res, 'ga:users', { round: true });
});

router.get('/:id/device*', (req, res) => {
  getData(req, res, 'ga:sessions', {
    dimensions: 'ga:deviceCategory',
    sort: 'ga:deviceCategory',
    round: true
  });
});

router.get('/:id/bounce*', (req, res) => {
  getData(req, res, 'ga:bounceRate');
});

router.get('/:id/pageDepth*', (req, res) => {
  getData(req, res, 'ga:pageviewsPerSession');
});

module.exports = router;
