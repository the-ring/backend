<h1 align="center">
  <br>
  <img src="https://avatars1.githubusercontent.com/u/19213164?v=3&s=200" alt="The Ring" width="200">
  <br>
  The Ring - backend
  <br>
  <br>
</h1>

<h4 align="center">REST API server which will serve all requests from <a href="https://github.com/the-ring/frontend">frontend client</a> and <a href="https://github.com/the-ring/desktop">desktop app</a>.</h4>

<p align="center">
  <a href="https://travis-ci.org/the-ring/backend"><img src="https://travis-ci.org/the-ring/backend.svg" alt="Travis"></a>
  <a href="#"><img src="https://img.shields.io/badge/node-%3E%3D4.x.x-brightgreen.svg" alt="Node version"></a>
  <a href="https://github.com/the-ring/backend/releases"><img src="https://img.shields.io/github/tag/the-ring/backend.svg" alt="Release"></a>
  <a href="https://codeclimate.com/github/the-ring/backend/coverage"><img src="https://codeclimate.com/github/the-ring/backend/badges/coverage.svg" alt="Coverage"></a>
  <a href="ttps://www.bithound.io/github/the-ring/backend"><img src="https://www.bithound.io/github/the-ring/backend/badges/score.svg" alt="bitHound Score"></a>
</p>

**Attention! This project is in active development.**
***Please don't use it in production until the 1.0.0 release.***

## Install
```sh
$ git clone https://github.com/the-ring/backend.git
$ cd backend
$ npm install
```

## Usage

Before starting the server, you should specify following properties in `config.js` file:
```js
{
  api: {
    yandex: {
      clientId: '', // ID from https://oauth.yandex.ru/
      clientSecret: '' // Password from https://oauth.yandex.ru/
    },
    google: {
      clientId: '', // Client ID from https://console.developers.google.com
      clientSecret: '' // Client secret from https://console.developers.google.com
    }
  }
}
```

When all required properties are specified, you can start the server:
```sh
$ npm start
```

By default, the server will start serve requests on `http://localhost:3000` and will use `file` as default data storage.

But you can change default config properties by overriding it in `config.js` file.

All available properties (with specified by default values) are listed below:
```js
{
  api: {
    yandex: {
      oauth: 'https://oauth.yandex.ru/token', // Yandex oAuth url
      url: 'https://api-metrika.yandex.ru', // Yandex API endpoint
      clientId: '', // ID from https://oauth.yandex.ru/
      clientSecret: '' // Password from https://oauth.yandex.ru/
    },
    google: {
      oauth: 'https://www.googleapis.com/oauth2/v4/token', // Google oAuth url
      url: 'https://www.googleapis.com', // Google API endpoint
      clientId: '', // Client ID from https://console.developers.google.com
      clientSecret: '' // Client secret from https://console.developers.google.com
    }
  },
  security: {
    password: { // password is generated with crypto.pbkdf2
      iterations: 1e3, // iterations number
      keylen: 256, // key length
      digest: 'sha256', // digest type
      minLength: 6 // password min length
    },
    salt: {
      size: 128 // salt size
    },
    authToken: {
      size: 128 // user authToken size
    }
  },
  cache: {
    period: 18e5 // the period after which data will be requested from Google and Yandex API instead of cache (30 minutes by default)
  },
  backend: {
    url: 'http://localhost:3000/',
    redirectGoogle: 'connect/google/token', // you should specify (url + redirectGoogle) as redirect URI in https://console.developers.google.com
    redirectYandex: 'connect/yandex/token', // you should specify (url + redirectYandex) as callback URL in https://oauth.yandex.ru/
    port: 3000 // port on which server will start
  },
  tmp: {
    path: './tmp/'
  },
  db: {
    type: 'file',
    redis: {
      port: 6379,
      host: '127.0.0.1',
      prefix: 'the-ring:demo:'
    },
    file: {
      path: './tmp/db/',
      prefix: 'the-ring:demo:'
    },
    memory: {
      prefix: 'the-ring:demo:'
    }
  }
}
```

# API methods

Methods which **don't require** authentication marked with: :unlock:

Methods which **require** authentication marked with: :closed_lock_with_key:

## :unlock: GET /ping

A simple method to test the server.

### Example

```js
get('http://localhost:3000/ping');
```
If all is OK, you will get:
```json
{"status":200,"data":"Pong","timestamp":1465064880834,"version":1}
```

