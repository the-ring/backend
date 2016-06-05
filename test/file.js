'use strict';

/* eslint-disable */

const fs = require('fs');
const co = require('co');
const moment = require('moment');
const should = require('should/as-function');
const yarl = require('yarl');

const dbType = 'file';
const port = 1490;
const yandexClientId = process.env.DEMO_YANDEX_CLIENT_ID;
const yandexSecret = process.env.DEMO_YANDEX_SECRET;
const googleClientId = process.env.DEMO_GOOGLE_CLIENT_ID;
const googleSecret = process.env.DEMO_GOOGLE_SECRET;

function clearCache() {
  delete require.cache[require.resolve('../lib/auth')];
  delete require.cache[require.resolve('../lib/connect')];
  delete require.cache[require.resolve('../lib/db')];
  delete require.cache[require.resolve('../lib/helpers')];
  delete require.cache[require.resolve('../lib/report')];
  delete require.cache[require.resolve('../lib/site')];
  delete require.cache[require.resolve('../lib/sites')];
  delete require.cache[require.resolve('../lib/user')];
  delete require.cache[require.resolve('../lib/config')];
  delete require.cache[require.resolve('../config')];
  delete require.cache[require.resolve('../')];
}

const config = `module.exports = {
  api: {
    yandex: {
      clientId: '${yandexClientId}',
      clientSecret: '${yandexSecret}'
    },
    google: {
      clientId: '${googleClientId}',
      clientSecret: '${googleSecret}'
    },
  },
  cache: {
    period: 18e5
  },
  backend: {
    port: ${port}
  },
  db: {
    type: '${dbType}'
  }
};`;

let db;

let user = {};
let headers = {};

const yandexToken = process.env.DEMO_YANDEX_TOKEN;
const googleRefreshToken = process.env.DEMO_GOOGLE_TOKEN;

const siteId = process.env.DEMO_SITE_ID;
const googleCounter = process.env.DEMO_GOOGLE_COUNTER;
const yandexCounter = process.env.DEMO_YANDEX_COUNTER;

