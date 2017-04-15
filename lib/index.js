var load = require('load');
var merge = require('lodash.assign');

function prepareUrl(url, params) {
  return url + '?' + Object.keys(params)
    .map(function(key) {
      return key + '=' + encodeURIComponent(params[key]);
    })
    .join('&');
}

function init(opts, fn) {
  var protocol;
  if (!fn) {
    fn = opts;
    opts = {};
  }
  opts = merge({
    v: '3'
  }, opts);
  if (typeof window !== 'undefined') {
    window._google_maps_init = function() {
      delete window._google_maps_init;
      window.google.maps.visualRefresh = true;
      if (typeof fn === 'function') {
        fn();
      }
    };

    // always use our callback
    opts.callback = "_google_maps_init";
    protocol = window.location.protocol;
    if (protocol == 'file:') {
      protocol = 'http:';
    }
    load(prepareUrl(protocol + '//maps.googleapis.com/maps/api/js', opts));
  }
}

module.exports = {
  init: init,
  collate: require('./collate'),
  info: require('./info'),
  map: require('./map'),
  marker: require('./marker'),
  outline: require('./outline'),
  polyline: require('./polyline'),
  projection: require('./projection'),
  spread: require('./spread'),
  styles: require('./styles'),
  util: require('./util')
};
