var merge = require('lodash.assign');
var object = require('./object');
var util = require('./util');

module.exports = polyline;

function polyline(options) {
  var _gm = util.gm(), self;

  function add(map) {
    self._m.setMap(map._m);
    return self;
  }

  function remove() {
    self._m.setMap(null);
    return self;
  }

  function path(p) {
    if (p === undefined) {
      return self._m.getPath();
    }
    self._m.setPath(p);
  }

  self = object({
    add: add,
    remove: remove,
    path: path
  });

  options = merge({
    strokeOpacity: 0.8,
    strokeWeight: 4
  }, options);

  options.strokeColor = options.strokeColor || options.color;
  if (options.map) {
    options.map = options.map._m;
  }
  if (Array.isArray(options.path)) {
    options.path = options.path.map(util.ll2gll);
  } else if (typeof options.path === 'string') {
    options.path = util.decodePath(options.path);
  }

  self._m = new _gm.Polyline(options);

  return self;
}
