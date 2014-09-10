node-ssdb
=========

[ssdb](https://github.com/ideawu/ssdb) nodejs client library,
ssdb is a fast nosql database, an alternative to redis.

Latest version: v0.1.2

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

Work with TJ's [co](https://github.com/visionmedia/co):

```js
var co = require('co');
client.thunkify();

co(function *(){
  try{
    var key = 'key';
    var a = yield client.set(key, 'val');
    var b = yield client.get(key);
    console.log(a, b);  // 1 'val'
  } catch(e){
    throw e;
  }
})();
```

Work with promises:

```js
client.promisify()

client.set('key', 'val')
.then(function(){
  return client.get('key')
}).then(function(d){
  console.log(d);  // 'val'
});
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
  timeout: 0
}
```

### client.quit()

Quit from ssdb server.

### client.unref()

Equivalent to `client.conn.sock.unref()`, see http://nodejs.org/api/net.html#net_server_unref.

### command names

```js
ssdb.commands   // js object keys
```

### Client events

All client events: **"status_ok"**, **"status_not_found"**, **"status_fail"**, **"status_client_error"**, **"status_error"**

Parameters: `command, error, data`.

```js
client.on('status_client_error', function(command, error, data) {
  log.error('Error %s on command: %s', error, command);
});
```

### Connection Events Handling

All events (except `'data`) on nodejs's `net.event.connect` are avaliable (reference: http://nodejs.org/api/net.html)

- event 'connect'
- event 'end'
- event 'timeout'
- event 'drain'
- event 'error'
- event 'close'

```js
client.on('error', function(err){
  log.error('ssdb connect error: %s', err);
});
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

License
-------

Copyright (c) 2014 Eleme, Inc. detail see [LICENSE-MIT](./LICENSE-MIT)