## Auth

Register, login and logout user.

## :unlock: POST /auth/registration

This method will register new user.

### Params:

* **login** (*String*) - User login.
* **password** (*String*) - User password.
* **rePassword** (*String*) - User password again.

### Example

```js
post('http://localhost:3000/auth/registration', {
  body: {
    login: 'demo@thering.co',
    password: '123456',
    rePassword: '123456'
  }
});
```
If all is OK, you will get:
```json
{"status":200,"data":"Ok","timestamp":1465064880834,"version":1}
```
If `login` and/or `password` isn't specified, you will get:
```json
{"status":403,"data":"Login and password is required","timestamp":1465064880834,"version":1}
```
If `password` length less than required, you will get this:
```json
{"status":403,"data":"Password should contain at least 6 characters","timestamp":1465064880834,"version":1}
```
If `password` and `rePassword` doesn't match, you will get this:
```json
{"status":403,"data":"Password and re-entered password does not match","timestamp":1465064880834,"version":1}
```
If something went wrong, you will get:
```json
{"status":500,"data":"Something went wrong","timestamp":1465064880834,"version":1}
```

## :unlock: POST /auth/login

This method authenticates the user and create new `authToken`.

### Params:

* **login** (*String*) - User login.
* **password** (*String*) - User password.

### Example

```js
post('http://localhost:3000/auth/login', {
  body: {
    login: 'demo@thering.co',
    password: '123456'
  }
});
```
If all is OK, you will get:
```json
{"status":200,"data":{"userId":"ce4e8f0f-239b-40d0-877e-a60a74ec3a01","authToken":"bcda773628a1e369fc666f88568f94bb53f080e...1c2d94e7e682c5afc06003177b62a61f50d"},"timestamp":1465064880834,"version":1}
```
If `login` and/or `password` isn't specified or they are incorrect, you will get:
```json
{"status":403,"data":"Wrong login and/or password","timestamp":1465064880834,"version":1}
```
If something went wrong, you will get:
```json
{"status":500,"data":"Something went wrong","timestamp":1465064880834,"version":1}
```

## :closed_lock_with_key: POST /auth/logout

**Authentication required:** ***you can provide `userId` and `authToken` as query parameter, body parameter or as headers.***

This method invalidate specified `authToken`.

### Params:

* **userId** (*String*) - User id.
* **authToken** (*String*) - User auth token.

### Example

```js
post('http://localhost:3000/auth/logout', {
  headers: {
    'X-User-Id': 'ce4e8f0f-239b-40d0-877e-a60a74ec3a01',
    'X-Auth-Token': 'bcda773628a1e369fc666f88568f94bb53f080e...1c2d94e7e682c5afc06003177b62a61f50d'
  },
  body: {},
});
```
If all is OK, you will get:
```json
{"status":200,"data":"Ok","timestamp":1465064880834,"version":1}
```
If `userId` and/or `authToken` isn't specified or they are incorrect, you will get:
```json
{"status":403,"data":"Wrong userId and/or authToken","timestamp":1465064880834,"version":1}
```
If something went wrong, you will get:
```json
{"status":500,"data":"Something went wrong","timestamp":1465064880834,"version":1}
```

## Connect

Methods which connect Yandex and Google accounts with user.

## :unlock: GET /connect/yandex?state=:state

This method will redirect user to Yandex Auth page.

### Params:

* **state** (*String*) - User state which is base64 string of `userId|config.frontend.connectUrl`

### Example

```js
const state = window.btoa('ce4e8f0f-239b-40d0-877e-a60a74ec3a01|http://frontend.url/connect');
window.open(`http://localhost:3000/connect/yandex?state=${state}`, 'connectYandex', 'width=800,height=600,scrollbars=yes');
```

## :unlock: GET /connect/yandex/token?code=:code&state=:state

Yandex will redirect to this method with `authorization code` and `state` from previous method.

On success user will be redirected to `http://frontend.url/connect?yandex=true`

On fail user will be redirected to `http://frontend.url/connect?yandex=false`

### Params:

* **code** (*String*) - Yandex authorization code
* **state** (*String*) - User state which is base64 string of `userId|config.frontend.connectUrl`

## :unlock: GET /connect/google?state=:state

This method will redirect user to Google Auth page.

### Params:

* **state** (*String*) - User state which is base64 string of `userId|config.frontend.connectUrl`

