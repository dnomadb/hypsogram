mapboxgl.accessToken =
  "pk.eyJ1IjoiZG5vbWFkYiIsImEiOiJjbGdsOHRpYWcxbWxwM3NueWYwYWYwbms0In0.zb8hlW2-BNebPuQ2hhiAuw";

var vertexSource = `
    attribute vec2 aPos;
    uniform mat4 uMatrix;
    varying vec2 vTexCoord;

    float Extent = 8192.0;

    void main() {
        vec4 a = uMatrix * vec4(aPos * Extent, 0, 1);
        gl_Position = vec4(a.rgba);
        vTexCoord = aPos;
    }
`;
var fragmentSource = `
    precision mediump float;
    varying vec2 vTexCoord;
    uniform sampler2D uTexture;
    uniform float u_slr;

    void main() {
        float interval = 0.05;
        vec4 color = texture2D(uTexture, vTexCoord);
        float i = -10000.0 + (color.r * 255.0 * 256.0 * 256.0 + color.g * 256.0 * 255.0 + color.b * 256.0) * 0.1;
        if (i <= u_slr) {
          float g = min(u_slr - i, 10.0) / 10.0;
          gl_FragColor = vec4(1.0 - g, 1.0 - g, 1.0 - g, 1.0);
        }
        else {
          gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        }
    }           
     `;
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/empty-v9",
  center: [145, -16],
  zoom: 0,
  hash: true,
  tilt: false,
  transformRequest: (r, t) => {
    return {url: r.replace("webp", "pngraw")}
  }
});
const customlayer = new TextureLayer(
  "test",
  {
    type: "raster",
    url: "mapbox://dnomadb.etopo-2",
    tileSize: 256
  },
  setupLayer,
  render
);
map.on("load", () => {
  map.addLayer(customlayer);
});



let program;
function logGLCall(functionName, args) {   
  console.log("gl." + functionName + "(" + 
     WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");   
}
function setupLayer(map, gl) {
  gl = WebGLDebugUtils.makeDebugContext(gl, undefined, logGLCall);
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexSource);
  gl.compileShader(vertexShader);

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentSource);
  gl.compileShader(fragmentShader);

  program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.validateProgram(program);

  program.aPos = gl.getAttribLocation(program, "aPos");
  program.uMatrix = gl.getUniformLocation(program, "uMatrix");
  program.uTexture = gl.getUniformLocation(program, "uTexture");
  program.u_slr = gl.getUniformLocation(program, "u_slr");
  const vertexArray = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]);

  program.vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, program.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
}
let i = 10;
function render(gl, matrix, tiles) {
  const renderTiles = () => {
    gl.useProgram(program);
    tiles.forEach((tile) => {
      if (!tile.texture) return;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tile.texture.texture);
  
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  
      gl.bindBuffer(gl.ARRAY_BUFFER, program.vertexBuffer);
      gl.enableVertexAttribArray(program.a_pos);
      gl.vertexAttribPointer(program.aPos, 2, gl.FLOAT, false, 0, 0);
      gl.uniformMatrix4fv(program.uMatrix, false, tile.tileID.projMatrix);
      gl.uniform1i(program.uTexture, 0);
      gl.uniform1f(program.u_slr, i);
      gl.depthFunc(gl.LESS);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    });
  }
  renderTiles()
}
const slider = document.getElementById("slr")
console.dir(slider, {depth: null})
slider.oninput = function() {
  i = slider.value;
  // oninput="rangeValue.innerText = this.value"
  document.getElementById("rangeValue").innerText = this.value;
  customlayer.updateTiles()
  map.triggerRepaint()
}
