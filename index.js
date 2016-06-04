'use strict';

const API_VERSION = 1;

const app = require('express')();
const cors = require('cors');
const bodyParser = require('body-parser');

const helpers = require('./lib/helpers');

const auth = require('./lib/auth');
const connect = require('./lib/connect');
const user = require('./lib/user');
const sites = require('./lib/sites');
const site = require('./lib/site');
const report = require('./lib/report');

const config = require('./lib/config');

app.response.api = function (status, data, timestamp) {
  status = status || 200;
  timestamp = timestamp || Date.now();
  return status === 200 ?
    this.status(status).json({ status, data, timestamp, version: API_VERSION }) :
    this.status(status).json({
      status,
      error: data.message || data || 'Something went wrong',
      timestamp,
      version: API_VERSION
    });
};

app.use(cors({ origin: '*' }));
app.options('*', cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(helpers.checkingAuth());

app.get('/ping', (req, res) => {
  res.api(200, 'Pong');
});

app.use('/auth', auth);
app.use('/connect', connect);
app.use('/user', user);
app.use('/sites', sites);
app.use('/site', site);
app.use('/report', report);

app.use('*', (req, res) => {
  res.api(404, 'Not Found');
});

app.listen(config.backend.port);