### Example

```js
const state = window.btoa('ce4e8f0f-239b-40d0-877e-a60a74ec3a01|http://frontend.url/connect');
window.open(`http://localhost:3000/connect/google?state=${state}`, 'connectGoogle', 'width=800,height=600,scrollbars=yes');
```

## :unlock: GET /connect/google/token?code=:code&state=:state

Google will redirect to this method with `authorization code` and `state` from previous method.

On success user will be redirected to `http://frontend.url/connect?google=true`

On fail user will be redirected to `http://frontend.url/connect?google=false`

### Params:

* **code** (*String*) - Google authorization code
* **state** (*String*) - User state which is base64 string of `userId|config.frontend.connectUrl`

## User

Get user info, update user info and get user counters.

## :closed_lock_with_key: GET /user

**Authentication required:** ***you can provide `userId` and `authToken` as query parameter, body parameter or as headers.***

This method returns basic user info. Where:
* login - user login
* name - user name
* image - link on user image
* yandex - `true` or `false`, Yandex is connected or not
* google - `true` or `false`, Google is connected or not

### Params:

* **userId** (*String*) - User id.
* **authToken** (*String*) - User auth token.

### Example

```js
get('http://localhost:3000/user', {
  headers: {
    'X-User-Id': 'ce4e8f0f-239b-40d0-877e-a60a74ec3a01',
    'X-Auth-Token': 'bcda773628a1e369fc666f88568f94bb53f080e...1c2d94e7e682c5afc06003177b62a61f50d'
  }
});
```
If all is OK, you will get:
```json
{"status":200,"data":{"login":"demo@thering.co","name":"Demo User","image":"https://secure.gravatar.com/avatar/750544b41582dbab2e561ca0938f1e9f?d=retro","yandex":true,"google":true},"timestamp":1465064880834,"version":1}
```
If `userId` and/or `authToken` isn't specified or they are incorrect, you will get:
```json
{"status":403,"data":"Wrong userId and/or authToken","timestamp":1465064880834,"version":1}
```
If something went wrong, you will get:
```json
{"status":500,"data":"Something went wrong","timestamp":1465064880834,"version":1}
```

## :closed_lock_with_key: PUT /user

**Authentication required:** ***you can provide `userId` and `authToken` as query parameter, body parameter or as headers.***

This method changes user info. And returns basic user info. Where:
* login - user login
* name - user name
* image - link on user image
* yandex - `true` or `false`, Yandex is connected or not
* google - `true` or `false`, Google is connected or not

### Params:

* **userId** (*String*) - User id.
* **authToken** (*String*) - User auth token.
* **[login]** (*String*) - User login.
* **[name]** (*String*) - User name.
* **[password]** (*String*) - User password.
* **[rePassword]** (*String*) - User password again (required if password specified).
* **[google]** (*Boolean*) - Google connect status
* **[yandex]** (*Boolean*) - Yandex connect status

### Example

```js
put('http://localhost:3000/user', {
  headers: {
    'X-User-Id': 'ce4e8f0f-239b-40d0-877e-a60a74ec3a01',
    'X-Auth-Token': 'bcda773628a1e369fc666f88568f94bb53f080e...1c2d94e7e682c5afc06003177b62a61f50d'
  },
  body: {
    name: 'New Name'
  }
});
```
If all is OK, you will get:
```json
{"status":200,"data":{"login":"demo@thering.co","name":"New Name","image":"https://secure.gravatar.com/avatar/750544b41582dbab2e561ca0938f1e9f?d=retro","yandex":true,"google":true},"timestamp":1465064880834,"version":1}
```
If `userId` and/or `authToken` isn't specified or they are incorrect, you will get:
```json
{"status":403,"data":"Wrong userId and/or authToken","timestamp":1465064880834,"version":1}
```
If `password` length less than required, you will get this:
```json
{"status":403,"data":"Password should contain at least 6 characters","timestamp":1465064880834,"version":1}
```
If `password` and `rePassword` doesn't match, you will get this:
```json
{"status":403,"data":"Password and re-entered password does not match","timestamp":1465064880834,"version":1}
```
If something went wrong, you will get:
```json
{"status":500,"data":"Something went wrong","timestamp":1465064880834,"version":1}
```

## :closed_lock_with_key: GET /user/counters

**Authentication required:** ***you can provide `userId` and `authToken` as query parameter, body parameter or as headers.***

