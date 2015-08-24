var util = require('util');
var ssdb = require('./lib/ssdb');
var should = require('should');
var co = require('co');
var coMocha = require('co-mocha');
var sleep = require('co-sleep');

var pool = ssdb.createPool({
  auth: '123456789012345678901234567890123', size: 15, promisify: true});

// helpers
var uk = (function(base){
  var cursor = base;
  return function(prefix){
    prefix = prefix || 'key';
    return util.format('%s-%d', prefix, cursor++);
  };
})(new Date().getTime());


function randomString(length) {
  var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'
              .split('');

  if (! length) {
    length = Math.floor(Math.random() * chars.length);
  }

  var str = '';
  for (var i = 0; i < length; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}


// mocha ssdb module
describe('ssdb', function(){

  it('set', function *(){
    var conn = pool.acquire();
    var key = uk();
    var d = yield conn.set(key, 'v');
    should(d).eql(1);
  });

  it('setx', function *(){
    var conn = pool.acquire();
    var key = uk();
    var d = yield conn.setx(key, 'v', 1.2);
    var ttl = yield conn.ttl(key);
    yield sleep(1201);
    var b = yield conn.exists(key);
    should(d).eql(1);
    should(ttl).below(1.2);
    should(b).be.false;
  });

  it('expire', function *(){
    var conn = pool.acquire();
    var key = uk();
    var a = yield conn.set(key, 'v');
    var b = yield conn.expire(key, 1.2);
    var c = yield conn.ttl(key);
    var d = yield conn.expire(uk(), 1.1);
    should(a).eql(1);
    should(b).eql(1);
    should(c).below(1.2);
    should(d).eql(0);
  });

  it('ttl', function *(){
    var conn = pool.acquire();
    var key = uk();
    var a = yield conn.setx(key, 'v', 1.2);
    var b = yield conn.ttl(key);
    should(a).eql(1);
    should(b).not.below(0);
    should(b).below(1.2);
  });

  it('setnx', function *(){
    var conn = pool.acquire();
    var key = uk();
    var a = yield conn.setnx(key, 'v');
    var b = yield conn.setnx(key, 'v');
    should(a).eql(1);
    should(b).eql(0);
  });

  it('get', function *(){
    var conn = pool.acquire();
    var key = uk();
    yield conn.set(key, 'v');
    var d = yield conn.get(key);
    should(d).eql('v');
  });

  it('getset', function *(){
    var conn = pool.acquire();
    var key = uk();
    var a = yield conn.set(key, 'v');
    var b = yield conn.getset(key, 'val');
    should(a).eql(1);
    should(b).eql('v');
  });

  it('del', function *(){
    var conn = pool.acquire();
    var key = uk();
    var a = yield conn.set(key, 'v');
    var b = yield conn.del(key);
    var c = yield conn.exists(key);
    should([a, b, c]).eql([1, 1, false]);
  });

  it('incr', function *(){
    var conn = pool.acquire();
    var key = uk();
    var key = uk();
    var a = yield conn.set(key, 1);
    var b = yield conn.incr(key, 2);
    var c = yield conn.get(key);
    should([a, b, c]).eql([1, 3, 3]);
  });

  it('exists', function *(){
    var conn = pool.acquire();
    var key = uk();
    var key = uk();
    var a = yield conn.set(key, 1);
    var b = yield conn.exists(key);
    var c = yield conn.exists(uk());
    should([a, b, c]).eql([1, true, false]);
  });

  it('getbit', function *(){
    var conn = pool.acquire();
    var key = uk();
    var key = uk();
    var a = yield conn.set(key, 'val');
    var b = yield conn.getbit(key, 2);
    should([a, b]).eql([1, 1]);
  });

  it('setbit', function *(){
    var conn = pool.acquire();
    var key = uk();
    var key = uk();
    var a = yield conn.set(key, 'val');
    var b = yield conn.setbit(key, 2, 0);
    var c = yield conn.get(key);
    should([a, b, c]).eql([1, 1, 'ral']);
  });

  it('countbit', function *(){
    var conn = pool.acquire();
    var key = uk();
    var key = uk();
    var a = yield conn.set(key, 'val');
    var b = yield conn.countbit(key);
    should([a, b]).eql([1, 12]);
  });

  it('substr', function *(){
    var conn = pool.acquire();
    var key = uk();
    var key = uk();
    var a = yield conn.set(key, 'hello world');
    var b = yield conn.substr(key);
    var c = yield conn.substr(key, 6, 10);
  });

  it('strlen', function *(){
    var conn = pool.acquire();
    var key = uk();
    var key = uk();
    var a = yield conn.set(key, 'hello world');
    var b = yield conn.strlen(key);
    should([a, b]).eql([1, 11]);
  });

  it('keys', function *(){
    var conn = pool.acquire();
    var key = uk();
    var start = uk();
    var a = uk(); var b = uk();
    yield conn.set(a, 1);
    yield conn.set(b, 1);
    d = yield conn.keys(start, uk(), 2);  // (start, end]
    should(d).eql([a, b]);
  });

  it('scan', function *(){
    var conn = pool.acquire();
    var key = uk();
    var start = uk();
    var a = uk(); var b = uk();
    yield conn.set(a, 1);
    yield conn.set(b, 1);
    d = yield conn.scan(start, uk(), -1);  // (start, end]
    should(d).eql([a, 1, b, 1]);
  });

  it('rscan', function *(){
    var conn = pool.acquire();
    var key = uk();
    var stop = uk();
    var a = uk(); var b = uk();
    yield conn.set(a, 1);
    yield conn.set(b, 1);
    var start = uk();
    var d = yield conn.rscan(start, stop, -1);  // (start, end]
    should(d).eql([b, 1, a, 1]);
  });

  it('multi_set/multi_get/multi_del', function *(){
    var conn = pool.acquire();
    var key = uk();
    var k1 = uk();
    var k2 = uk();
    var k3 = uk();
    var a = yield conn.multi_set(k1, 'v1', k2, 'v2', k3, 'v3');
    var b = yield conn.multi_get(k1, k2, k3);
    var c = yield conn.multi_del(k1, k2, k3);
    should([a, c]).eql([3, 3]);
    should(b).eql([k1, 'v1', k2, 'v2', k3, 'v3']);
  });

  it('hset/hget/hdel/hincr/hexists', function *(){
    var conn = pool.acquire();
    var key = uk();
    var hash = uk('hash');
    var field = uk('field');
    var a = yield conn.hset(hash, field, 'v');
    var b = yield conn.hget(hash, field);
    var c = yield conn.hdel(hash, field);
    var d = yield conn.hincr(hash, field, 3);
    var e = yield conn.hexists(hash, field);
    should([a, b, c, d, e]).eql([1, 'v', 1, 3, true]);
  });

  it('hexists', function *(){
    var conn = pool.acquire();
    var key = uk();
    var hash = uk('hash');
    var field = uk('field');
    var d = conn.hexists(hash, field);
    should(yield d).eql(false);
  });

  it('hsize', function *(){
    var conn = pool.acquire();
    var key = uk();
    var hash = uk('hash');
    var d = [];
    for (var i = 0; i < 10; i++) {
      d.push(conn.hset(hash, uk('field'), 'v'));
    }
    yield d;
    should(yield conn.hsize(hash)).eql(10);
  });

  it('hlist/hrlist', function *(){
    var conn = pool.acquire();
    var key = uk();
    var start = uk('hash');
    var a = uk('hash');
    var b = uk('hash');
    yield conn.hset(a, 'field', 'v');
    yield conn.hset(b, 'field', 'v');
    var lst = yield conn.hlist(start, uk('hash'), -1);
    var rlst = yield conn.hrlist(uk('hash'), start, -1);
    should(lst).eql([a, b]);
    should(rlst).eql([b, a]);
  });

  it('hkeys/hscan/hrscan/hgetall/hclear', function *(){
    var conn = pool.acquire();
    var key = uk();
    var h = uk('hash');
    var a = uk('field');
    var b = uk('field');
    yield conn.hset(h, a, 'va');
    yield conn.hset(h, b, 'vb');
    var keys = yield conn.hkeys(h, '', '', -1);
    var scan = yield conn.hscan(h, '', '', -1);
    var rscan = yield conn.hrscan(h, '', '', -1);
    var all = yield conn.hgetall(h, '', '', -1);
    var nums = yield conn.hclear(h);
    should(keys).eql([a, b]);
    should(scan).eql([a, 'va', b, 'vb']);
    should(rscan).eql([b, 'vb', a, 'va']);
    should(all).eql([a, 'va', b, 'vb']);
    should(nums).eql(2);
    should(yield conn.hsize(h)).eql(0);
  });

  it('multi_hset/multi_hget/multi_hdel', function *(){
    var conn = pool.acquire();
    var key = uk();
    var h = uk('hash');
    var k1 = uk();
    var k2 = uk();
    var k3 = uk();
    var a = yield conn.multi_hset(h, k1, 'v1', k2, 'v2', k3, 'v3');
    var b = yield conn.multi_hget(h, k1, k2, k3);
    var c = yield conn.multi_hdel(h, k1, k2, k3);
    should([a, c]).eql([3, 3]);
    should(b).eql([k1, 'v1', k2, 'v2', k3, 'v3']);
    should(yield conn.hsize(h)).eql(0);
  });

  it('zset/zget/zdel/zincr/zexists', function *(){
    var conn = pool.acquire();
    var key = uk();
    var z = uk('zset');
    var k = uk();
    var a = conn.zset(z, k, 13);
    var b = conn.zget(z, k);
    var c = conn.zincr(z, k, 3);
    var d = conn.zexists(z, k);
    var e = conn.zdel(z, k);
    var f = conn.zexists(z, k);
    should(yield a).eql(1);
    should(yield b).eql(13);
    should(yield [c, d]).eql([16, true]);
    should(yield e).eql(1);
    should(yield f).eql(false);
  });

  it('zsize', function *(){
    var conn = pool.acquire();
    var key = uk();
    var z = uk('zset');
    for (var i = 0; i < 10; i++) {
      yield conn.zset(z, uk(), i + 10);
    }
    should(yield conn.zsize(z)).eql(10);
  });

  it('zlist/zrlist', function *(){
    var conn = pool.acquire();
    var key = uk();
    var start = uk('zset');
    var a = uk('zset');
    var b = uk('zset');
    yield conn.zset(a, 'key', 12581);
    yield conn.zset(b, 'key', 12581);
    var lst = yield conn.zlist(start, uk('zset'), -1);
    var rlst = yield conn.zrlist(uk('zset'), start, -1);
    should(lst).eql([a, b]);
    should(rlst).eql([b, a]);
  });

  it('zkeys/zscan/zrscan/zclear', function *(){
    var conn = pool.acquire();
    var key = uk();
    var z = uk('zset');
    var a = uk('key');
    var b = uk('key');
    yield conn.zset(z, a, 12581);
    yield conn.zset(z, b, 12582);
    var keys = yield conn.zkeys(z, '', '', '', -1);
    var scan = yield conn.zscan(z, '', '', '', -1);
    var rscan = yield conn.zrscan(z, '', '', '', -1);
    var nums = yield conn.zclear(z);
    should(keys).eql([a, b]);
    should(scan).eql([a, 12581, b, 12582]);
    should(rscan).eql([b, 12582, a, 12581]);
    should(nums).eql(2);
    should(yield conn.zsize(z)).eql(0);
  });

  it('multi_zset/multi_zget/multi_zdel', function *(){
    var conn = pool.acquire();
    var key = uk();
    var z = uk('zset');
    var k1 = uk();
    var k2 = uk();
    var k3 = uk();
    var a = yield conn.multi_zset(z, k1, 1267, k2, 1268, k3, 1269);
    var b = yield conn.multi_zget(z, k1, k2, k3);
    var c = yield conn.multi_zdel(z, k1, k2, k3);
    should([a, c]).eql([3, 3]);
    should(b).eql([k1, 1267, k2, 1268, k3, 1269]);
    should(yield conn.zsize(z)).eql(0);
  });

  it('zrange/zrrange/zrank/zrrank/zcount/zsum/zavg/zremrangeby[score|rank]', function *(){
    var conn = pool.acquire();
    var key = uk();
    var z = uk('zset');
    var keys = [];
    var results = [];

    for (var i = 0; i < 10; i++) {
      var key = uk();
      keys.push(key);
      results.push(conn.zset(z, key, i + 100));
    }
    yield results;
    var rank = conn.zrank(z, keys[0]);  // 0
    var rrank = conn.zrrank(z, keys[9]);  // 0
    should(yield [rank, rrank]).eql([0, 0]);

    var lst = conn.zrange(z, 0, 2);
    var rlst = conn.zrrange(z, 0, 2);
    should(yield lst).eql([keys[0], 100, keys[1], 101]);
    should(yield rlst).eql([keys[9], 109, keys[8], 108]);

    var sum = conn.zsum(z, 100, 102);
    var avg = conn.zavg(z, 100, 102);
    var count = conn.zcount(z, 100, 101); // 2

    should(yield [sum, avg, count]).eql([303, 101, 2]);

    var numsr = conn.zremrangebyrank(z, 0, 7);
    var numss = conn.zremrangebyscore(z, 108, 109);  // 2

    should(yield [numsr, numss]).eql([8, 2]);

    should(yield conn.zsize(z)).eql(0);
  });

  it('qpush[_back]/qpush_front/qfront/qback/qsize/qget/qpop[_front]/qpop_back/qclear', function *(){
    var conn = pool.acquire();
    var key = uk();
    var q = uk('q');
    should(yield conn.qpush(q, 1)).eql(1);  // qpush/qpush_back
    should(yield conn.qpush_front(q, 2)).eql(2); // qpush_front
    should(yield conn.qfront(q)).eql(2); // qfront
    should(yield conn.qback(q)).eql(1);  // qback
    should(yield conn.qsize(q)).eql(2);  // qsize
    should(yield conn.qget(q, 1)).eql(1); // qget
    should(yield conn.qget(q, 0)).eql(2); // qget
    should(yield conn.qslice(q, 0, 3)).eql([2, 1]);
    should(yield conn.qpop(q)).eql(2); // qpop_front/qpop
    should(yield conn.qpop_back(q)).eql(1); // qpop_back
    should(yield conn.qpush(q, 1)).eql(1);  // qpush/qpush_back
    should(yield conn.qclear(q)).eql(1); // qclear
  });

  it('qlist/qrlist', function *(){
    var conn = pool.acquire();
    var key = uk();
    var start = uk('q');
    var a = uk('q');
    var b = uk('q');
    yield conn.qpush(a, 1);
    yield conn.qpush(b, 1);
    var lst = yield conn.qlist(start, uk('q'), -1);
    var rlst = yield conn.qrlist(uk('q'), start, -1);
    should(lst).eql([a, b]);
    should(rlst).eql([b, a]);
  });

  it('parse large size response (issue#4)', function *(){
    var conn = pool.acquire();
    var key = uk();
    var key = uk();
    var value = randomString(65535 * 3);
    yield conn.set(key, value);
    var d = yield conn.get(key);
    should(d).eql(value);
  });

  it('get a chinese value', function *(){
    var key = uk();
    var conn = pool.acquire();
    var key = uk();
    var a = yield conn.set(key, '中文测试');
    var b = yield conn.get(key);
    should(b).eql('中文测试');
  });

  it('dbsize', function *(){
    var conn = pool.acquire();
    var key = uk();
    var size = yield conn.dbsize();
    size.should.be.a.Number;
  });

  it('pool paral', function *(){
    var key = uk();
    var size = 15;

    var keys = [];
    for (var i = 0; i < size; i++)
      keys.push(uk());

    var reqs = [];
    for (var i = 0; i < size; i++)
      reqs.push(pool.acquire().set(keys[i], i));

    var resps = [];
    for (var i = 0; i < size; i++)
      resps.push(1);

    should(yield reqs).eql(resps);

    var reqs_ = [];
    for (var i = 0; i < size; i++)
      reqs_.push(pool.acquire().get(keys[i]));

    var resps_ = [];
    for (var i = 0; i < size; i++)
      resps_.push(i);

    should(yield reqs_).eql(resps_);
  });

  it('conn close', function *() {
    var key = uk();
    var conn = pool.acquire();
    yield conn.set(key, 'helloworld');
    conn.close();
    should(yield conn.get(key)).eql("helloworld");
  });

  it('pool destroy', function *() {
    var key = uk();
    yield pool.acquire().set(key, 'helloworld');
    pool.destroy();
    should(yield pool.acquire().get(key)).eql("helloworld");
  });
});
