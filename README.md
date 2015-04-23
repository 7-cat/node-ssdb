node-ssdb
=========

![](https://nodei.co/npm/ssdb.png)

[ssdb](https://github.com/ideawu/ssdb) nodejs/iojs client library,
ssdb is a fast nosql database, an alternative to redis.

**v0.3.0 is not backward-compactiable with old versions(0.2.x)**.

![](https://api.travis-ci.org/eleme/node-ssdb.svg)

Please dont send me emails for any questions about node-ssdb, open an issue on GitHub instead, thanks!

Ports
------

- Python port: https://github.com/hit9/ssdb.py
- Lua ngx client: https://github.com/eleme/lua-resty-ssdb


Supported Engines
-----------------

- node.js >= v0.10.30
- iojs >= 1.0.4

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
var pool = ssdb.createPool();
var conn = pool.acquire();

conn.set('key', 'val', function(err, data) {
  if (err) {
    throw err;
  }
  // data => '1'
});
```

Work with [tj/co](https://github.com/tj/co), make it thunkify or promisify:

```js
var co = require('co');

var pool = ssdb.createPool({promisify: true});
var conn = pool.acquire();

co(function *(){
  var key = 'key';
  var a = yield conn.set(key, 'val');
  var b = yield conn.get(key);
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

Error Handling
--------------

```javascript
var ssdb = require('ssdb');
var pool = ssdb.createPool();

pool.acquire().set('key', 'val', function(err, data) {
  if (err && err instanceof ssdb.SSDBError)
    throw err;  // ssdb error
});
```

Protocol Parsers
----------------

Node-ssdb will try to find module [spp](https://github.com/hit9/spp_node), if found, use
it, else use the nodejs version.

Poolling Policies
-----------------

There are 2 poolling policies avaliable: 'least_conn' and 'round_robin' (the default), e.g.

```ssdb
var pool = ssdb.createPool({policy: ssdb.Pool.policies.least_conn});
```

API References
--------------

### createPool(options)

To make a ssdb client:

```js
var ssdb = require('ssdb');
var pool = ssdb.createPool();
```

options (with default values):

```js
{
  host: '0.0.0.0',
  port: 8888,
  auth: undefined,  // ssdb server auth password
  authCallback: function(err, data) {if (err) throw err;},  // callback function on auth
  size: 1,  // connection pool size
  timeout: 0,
  promisify: false,  // make api methods promisify.
  thunkify: false,  // make api methods thunkify.
  policy: Pool.policies.round_robin,
}
```

*Note: `auth` requires ssdb v1.7.0.0+*

### pool.acquire()

Acquire a connection from pool.

### pool.destroy()

Close all connections in the pool.

### pool.create(options)

Create a new connection and add it to the pool.

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

   On a single connection, the callbacks are run the same order as the commands are sent, TCP guarantees
   this: the stream will arrive in the same order as it was sent.

3. Connection Pool?

   ssdb is a multiple-threading server, so the connection pool is required. Here are some examples
   to use the connection pool:

   ```js
   // sync io and executed in order on the remote end.
   var conn = pool.acquire();
   yield conn.set('key', 'val');
   yield conn.get('key');
   // async io and executed parallely on the remote end.
   yield [
     pool.acquire().set('key1', 'val1');
     pool.acquire().set('key2', 'val2');
   ];
   ```

License
-------

Copyright (c) 2014 Eleme, Inc. detail see [LICENSE-MIT](./LICENSE-MIT)
