'use strict';

var fs = require('fs');
var url = require('url');
var http = require('http');
var path = require('path');
var assert = require('assert');

var pixel = fs.readFileSync(__dirname + '/p.gif');

function start(dir, flushInterval) {
  var flushTimeout = null;
  var counters = {
    // key: int
  };

  fs.readdirSync(dir).forEach(function (fname){
    var m = fname.match(/^data_(.*)$/);
    if (m && m[1]) {
      var v = parseInt(fs.readFileSync(path.join(dir, fname)), 10);
      if (!v || isNaN(v)) v = 0;
      counters[m[1]] = v;
    }
  });

  function flush() {
    Object.keys(counters).forEach(function (key) {
      var v = counters[key];
      fs.writeFile(path.join(dir, 'data_' + key), v + '');
    });
    flushTimeout = setTimeout(flush, flushInterval);
  }

  function increment(key) {
    if (counters[key]) {
      counters[key]++;
    } else {
      counters[key] = 1;
    }
  }

  function notfound(res) {
    var reason = 'not found';
    res.writeHead(404, {
      'Content-Type': 'text/html',
      'Content-Length': reason.length
    });
    res.end(reason);
  }

  function count(pathname, res) {
    var key = path.basename(pathname);
    var image = false;
    if (path.extname(key) === '.gif') {
      image = true;
      key = key.substr(0, key.length - 4);
    }
    increment(key);
    if (image) {
      res.writeHead(200, {
        'Cache-Control':        'private, no-cache, proxy-revalidate, max-age=0',
        'Content-Type':         'image/gif',
        'Content-Disposition':  'inline',
        'Content-Length':       pixel.length
      });
      res.end(pixel);
    } else {
      res.writeHead(204, {
        'Content-Type': 'text/html',
        'Content-Length': '0'
      });
      res.end();
    }
  }

  function report(pathname, res) {
    var key = path.basename(pathname);
    if (typeof counters[key] === 'undefined') {
      notfound(res);
      return;
    }

    var content = counters[key] + '';
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Content-Length': content.length
    });
    res.end(content);
  }

  var server = http.createServer(function (req, res) {
    var params = url.parse(req.url, true);
    var pathname = params.pathname;
    var parts = pathname.split('/');
    if (parts.length !== 3) {
      notfound(res);
      return;
    }
    if (parts[1] === 'count') {
      count(pathname, res);
    } else if (parts[1] === 'report') {
      report(pathname, res);
    } else {
      notfound(res);
    }
  });

  server.on('close', function () {
    clearTimeout(flushTimeout);
    flush();
    clearTimeout(flushTimeout);
  });
  server.on('listening', function () {
    flush();
  })
  return server;
}

module.exports = function (dir) {
  if (!dir) {
    dir = path.join(__dirname, 'data');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  }
  assert(fs.statSync(dir).isDirectory(), 'Invalid dir');
  return start(dir, 100);
};
