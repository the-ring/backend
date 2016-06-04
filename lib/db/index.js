'use strict';

const db = require('../config').db;

let driver;

/* eslint-disable global-require */
try {
  driver = require(`./drivers/${db.type}`)(db[db.type]);
} catch (e) {
  driver = require('./drivers/memory')(db.memory);
}

module.exports = driver;
