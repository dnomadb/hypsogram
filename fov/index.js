const cheapRuler = require("cheap-ruler")
const terrainRGBquery = require("terrain-rgb-query");
mapboxgl.accessToken = 'pk.eyJ1IjoiZG5vbWFkYiIsImEiOiJjbGdsOHRpYWcxbWxwM3NueWYwYWYwbms0In0.zb8hlW2-BNebPuQ2hhiAuw';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/empty-v9',
    center: [0, 0],
    zoom: 5
});

const make_fov = (center, principal_axis, fov, distance, start, density) => {
  fov = fov || 90;
  distance = distance || 250000;
  start = start || 1000
  density = density || 45;
  const ruler = cheapRuler(center[1], "meters");

  const interval = fov / density;
  const f_density = density / 2;
  const total = (f_density * f_density) + start
  const distances = [];
  for (let i = 1; i <= f_density; i++) {
    distances.push((i * i) / total * distance + start);
  }
  const angles = [];
  for (let a = principal_axis - (fov / 2); a < principal_axis + (fov / 2); a += interval) {
    angles.push(a);
  };
  return distances.map((d) => {
    return angles.map((a) => {
      return ruler.destination(center, d, a);
    });
  });
};


map.on('load', () => {
    const template = `https://a.tiles.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.pngraw?access_token=${mapboxgl.accessToken}`;
    const TRGB = new terrainRGBquery.TerrainRGBquery(template, 9);
    Promise.all(make_fov([-122.3321, 47.6062], 270).map((arc) => {
      return TRGB.queryElevations(arc)
    })).then((elevations) => {
      elevations = elevations.map((arc, d) => {
        const profile = arc.map((a, i) => { return [i - 22.5, (a / 500)]})
        profile.unshift([-22.5, 0]);
        profile.push([22.5, 0])
        profile.push([-22.5, 0]);
        return {
          "type": "Feature",
          "properties": {"d": d},
          "geometry": {
            "type": "Polygon",
            "coordinates": [profile]
          }
        }
      });
      console.log(elevations)
      map.addLayer({
          "id": "route",
          "type": "fill",
          "source": {
              "type": "geojson",
              "data": {
          "type": "FeatureCollection",
          "features": elevations.reverse()
          }
          },
          "paint": {
              "fill-outline-color": "hsla(0, 0%, 0%, 0)",
              "fill-color": [
              "interpolate",
              ["linear"],
              ["get", "d"],
              0,
              "hsl(201, 100%, 93%)",
              20,
              "hsl(0, 0%, 0%)"
            ]
          }
      });
    })
});
