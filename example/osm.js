(function () {

  if (!window.osm_map_style_url_for_example) {
    mapboxgl.accessToken = 'pk.eyJ1IjoibWVsaXRlbGUiLCJhIjoiY2oxZ3BlcmZtMDAzNzJxb2hicndlOTU0eSJ9.6WFMFozvFpKUJA6bhLeiSA';
  }
  var maps = require('maps').init({
    service: 'mapbox'
  }, function () {

    var dataEl = document.querySelector('#data');
    var points = JSON.parse(dataEl.getAttribute('data-markers'));
    var bnds = bounds(points);
    var path = dataEl.getAttribute('data-polyline');

    var attribution = document.getElementById('attribution');

    var onReady = [
      function (map) {
        // add markers directly to map 1
        var markers = points.map(function (pt) {
          return maps.marker({
            map: map,
            position: pt
          });
        });
        setTimeout(function () {
          markers.forEach(function (mk, i) {
            mk.icon(i === 11 ? {
              url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNiIgaGVpZ2h0PSIzMCI+PHBhdGggZD0iTTAgMEgyNlYyNkgxNkwxMyAzMEwxMCAyNkgwWiIgZmlsbD0iI2Y4MDAxMiIvPjxwYXRoIGQ9Ik0yIDJIMjRWMjRIMloiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNMjEuOCAxMC40TDcuNSA2LjZWNC40SDYuNFYxOS44SDQuMlYyMkg5LjdWMTkuOEg3LjVWMTQuM1oiIGZpbGw9IiNmODAwMTIiLz48L3N2Zz4=',
              size: [26, 30]
            } : {
              color: 'violet'
            })
          });
        }, 3000);
      },
      function (map) {
        // spread markers on map 2
        var spread = maps.spread({
          map: map,
          threshold: 20
        });
        points.forEach(function (pt, i) {
          spread.add(maps.marker({
            map: map,
            icon: {
              path: 'circle',
              fillColor: 'teal',
              fillOpacity: 1,
              strokeWeight: 0,
              scale: 10
            },
            position: pt,
            label: i + 1
          }));
        });
        spread.calculate();
      },
      function (map) {
        // collate markers on map 3
        var collate = maps.collate({
          map: map
        });
        points.forEach(function (pt, i) {
          collate.add(maps.marker({
            map: map,
            color: 'orange',
            position: pt
          }));
        });
        collate.calculate();
      },
      function (map) {
        // spread AND collate markers on map 4
        var spread, collate;
        function calculate() {
          if (spread && collate) {
            spread.calculate();
            collate.calculate();
          }
        }
        var proj = maps.projection({
          map: map,
          calculate: calculate
        });
        spread = maps.spread({
          map: map,
          projection: proj
        });
        collate = maps.collate({
          map: map,
          projection: proj
        });
        points.forEach(function (pt, i) {
          var m;
          if (i % 2) {
            m = maps.marker({
              map: map,
              color: 'orange',
              position: pt,
              zIndex: 1
            });
            collate.add(m);
          }
          else {
            m = maps.marker({
              map: map,
              color: 'teal',
              position: pt,
              zIndex: 2
            });
            spread.add(m);
            collate.add(m, true);
          }
        });
        calculate();
      },
      function (map) {
        // sample markers
        sampleMarkers(maps, map);
      },
      function (map) {
        drawCircle(maps, map, points[0]);
      },
      function (map) {
        sampleChina(maps, map);
      }
    ];

    Array.prototype.slice.call(document.querySelectorAll('.map.osm')).forEach(function (mapEl, i) {
      var map = maps.map(mapEl, merge({
        style: window.osm_map_style_url_for_example || 'mapbox://styles/mapbox/streets-v9',
        zoomControl: true,
        zoomControlOptions: {
          position: 'RB'
        },
        fullscreenControl: i > 2,
        backgroundColor: '#e5c7e6',
        onReady: i <= 3 ? (function (i) {
          maps.polyline({
            map: map,
            color: '#a21bab',
            path: path
          });
          onReady[i](map);
        }).bind(undefined, i) : onReady[i]
      }, i ? {
        attributionControl: false,
        attribution: attribution
      } : {}));
      if (i > 3) {
        return map;
      }
      map.fitBounds(bnds);
    });
  });
})();