This method returns all user counters (from Yandex and Google).

### Params:

* **userId** (*String*) - User id.
* **authToken** (*String*) - User auth token.

### Example

```js
get('http://localhost:3000/user/counters', {
  headers: {
    'X-User-Id': 'ce4e8f0f-239b-40d0-877e-a60a74ec3a01',
    'X-Auth-Token': 'bcda773628a1e369fc666f88568f94bb53f080e...1c2d94e7e682c5afc06003177b62a61f50d'
  }
});
```
If all is OK, you will get:
```json
{"status":200,"data":{"google":{"ga:111111111":{"id":"UA-11111111-1","name":"example","site":"http://example.com","ga":"ga:111111111","used":false}},"yandex":{"ga:111111":{"id":111111,"name":"example","site":"example.com","ga":"ga:111111","used":false}}},"timestamp":1465064880834,"version":1}
```
If `userId` and/or `authToken` isn't specified or they are incorrect, you will get:
```json
{"status":403,"data":"Wrong userId and/or authToken","timestamp":1465064880834,"version":1}
```
If something went wrong, you will get:
```json
{"status":500,"data":"Something went wrong","timestamp":1465064880834,"version":1}
```

## Sites

Get sites and add new site.

## :closed_lock_with_key: GET /sites

**Authentication required:** ***you can provide `userId` and `authToken` as query parameter, body parameter or as headers.***

This method returns all added sites.

### Params:

* **userId** (*String*) - User id.
* **authToken** (*String*) - User auth token.

### Example

```js
get('http://localhost:3000/sites', {
  headers: {
    'X-User-Id': 'ce4e8f0f-239b-40d0-877e-a60a74ec3a01',
    'X-Auth-Token': 'bcda773628a1e369fc666f88568f94bb53f080e...1c2d94e7e682c5afc06003177b62a61f50d'
  }
});
```
If all is OK, you will get:
```json
{"status":200,"data":{"example":{"id":"example","title":"Example","url":"http://example.com","google":"ga:111111111","yandex":"ga:111111"}},"timestamp":1465064880834,"version":1}
```
If `userId` and/or `authToken` isn't specified or they are incorrect, you will get:
```json
{"status":403,"data":"Wrong userId and/or authToken","timestamp":1465064880834,"version":1}
```
If something went wrong, you will get:
```json
{"status":500,"data":"Something went wrong","timestamp":1465064880834,"version":1}
```

## :closed_lock_with_key: POST /sites

**Authentication required:** ***you can provide `userId` and `authToken` as query parameter, body parameter or as headers.***

This method adds new site and then returns it.

### Params:

* **userId** (*String*) - User id.
* **authToken** (*String*) - User auth token.
* **id** (*String*) - Site id.
* **title** (*String*) - Site title.
* **url** (*String*) - Site url.
* **google** (*String*) - Google counter.
* **yandex** (*String*) - Yandex counter.

### Example

```js
post('http://localhost:3000/sites', {
  headers: {
    'X-User-Id': 'ce4e8f0f-239b-40d0-877e-a60a74ec3a01',
    'X-Auth-Token': 'bcda773628a1e369fc666f88568f94bb53f080e...1c2d94e7e682c5afc06003177b62a61f50d'
  },
  body: {
    id: 'example',
    title: 'Example',
    url: 'http://example.com',
    google: 'ga:111111111',
    yandex: 'ga:111111'
  }
});
```
If all is OK, you will get:
```json
{"status":200,"data":{"example":{"id":"example","title":"Example","url":"http://example.com","google":"ga:111111111","yandex":"ga:111111"}},"timestamp":1465064880834,"version":1}
```
If `userId` and/or `authToken` isn't specified or they are incorrect, you will get:
```json
{"status":403,"data":"Wrong userId and/or authToken","timestamp":1465064880834,"version":1}
```
If one of the properties is missed, you will get:
```json
{"status":400,"data":"One of the properties is missed","timestamp":1465064880834,"version":1}
```
If something went wrong, you will get:
```json
{"status":500,"data":"Something went wrong","timestamp":1465064880834,"version":1}
```

## Site

Get sites and add new site.

## :closed_lock_with_key: GET /site/:id

**Authentication required:** ***you can provide `userId` and `authToken` as query parameter, body parameter or as headers.***

This method returns site info.

### Params:

