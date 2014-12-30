node-ssdb
=========

![](https://nodei.co/npm/ssdb.png)

[ssdb](https://github.com/ideawu/ssdb) nodejs client library,
ssdb is a fast nosql database, an alternative to redis.


![](https://api.travis-ci.org/eleme/node-ssdb.svg)

Please dont send me emails for any questions about node-ssdb, open an issue on GitHub instead, thanks!

Python port: https://github.com/hit9/ssdb.py

Requirements
-------------

- ssdb 1.6.8.8+

Installation
-------------

```bash
$ npm install ssdb
```

Example
--------

The traditional Node.js way:

```js
var ssdb = require('ssdb');
var client = ssdb.createClient();

client.set('key', 'val', function(err, data){
  if (!err) {
    console.log(data);
  } else throw err;
});
```

Work with [tj/co](https://github.com/tj/co), make it thunkify or promisify:

```js
var co = require('co');
client.thunkify();
// or client.promisify();

co(function *(){
  var key = 'key';
  var a = yield client.set(key, 'val');
  var b = yield client.get(key);
  console.log(a, b);  // 1 'val'
}).catch(function(err) {
  console.error(err)
});
```

*node-ssdb uses v8 native Promise to implement `promisify`, which requires nodejs v0.11.13+*

To use [bluebird](https://github.com/petkaantonov/bluebird) as promise implementation (which
is much faster than v8 native promise):

```js
// use bluebird promise
global.Promise = require('bluebird').Promise;
```

Callback Parameters
-------------------

Callback functions have two parameters: `error, data`;

- on `status_ok`:  only `error` is `undefined`;
- on `status_not_found`: `error` and `data` are both `undefined`
- on `status_error`, `status_fail`, `status_client_error`: only `data` is `undefined`.

API References
--------------

### createClient(options)

To make a ssdb client:

```js
var ssdb = require('ssdb');
var client = ssdb.createClient();
```

options (with default values):

```js
{
  host: '0.0.0.0',
  port: 8888,
  auth: undefined,  // ssdb server auth password
  size: 1,  // connection pool size
  timeout: 0
}
```

*Note: `auth` requires ssdb v1.7.0.0+*

### client.quit()

Quit from ssdb server.

### command names

```js
ssdb.commands
```

SSDB API Documentation
----------------------

Detail docs for ssdb interfaces can be found at: https://github.com/hit9/ssdb.api.docs


FAQ
---

1. Pipeline?

   Node-ssdb pipelines automatically because node.js has async IO, this is different with other
   clients in sync IO languages (i.e. Python), node-ssdb always pipelines.

2. Commands & Callbacks ordering ?

   On a single client, the callbacks are run the same order as the commands are sent, TCP guarantees
   this: the stream will arrive in the same order as it was sent.

3. Connection Pool?

   Yes, node-ssdb always uses connection pool, default size is 1, but the pool is really simple.

License
-------

Copyright (c) 2014 Eleme, Inc. detail see [LICENSE-MIT](./LICENSE-MIT)