describe('The Ring - file storage', function () {
  this.timeout(20000);
  before(() => {
    fs.writeFileSync(`${__dirname}/../config.js`, config);
    clearCache();
    db = require('../lib/db');

    require('../');
    return db.flushdb();
  });

  describe('/', () => {
    describe('get /ping', () => {
      it('should be Ok', () => {
        return yarl.get(`localhost:${port}/ping`, { json: true }).then(res => {
          const data = res.body.data;
          should(data).be.eql('Pong');
        });
      });
    });
  });

  describe('/auth', () => {
    describe('post /auth/registration', () => {
      it('should be Ok', () => {
        return yarl.post(`localhost:${port}/auth/registration`, { body: { login: 'demo@thering.co', password: '123456', rePassword: '123456' }, json: true }).then(res => {
          const data = res.body.data;
          should(data).be.eql('Ok');
        });
      });

      it('should fail', () => {
        return yarl.post(`localhost:${port}/auth/registration`, { body: { }, json: true }).catch(e => {
          const data = JSON.parse(e.response.body);
          should(data.error).be.eql('Login and password is required');
        });
      });

      it('should fail', () => {
        return yarl.post(`localhost:${port}/auth/registration`, { body: { password: '123456' }, json: true }).catch(e => {
          const data = JSON.parse(e.response.body);
          should(data.error).be.eql('Login and password is required');
        });
      });

      it('should fail', () => {
        return yarl.post(`localhost:${port}/auth/registration`, { body: { login: 'demo@thering.co' }, json: true }).catch(e => {
          const data = JSON.parse(e.response.body);
          should(data.error).be.eql('Login and password is required');
        });
      });
    });

    describe('post /auth/login', () => {
      it('should be Ok', () => {
        return yarl.post(`localhost:${port}/auth/login`, { body: { login: 'demo@thering.co', password: '123456' }, json: true }).then(res => {
          const data = res.body.data;
          should(data).have.keys('userId', 'authToken');
          should(data.userId).not.be.empty();
          should(data.authToken).not.be.empty();
          user = data;
          headers = {
            'X-User-Id': user.userId,
            'X-Auth-Token': user.authToken,
          };
          return co(function* () {
            yield db.set(`${data.userId}:connect.yandex`, {
              token: yandexToken,
              expires: 0
            });
            yield db.set(data.userId, { yandex: 'true', google: 'true', 'google.refresh': googleRefreshToken });
          });
        });
      });

      it('should fail', () => {
        return yarl.post(`localhost:${port}/auth/login`, { body: { }, json: true }).catch(e => {
          const data = JSON.parse(e.response.body);
          should(data.error).be.eql('Wrong login and/or password');
        });
      });

      it('should fail', () => {
        return yarl.post(`localhost:${port}/auth/login`, { body: { password: '123456' }, json: true }).catch(e => {
          const data = JSON.parse(e.response.body);
          should(data.error).be.eql('Wrong login and/or password');
        });
      });

      it('should fail', () => {
        return yarl.post(`localhost:${port}/auth/login`, { body: { login: 'demo@thering.co' }, json: true }).catch(e => {
          const data = JSON.parse(e.response.body);
          should(data.error).be.eql('Wrong login and/or password');
        });
      });
    });

    describe('post /auth/logout', () => {
      it('should be Ok', () => {
        return yarl.post(`localhost:${port}/auth/logout`, { headers: JSON.parse(JSON.stringify(headers)), body: {}, json: true }).then(res => {
          const data = res.body.data;
          should(data).be.eql('Ok');
        });
      });
      after(() => {
        return yarl.post(`localhost:${port}/auth/login`, { body: { login: 'demo@thering.co', password: '123456' }, json: true }).then(res => {
          const data = res.body.data;
          user = data;
          headers = {
            'X-User-Id': user.userId,
            'X-Auth-Token': user.authToken,
          };
        });
      });
    });
  });

  describe('/user', () => {
    describe('get /user', () => {
      it('should be Ok', () => {
        return yarl.get(`localhost:${port}/user`, { headers: JSON.parse(JSON.stringify(headers)), json: true }).then(res => {
          const data = res.body.data;
          should(data).have.keys('login', 'google', 'image', 'name', 'yandex');
        });
      });
    });

    describe('put /user', () => {
      it('should be Ok', () => {
        return yarl.put(`localhost:${port}/user`, { headers: JSON.parse(JSON.stringify(headers)), body: { login: 'demo@thering.co', name: 'Demo' }, json: true }).then(res => {
          const data = res.body.data;
          should(data).have.keys('login', 'google', 'image', 'name', 'yandex');
        });
      });
    });

    describe('get /user/counters', () => {
      it('should be Ok', () => {
        return yarl.get(`localhost:${port}/user/counters`, { headers: JSON.parse(JSON.stringify(headers)), json: true }).then(res => {
          const data = res.body.data;
          should(data).have.keys('google', 'yandex');
          should(data.google).not.be.empty();
          should(data.yandex).not.be.empty();
        });
      });
    });
  });

  describe('/sites', () => {
    describe('get /sites', () => {
      it('should be Ok', () => {
        return yarl.get(`localhost:${port}/sites`, { headers: JSON.parse(JSON.stringify(headers)), json: true }).then(res => {
          const data = res.body.data;
          should(data).be.empty();
        });
      });

      it('should be Ok', () => {
        const body = {
          id: siteId,
          title: 'Demo',
          url: 'http://example.com',
          google: googleCounter,
          yandex: yandexCounter
        };
        return yarl.post(`localhost:${port}/sites`, { headers: JSON.parse(JSON.stringify(headers)), body, json: true }).then(res => {
          return yarl.get(`localhost:${port}/sites`, { headers: JSON.parse(JSON.stringify(headers)), json: true }).then(res => {
            const data = res.body.data;
            should(data).not.be.empty();
          });
        });
      });
    });

    describe('post /sites', () => {
      it('should be Ok', () => {
        const body = {
          id: siteId + 2,
          title: 'Demo',
          url: 'http://example.com',
          google: googleCounter,
          yandex: yandexCounter
        };

        return yarl.post(`localhost:${port}/sites`, { headers: JSON.parse(JSON.stringify(headers)), body, json: true }).then(res => {
          const data = res.body.data;
          should(data).have.keys('id', 'title', 'url', 'google', 'yandex');
        });
      });

      it('should fail', () => {
        return yarl.post(`localhost:${port}/sites`, { headers: JSON.parse(JSON.stringify(headers)), body: {}, json: true }).catch(e => {
          const data = JSON.parse(e.response.body);
          should(data.error).be.eql('One of the properties is missed');
        });
      });
    });
  });

  describe('/site', () => {
    describe('get /site/:id', () => {
      it('should be Ok', () => {
        return yarl.get(`localhost:${port}/site/${siteId}`, { headers: JSON.parse(JSON.stringify(headers)), json: true }).then(res => {
          const data = res.body.data;
          should(data).have.keys('id', 'title', 'url', 'google', 'yandex');
        });
      });

      it('should fail', () => {
        return yarl.get(`localhost:${port}/site`, { headers: JSON.parse(JSON.stringify(headers)), json: true }).catch(e => {
          const data = JSON.parse(e.response.body);
          should(data.error).be.eql('Not Found');
        });
      });

      it('should fail', () => {
        return yarl.get(`localhost:${port}/site/1`, { headers: JSON.parse(JSON.stringify(headers)), json: true }).catch(e => {
          const data = JSON.parse(e.response.body);
          should(data.error).be.eql(`Site with '1' id doesn't exist`);
        });
      });
    });

    describe('put /site/:id', () => {
      it('should be Ok', () => {
        const body = {
          id: siteId + 1,
          title: 'Demo 1'
        };

        return yarl.put(`localhost:${port}/site/${siteId + 2}`, { headers: JSON.parse(JSON.stringify(headers)), body, json: true }).then(res => {
          const data = res.body.data;
          should(data).have.keys('id', 'title', 'url', 'google', 'yandex');
        });
      });

      it('should fail', () => {
        return yarl.put(`localhost:${port}/site`, { headers: JSON.parse(JSON.stringify(headers)), body: {}, json: true }).catch(e => {
          const data = JSON.parse(e.response.body);
          should(data.error).be.eql('Not Found');
        });
      });

      it('should fail', () => {
        return yarl.put(`localhost:${port}/site/1`, { headers: JSON.parse(JSON.stringify(headers)), body: { id: 1 }, json: true }).catch(e => {
          const data = JSON.parse(e.response.body);
          should(data.error).be.eql(`Site with '1' id doesn't exist`);
        });
      });
    });

    describe('delete /site/:id', () => {
      it('should be Ok', () => {
        return yarl.delete(`localhost:${port}/site/${siteId}1`, { headers: JSON.parse(JSON.stringify(headers)), body: {}, json: true }).then(res => {
          const data = res.body.data;
          should(data).be.eql('Ok');
        });
      });

      it('should fail', () => {
        return yarl.delete(`localhost:${port}/site`, { headers: JSON.parse(JSON.stringify(headers)), body: {}, json: true }).catch(e => {
          const data = JSON.parse(e.response.body);
          should(data.error).be.eql('Not Found');
        });
      });

      it('should fail', () => {
        return yarl.delete(`localhost:${port}/site/1`, { headers: JSON.parse(JSON.stringify(headers)), body: {}, json: true }).catch(e => {
          const data = JSON.parse(e.response.body);
          should(data.error).be.eql(`Site with '1' id doesn't exist`);
        });
      });
    });

    describe('widgets', () => {
      describe('get /site/:id/views', () => {
        it('should be Ok', () => {
          return yarl.get(`localhost:${port}/site/${siteId}/views`, { headers: JSON.parse(JSON.stringify(headers)), json: true }).then(res => {
            const data = res.body.data;
            should(data).have.keys('google', 'yandex', 'median');
            should(data.google).not.be.empty();
            should(data.yandex).not.be.empty();
            should(data.median).not.be.empty();
          });
        });
      });
      describe('get /site/:id/users', () => {
        it('should be Ok', () => {
          return yarl.get(`localhost:${port}/site/${siteId}/users`, { headers: JSON.parse(JSON.stringify(headers)), json: true }).then(res => {
            const data = res.body.data;
            should(data).have.keys('google', 'yandex', 'median');
            should(data.google).not.be.empty();
            should(data.yandex).not.be.empty();
            should(data.median).not.be.empty();
          });
        });
      });
      describe('get /site/:id/device', () => {
        it('should be Ok', () => {
          return yarl.get(`localhost:${port}/site/${siteId}/device`, { headers: JSON.parse(JSON.stringify(headers)), json: true }).then(res => {
            const data = res.body.data;
            should(data).have.keys('google', 'yandex', 'median');
            should(data.google).not.be.empty();
            should(data.yandex).not.be.empty();
            should(data.median).not.be.empty();
          });
        });
      });
      describe('get /site/:id/bounce', () => {
        it('should be Ok', () => {
          return yarl.get(`localhost:${port}/site/${siteId}/bounce`, { headers: JSON.parse(JSON.stringify(headers)), json: true }).then(res => {
            const data = res.body.data;
            should(data).have.keys('google', 'yandex', 'median');
            should(data.google).not.be.empty();
            should(data.yandex).not.be.empty();
            should(data.median).not.be.empty();
          });
        });
      });
      describe('get /site/:id/pageDepth', () => {
        it('should be Ok', () => {
          return yarl.get(`localhost:${port}/site/${siteId}/pageDepth`, { headers: JSON.parse(JSON.stringify(headers)), json: true }).then(res => {
            const data = res.body.data;
            should(data).have.keys('google', 'yandex', 'median');
            should(data.google).not.be.empty();
            should(data.yandex).not.be.empty();
            should(data.median).not.be.empty();
          });
        });
      });
    });
  });

  describe('/report', () => {
    describe('post /report', () => {
      it('should be Ok', () => {
        const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWCAYAAAA8AXHiAAACoUlEQVR4Xu3SMQ0AAAzDsJU/6aHI5wLoEXlnCgQFFny6VODAgiApAFaS1SlYDCQFwEqyOgWLgaQAWElWp2AxkBQAK8nqFCwGkgJgJVmdgsVAUgCsJKtTsBhICoCVZHUKFgNJAbCSrE7BYiApAFaS1SlYDCQFwEqyOgWLgaQAWElWp2AxkBQAK8nqFCwGkgJgJVmdgsVAUgCsJKtTsBhICoCVZHUKFgNJAbCSrE7BYiApAFaS1SlYDCQFwEqyOgWLgaQAWElWp2AxkBQAK8nqFCwGkgJgJVmdgsVAUgCsJKtTsBhICoCVZHUKFgNJAbCSrE7BYiApAFaS1SlYDCQFwEqyOgWLgaQAWElWp2AxkBQAK8nqFCwGkgJgJVmdgsVAUgCsJKtTsBhICoCVZHUKFgNJAbCSrE7BYiApAFaS1SlYDCQFwEqyOgWLgaQAWElWp2AxkBQAK8nqFCwGkgJgJVmdgsVAUgCsJKtTsBhICoCVZHUKFgNJAbCSrE7BYiApAFaS1SlYDCQFwEqyOgWLgaQAWElWp2AxkBQAK8nqFCwGkgJgJVmdgsVAUgCsJKtTsBhICoCVZHUKFgNJAbCSrE7BYiApAFaS1SlYDCQFwEqyOgWLgaQAWElWp2AxkBQAK8nqFCwGkgJgJVmdgsVAUgCsJKtTsBhICoCVZHUKFgNJAbCSrE7BYiApAFaS1SlYDCQFwEqyOgWLgaQAWElWp2AxkBQAK8nqFCwGkgJgJVmdgsVAUgCsJKtTsBhICoCVZHUKFgNJAbCSrE7BYiApAFaS1SlYDCQFwEqyOgWLgaQAWElWp2AxkBQAK8nqFCwGkgJgJVmdgsVAUgCsJKtTsBhICoCVZHUKFgNJAbCSrE7BYiApAFaS1SlYDCQFwEqyOn1BggCXptKxUAAAAABJRU5ErkJggg==';

        const body = {
          header: JSON.stringify(['Date', ['Google', 'Yandex', 'Median']]),
          data: JSON.stringify([[moment('20160603', 'YYYYMMDD').format('LL'), [2, 2, 2]]]),
          image
        };

        return yarl.post(`localhost:${port}/report`, { headers: JSON.parse(JSON.stringify(headers)), body, buffer: true }).then(res => {
          should(res.body).not.be.empty();
          should(Buffer.isBuffer(res.body)).be.true();
        });
      });
    });
  });

  after(() => {
    return db.flushdb();
  });
});
