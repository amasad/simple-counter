var sc = require('./');
var fs = require('fs');
var http = require('http');
var port = process.env.PORT || 8880;
var test = require('tap').test
var rimraf = require('rimraf');

var testdir = __dirname + '/__testing';
if (fs.existsSync(testdir)) rimraf.sync(testdir);
fs.mkdirSync(testdir);

test('handles passed in dir', function (t) {
  t.test('throws not found dir', function (t) {
    var dir = __dirname + '/foo';
    t.throws(function () {
      sc(dir);
    });
    t.end();
  });
  t.test('creates or finds default dir', function (t) {
    sc();
    t.ok(1);
    t.end();
  });
  t.end();
});

function req(pathname, cb, delay) {
  var req = http.request({
    hostname: 'localhost',
    port: port,
    path: pathname
  }, function (res) {
    if (res.statusCode !== 200) throw new Error(res.statusCode);
    var data = '';
    res.on('data', function (d) {
      data += d;
    });
    res.on('end', function () {
      cb(data);
    });
  });
  if (delay) {
    setTimeout(function () {
      req.end();
    }, delay);
  } else {
    req.end();
  }
}

test('counts using get api', function (t) {
  var s = sc(testdir);
  s.listen(port, function () {
    req('/count/foo', function () {
      req('/report/foo', function (d) {
        t.equal(d, '1');
        req('/count/foo', function () {
          req('/report/foo', function (d) {
            t.equal(d, '2');
            s.close();
            t.end();
          }, 200);
        });
      }, 200);
    });
  });
});

test('continues counting', function (t) {
  var s = sc(testdir);
  s.listen(port, function () {
    req('/count/bar', function () {
      s.once('close', function () {
        setTimeout(cont, 50);
      })
      s.close();
    });
  });

  function cont() {
    var s = sc(testdir);
    s.listen(port, function () {
      req('/report/bar', function (d) {
        t.equal(d, '1');
        s.close();
        t.end();
      });
    });
  }
});

test('counts using gif and get api', function (t) {
  var s = sc(testdir);
  s.listen(port, function () {
    req('/count/baz.gif', function () {
      req('/report/baz', function (d) {
        t.equal(d, '1');
        req('/count/baz', function () {
          req('/report/baz', function (d) {
            t.equal(d, '2');
            s.close();
            t.end();
          }, 200);
        });
      }, 200);
    });
  });
});

test('clean', function (t) {
  if (fs.existsSync(testdir)) rimraf(testdir, t.end.bind(t, null));
});