* **userId** (*String*) - User id.
* **authToken** (*String*) - User auth token.
* **id** (*String*) - Site id.

### Example

```js
get('http://localhost:3000/site/example', {
  headers: {
    'X-User-Id': 'ce4e8f0f-239b-40d0-877e-a60a74ec3a01',
    'X-Auth-Token': 'bcda773628a1e369fc666f88568f94bb53f080e...1c2d94e7e682c5afc06003177b62a61f50d'
  }
});
```
If all is OK, you will get:
```json
{"status":200,"data":{"id":"example","title":"Example","url":"http://example.com","google":"ga:111111111","yandex":"ga:111111"},"timestamp":1465064880834,"version":1}
```
If `userId` and/or `authToken` isn't specified or they are incorrect, you will get:
```json
{"status":403,"data":"Wrong userId and/or authToken","timestamp":1465064880834,"version":1}
```
If site `id` is missed, you will get:
```json
{"status":400,"data":"Missed site id","timestamp":1465064880834,"version":1}
```
If site `id` is wrong, you will get:
```json
{"status":404,"data":"Site with ':id' id doesn't exist","timestamp":1465064880834,"version":1}
```
If something went wrong, you will get:
```json
{"status":500,"data":"Something went wrong","timestamp":1465064880834,"version":1}
```

## :closed_lock_with_key: PUT /site/:id

**Authentication required:** ***you can provide `userId` and `authToken` as query parameter, body parameter or as headers.***

This method updates site info and then returns updated info.

### Params:

* **userId** (*String*) - User id.
* **authToken** (*String*) - User auth token.
* **id** (*String*) - Site id.
* **[title]** (*String*) - Site title.
* **[url]** (*String*) - Site url.

### Example

```js
put('http://localhost:3000/site/example', {
  headers: {
    'X-User-Id': 'ce4e8f0f-239b-40d0-877e-a60a74ec3a01',
    'X-Auth-Token': 'bcda773628a1e369fc666f88568f94bb53f080e...1c2d94e7e682c5afc06003177b62a61f50d'
  },
  body: {
    id: 'newid'
  }
});
```
If all is OK, you will get:
```json
{"status":200,"data":{"id":"newid","title":"Example","url":"http://example.com","google":"ga:111111111","yandex":"ga:111111"},"timestamp":1465064880834,"version":1}
```
If `userId` and/or `authToken` isn't specified or they are incorrect, you will get:
```json
{"status":403,"data":"Wrong userId and/or authToken","timestamp":1465064880834,"version":1}
```
If site `id` is missed, you will get:
```json
{"status":400,"data":"Missed site id","timestamp":1465064880834,"version":1}
```
If site `id` is wrong, you will get:
```json
{"status":404,"data":"Site with ':id' id doesn't exist","timestamp":1465064880834,"version":1}
```
If something went wrong, you will get:
```json
{"status":500,"data":"Something went wrong","timestamp":1465064880834,"version":1}
```

## :closed_lock_with_key: DELETE /site/:id

**Authentication required:** ***you can provide `userId` and `authToken` as query parameter, body parameter or as headers.***

This method deletes site.

### Params:

* **userId** (*String*) - User id.
* **authToken** (*String*) - User auth token.
* **id** (*String*) - Site id.

### Example

```js
delete('http://localhost:3000/site/example', {
  headers: {
    'X-User-Id': 'ce4e8f0f-239b-40d0-877e-a60a74ec3a01',
    'X-Auth-Token': 'bcda773628a1e369fc666f88568f94bb53f080e...1c2d94e7e682c5afc06003177b62a61f50d'
  }
});
```
If all is OK, you will get:
```json
{"status":200,"data":"Ok","timestamp":1465064880834,"version":1}
```
If `userId` and/or `authToken` isn't specified or they are incorrect, you will get:
```json
{"status":403,"data":"Wrong userId and/or authToken","timestamp":1465064880834,"version":1}
```
If site `id` is missed, you will get:
```json
{"status":400,"data":"Missed site id","timestamp":1465064880834,"version":1}
```
If site `id` is wrong, you will get:
```json
{"status":404,"data":"Site with ':id' id doesn't exist","timestamp":1465064880834,"version":1}
```
If something went wrong, you will get:
```json
{"status":500,"data":"Something went wrong","timestamp":1465064880834,"version":1}
```

## License

The MIT License (MIT)<br/>
Copyright (c) 2016 Alexey Bystrov
