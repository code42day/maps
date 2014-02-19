var util = require('./util'),
  merge = require('object').merge;

module.exports = projection;

function projection(options) {
  var _gm = util.gm(), _g;

  function position(p) {
    return _g.fromLatLngToContainerPixel(p);
  }

  function location(p) {
    return _g.fromContainerPixelToLatLng(p);
  }

  merge(new _gm.OverlayView(), {
    onAdd: function() {
      _g = this.getProjection();
    },
    onRemove: function () {},
    draw: function () {
      options.calculate();
    }
  }).setMap(options.map._g);

  function isReady() {
    return Boolean(_g);
  }

  return {
    position: position,
    location: location,
    isReady: isReady
  };
}