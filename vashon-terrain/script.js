mapboxgl.accessToken =
  "pk.eyJ1IjoiZG5vbWFkYiIsImEiOiJjaW16aXFsZzUwNHJmdjdra3h0Nmd2cjY1In0.SqzkaKalXxQaPhQLjodQcQ";
let elevationTileset = "dnomadb.vashon-dtm";
const map = new mapboxgl.Map({
  container: "map",
  zoom: 14.1,
  center: [-122.4599, 47.4473],
  pitch: 85,
  bearing: 80,
  hash: true,
  transformRequest: (r, t) => {
    const tileMatch = new RegExp(
      `${elevationTileset}/([0-9]+\/[0-9]+\/[0-9]+)`
    );
    if (t === "Tile" && tileMatch.test(r)) {
      const ZXY = tileMatch.exec(r);
      return {
        url: `https://api.mapbox.com/v4/${elevationTileset}/${ZXY[1]}@2x.pngraw?access_token=${mapboxgl.accessToken}`
      };
    }
  },
  style: {
    version: 8,
    sources: {
      hs: {
        type: "raster-dem",
        url: `mapbox://${elevationTileset}`
      }
    },
    layers: [
      {
        id: "background",
        type: "background",
        paint: {
          "background-color": "white"
        }
      },
      {
        id: "hs",
        source: "hs",
        type: "hillshade"
      }
    ]
  }
});

map.on("load", function () {
  map.addSource("dem", {
    type: "raster-dem",
    url: `mapbox://${elevationTileset}`,
    tileSize: 512
  });
  // add the DEM source as a terrain layer with exaggerated height
  map.setTerrain({ source: "dem", exaggeration: 0.3048 });

  // add a sky layer that will show when the map is highly pitched
  map.addLayer({
    id: "sky",
    type: "sky",
    paint: {
      "sky-type": "atmosphere",
      "sky-atmosphere-sun": [0.0, 0.0],
      "sky-atmosphere-sun-intensity": 15
    }
  });
  const menu = document.getElementById("menu");
  const inputs = menu.getElementsByTagName("input");
  const switchElevationSource = option => {
    const opt = `dnomadb.vashon-${option.target.id.toLowerCase()}`;
    if (opt !== elevationTileset) {
      elevationTileset = opt;
      map.setTerrain(null);
      map.removeSource("dem");
      map.removeLayer("hs");
      map.removeSource("hs");
      map.addSource("hs", {
        type: "raster-dem",
        url: `mapbox://${elevationTileset}`
      });
      map.addSource("dem", {
        type: "raster-dem",
        url: `mapbox://${elevationTileset}`,
        tileSize: 512,
        maxzoom: 16
      });
      map.addLayer({
        id: "hs",
        source: "hs",
        type: "hillshade"
      });
      map.setTerrain({ source: "dem", exaggeration: 0.3048 });

    }
  };

  for (let i = 0; i < inputs.length; i++) {
    inputs[i].onclick = switchElevationSource;
  }
});
