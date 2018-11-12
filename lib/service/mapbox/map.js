const images = require('./images');
const object = require('./object');
const updater = require('./updater');
const util = require('./util');
const makeFeatureEventHandler = require('./feature-event-handler');
const query = require('./query');

module.exports = map;

/* global mapboxgl */

function transition(prop) {
  const _m = this;
  _m[prop] = Object.assign(function (options) {
    if (options.zoom) {
      options.zoom = Math.floor(options.zoom);
    }
    _m[prop].superior.apply(this, arguments);
  }, {
    superior: _m[prop]
  });
}

function getAttribution(result, attr) {
  attr = attr.slice(6).match(/(?:http:|https:)?\/\/([^\/?]+)/);
  if (attr) {
    attr = attr[1].split('.');
    if (attr.length > 1) {
      attr = attr[attr.length - 2];
    }
    if (attr) {
      result.push(attr);
    }
  }
  return result;
}

function preprocessDataEvent(event) {
  if (!(event.dataType === 'source' &&
      event.tile &&
      event.tile.state === 'loaded')) {
    return true;
  }
  if (event.style &&
      event.style.sourceCaches &&
      event.sourceId) {
    // collect attributions
    let attribution = event.style.sourceCaches[event.sourceId].getSource().attribution;
    if (attribution) {
      attribution = attribution.match(/href="[^"]+/g);
      if (attribution) {
        event.attribution = attribution.reduce(getAttribution, []);
      }
    }
  }
  return true;
}

function map(node, options) {
  let self;
  let mapTypeId;
  let styles;

  function element() {
    return node;
  }

  function center(c) {
    if (!c) {
      return util.mll2ll(self._m.getCenter());
    }
    self._m.setCenter(c);
  }

  function zoom(z) {
    if (z === undefined) {
      return Math.round(self._m.getZoom() + 1);
    }
    self._m[self._m.isStyleLoaded() ? 'zoomTo' : 'setZoom'](z - 1);
  }

  function bounds(b) {
    if (b === undefined) {
      return util.mbounds2bounds(self._m.getBounds());
    }
    let opt = {
      padding: 100
    };
    if (!self._m.isStyleLoaded()) {
      opt.animate = false;
    }
    self._m.fitBounds(b, opt);
  }

  function panToBounds(bounds) {
    // display north-west corner
    self._m.panTo([bounds[1][0], bounds[0][1]]);
    return self;
  }

  function panBy(x, y) {
    self._m.panBy([x, y]);
    return self;
  }

  function mapType() {
    return mapTypeId;
  }

  function refresh(source) {
    if (!source) {
      return self._m.resize();
    }
    var layers = [];
    layers.source = source;
    layers._layers = self._m.style._layers;
    layers = self._m.style._order.reduce(function (result, key, i, layers) {
      var layer = result._layers[key];
      if (layer.source === result.source) {
        result.unshift({
          layer: layer.serialize(),
          before: layers[i + 1]
        });
      }
      return result;
    }, layers);
    layers.forEach(function ({ layer }) {
      self._m.removeLayer(layer.id);
    });
    var sourceDef = self._m.getSource(source).serialize();
    self._m.removeSource(source);
    self._m.addSource(source, sourceDef);
    layers.forEach(function ({ layer, before }) {
      self._m.addLayer(layer, before);
    });
  }

  function setVisibility(style) {
    var visibility = this;
    if (self._m.getLayer(style.layer.id)) {
      self._m.setLayoutProperty(style.layer.id, 'visibility',
          style.visibility(visibility) ? 'visible' : 'none');
    }
  }

  function applyVisibility(visibility) {
    styles.visibility.forEach(setVisibility, visibility);
  }

  function checkSingleProperty(property, object) {
    return object[property];
  }

  function checkProperty(property) {
    var object = this;
    return checkSingleProperty(property, object);
  }

  function checkAnyProperty(properties, object) {
    return properties.some(checkProperty, object);
  }

  function checkAllProperties(properties, object) {
    return properties.every(checkProperty, object);
  }

  function initStyles() {
    if (!styles) {
      let style = self._m.getStyle();
      if (style.layers) {
        styles = style.layers.reduce((result, layer) => {
          if (layer.metadata) {
            if (layer.metadata.visibility) {
              var visibility;
              if (Array.isArray(layer.metadata.visibility)) {
                if (layer.metadata.visibility[0] === 'all') {
                  visibility = checkAllProperties.bind(undefined, layer.metadata.visibility.slice(1));
                }
                else {
                  visibility = checkAnyProperty.bind(undefined, layer.metadata.visibility.slice(1));
                }
              }
              else {
                visibility = checkSingleProperty.bind(undefined, layer.metadata.visibility);
              }
              result.visibility.push({
                layer,
                visibility
              });
            }
            if (layer.metadata.zindex) {
              let zi = layer.metadata.zindex;
              self._layers[zi] = self._layers[zi] || [];
              self._layers[zi].unshift(layer);
            }
          }
          if (layer['source-layer'] === 'poi') {
            result.poi.push(layer.id);
          }
          return result;
        }, {
          poi: [],
          visibility: []
        });
        applyVisibility(options.visibility);
      }
    }
  }

  function callback(e) {
    if (e.dataType === 'style') {
      initStyles();
      if (options.onReady) {
        options.onReady(self);
      }
    }
  }

  function ll(e) {
    if (e && e.lngLat) {
      e.ll = util.mll2ll(e.lngLat);
    }
  }

  function queryRenderedFeatures(point, options = {}) {
    if (options.layers === undefined && styles) {
      options.layers = styles.poi;
    }
    return query(self._m, point, 3, options).map(({ properties }) => properties);
  }

  function visibility(key, value) {
    if (key === undefined) {
      return options.visibility;
    }
    if (typeof key === 'object') {
      options.visibility = key;
    }
    else {
      options.visibility[key] = value;
    }
    applyVisibility(options.visibility);
  }

  function destroy() {
    if (self._updater) {
      self._updater.destroy();
      delete self._updater;
    }
    if (self._m) {
      self.off();
      self._m.remove();
      self._images.destroy();
      delete self._m;
      delete self._images;
      delete self._layers;
    }
    styles = undefined;
  }

  options = Object.assign({
    mapboxgl,
    container: node,
    style: {
      version: 8,
      sources: {},
      layers: []
    },
    visibility: {}
  }, options);

  self = object({
    bounds,
    center,
    destroy,
    element,
    fitBounds: bounds, // obsolete; use bounds(b)
    ll,
    mapType,
    panBy,
    panToBounds,
    queryRenderedFeatures,
    refresh,
    visibility,
    zoom
  }, {
    preprocessEvent: {
      data: preprocessDataEvent
    }
  });

  if (options.zoom) {
    options.zoom -= 1;
  }
  if (options.minZoom) {
    options.minZoom -= 1;
  }
  if (options.maxZoom) {
    options.maxZoom -= 1;
  }

  self._m = new options.mapboxgl.Map(options);
  self._m.touchZoomRotate.disableRotation();
  self._featureEventHandler = makeFeatureEventHandler(self._m);
  self._images = images();
  self._layers = {};
  self._updater = updater();

  // ensure integral zoom
  ['flyTo', 'easeTo'].forEach(transition, self._m);

  self._m.once('styledata', callback);

  return self;
}
