mapboxgl.accessToken =
  "pk.eyJ1IjoiZG5vbWFkYiIsImEiOiJjaW16aXFsZzUwNHJmdjdra3h0Nmd2cjY1In0.SqzkaKalXxQaPhQLjodQcQ";
let elevationTileset = "dnomadb.tinny-5";
const map = new mapboxgl.Map({
  container: "map",
  zoom: 14.1,
  center: [-122.4599, 47.4473],
  pitch: 85,
  bearing: 80,
  hash: true,
  projection: "globe",
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
  // style: "mapbox://styles/dnomadb/cl338bydj000015palsamlg8n"
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
  map.setTerrain({ source: "dem", exaggeration: 20});

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
});
