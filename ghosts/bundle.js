(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const syncMove = require("@mapbox/mapbox-gl-sync-move");
const styleA = {
  version: 8,
  terrain: { source: "mapbox-dem", exaggeration: 0.3 },
  sources: {
    hs: {
      type: "raster-dem",
      url: "mapbox://dnomadb.vashon-dsm",
      tileSize: 512,
      bounds: [-180, -85.05112877980659, 180, 85.0511287798066],
      encoding: "mapbox",
      paint: {
        "hillshade-highlight-color": "#fc9236"
      }
    },
    "mapbox-dem": {
      type: "raster-dem",
      url: "mapbox://dnomadb.vashon-dsm",
      tileSize: 512,
      encoding: "mapbox"
    }
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "black" }
    },
    {
      id: "hs",
      type: "hillshade",
      source: "hs",
      paint: { "hillshade-exaggeration": 1, "hillshade-highlight-color": "#fc9236"}
    },
    {
      id: "sky",
      type: "sky",
      paint: {
        "sky-type": "atmosphere",
        "sky-atmosphere-sun": [0, 0],
        "sky-atmosphere-sun-intensity": 0
      }
    }
  ]
};
const styleB = {
  version: 8,
  terrain: { source: "mapbox-dem", exaggeration: 0.3 },
  sources: {
    hs: {
      type: "raster-dem",
      url: "mapbox://dnomadb.vashon-dtm",
      tileSize: 512,
      bounds: [-180, -85.05112877980659, 180, 85.0511287798066],
      encoding: "mapbox"
    },
    "mapbox-dem": {
      type: "raster-dem",
      url: "mapbox://dnomadb.vashon-dtm",
      tileSize: 512,
      encoding: "mapbox"
    }
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "black" }
    },
    {
      id: "hs",
      type: "hillshade",
      source: "hs",
      paint: { "hillshade-exaggeration": 1, "hillshade-highlight-color": "#fc9236"}
    },
    {
      id: "sky",
      type: "sky",
      paint: {
        "sky-type": "atmosphere",
        "sky-atmosphere-sun": [0, 0],
        "sky-atmosphere-sun-intensity": 0
      }
    }
  ]
};
mapboxgl.accessToken =
  "pk.eyJ1IjoiZG5vbWFkYiIsImEiOiJjaW16aXFsZzUwNHJmdjdra3h0Nmd2cjY1In0.SqzkaKalXxQaPhQLjodQcQ";
const A = new mapboxgl.Map({
  container: "map-A",
  style: styleA,
  center: [-122.5071214,47.3514433],
  zoom: 9,
  hash: true,
  customAttribution: '<a href="https://www.dnr.wa.gov/lidar" target="_blank">data</a> | <a href="https://twitter.com/DnomadB" target="_blank">@dnomadb</a>',
  transformRequest: (r, t) => {
    if (t === "Tile" && /dnomadb.vashon-dsm/.test(r)) {
      const ZXY = /v4\/dnomadb\.vashon-dsm\/(\d+\/\d+\/\d+)/.exec(r);
      return {
        url: `https://api.mapbox.com/v4/dnomadb.vashon-dsm/${ZXY[1]}@2x.pngraw?access_token=${mapboxgl.accessToken}`
      };
    }
  }
});


const B = new mapboxgl.Map({
  container: "map-B",
  style: styleB,
  center: [-122.5071214,47.3514433],
  zoom: 9,
  hash: true,
  transformRequest: (r, t) => {
    if (t === "Tile" && /dnomadb.vashon-dtm/.test(r)) {
      const ZXY = /v4\/dnomadb\.vashon-dtm\/(\d+\/\d+\/\d+)/.exec(r);
      return {
        url: `https://api.mapbox.com/v4/dnomadb.vashon-dtm/${ZXY[1]}@2x.pngraw?access_token=${mapboxgl.accessToken}`
      };
    }
  }
});

syncMove(A, B);

},{"@mapbox/mapbox-gl-sync-move":2}],2:[function(require,module,exports){
function moveToMapPosition (master, clones) {
  var center = master.getCenter();
  var zoom = master.getZoom();
  var bearing = master.getBearing();
  var pitch = master.getPitch();

  clones.forEach(function (clone) {
    clone.jumpTo({
      center: center,
      zoom: zoom,
      bearing: bearing,
      pitch: pitch
    });
  });
}

// Sync movements of two maps.
//
// All interactions that result in movement end up firing
// a "move" event. The trick here, though, is to
// ensure that movements don't cycle from one map
// to the other and back again, because such a cycle
// - could cause an infinite loop
// - prematurely halts prolonged movements like
//   double-click zooming, box-zooming, and flying
function syncMaps () {
  var maps;
  var argLen = arguments.length;
  if (argLen === 1) {
    maps = arguments[0];
  } else {
    maps = [];
    for (var i = 0; i < argLen; i++) {
      maps.push(arguments[i]);
    }
  }

  // Create all the movement functions, because if they're created every time
  // they wouldn't be the same and couldn't be removed.
  var fns = [];
  maps.forEach(function (map, index) {
    fns[index] = sync.bind(null, map, maps.filter(function (o, i) { return i !== index; }));
  });

  function on () {
    maps.forEach(function (map, index) {
      map.on('move', fns[index]);
    });
  }

  function off () {
    maps.forEach(function (map, index) {
      map.off('move', fns[index]);
    });
  }

  // When one map moves, we turn off the movement listeners
  // on all the maps, move it, then turn the listeners on again
  function sync (master, clones) {
    off();
    moveToMapPosition(master, clones);
    on();
  }

  on();
}

module.exports = syncMaps;

},{}]},{},[1]);
