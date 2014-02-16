simple-counter
--------------

dead simple stats counter that flushes to disk.

## install

api:

```
$ npm install simple-counter
```

bin:

```
npm install -g simple-counter
```

## usage

api:

```js
var sc = require('simple-counter');
// returns an http server.
var server = sc('/my/dir');
server.listen(port);
```

bin:

```
$ simple-counter /my/dir 8080
```

pass port and dir in any order and defaults to 8888 and {module_dir}/data.

## License

MIT
