module.exports = {
  pins: {
    layers: [{
      id: 'circle',
      type: 'circle',
      paint: {
        'circle-color': '#FFFFFF',
        'circle-opacity': 0,
        'circle-radius': {
          property: 'scale',
          type: 'identity'
        },
        'circle-stroke-color': '#0074D9', // azure
        'circle-stroke-opacity': 1,
        'circle-stroke-width': 5
      }
    }]
  },
  china: {
    layers: [{
      id: 'circle',
      type: 'circle',
      paint: {
        'circle-color': '#FFFFFF',
        'circle-opacity': 0,
        'circle-radius': 8,
        'circle-stroke-color': '#0074D9', // azure
        'circle-stroke-opacity': 1,
        'circle-stroke-width': 5
      }
    }, {
      id: 'polyline',
      type: 'line',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#a21bab',
        'line-width': 4,
        'line-opacity': 0.8
      }
    }, {
      id: 'polygon',
      type: 'fill',
      paint: {
        'fill-color': '#a21bab',
        'fill-opacity': 0.5,
        'fill-outline-color': '#0074D9'
      }
    }]
  }
};
