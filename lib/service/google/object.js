var util = require('./util');

module.exports = init;

function init(self) {
  var _gm = util.gm(), listeners = {};

  function on(event, fn) {
    listeners[event] = listeners[event] || [];
    listeners[event].push({
      handler: _gm.event.addListener(self._m, event, fn),
      fn: fn
    });
    return self;
  }

  function off(event, fn) {
    if (event === undefined) {
      Object.keys(listeners).forEach(function(event) {
        listeners[event].forEach(function (listener) {
          _gm.event.removeListener(listener.handler);
        });
      });
      listeners = {};
    }
    else {
      listeners[event].some(function (listener, i, listeners) {
        if (listener.fn === fn) {
          _gm.event.removeListener(listener.handler);
          listeners.splice(i, 1);
          return true;
        }
      });
    }
    return self;
  }

  self.on = on;
  self.off = off;

  return self;
}