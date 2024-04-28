// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
  gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  gl_PointSize = u_Size;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

function setupWebGL(){
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');
    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

}


let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_size = 5;
let g_selectedAngle = 0;
let g_tail = 0;
let g_body = 0;
let g_Head = 0;
let g_tailAnimation = false;
let g_bodyAnimation = false;
let g_HeadAnimation = false;

let AngleX = 0;
let AngleY = 0;

function addActionsForHtmlUI(){


  document.getElementById('animationTailOnButton').onclick = function() {g_tailAnimation = true; };
  document.getElementById('animationTailOffButton').onclick = function() {g_tailAnimation = false; };
  document.getElementById('animationBodyOnButton').onclick = function() {g_bodyAnimation = true; };
  document.getElementById('animationBodyOffButton').onclick = function() {g_bodyAnimation = false; };
  document.getElementById('animationHeadOnButton').onclick = function() {g_HeadAnimation = true; };
  document.getElementById('animationHeadOffButton').onclick = function() {g_HeadAnimation = false; };

  document.getElementById('Body').addEventListener('mousemove', function() {g_body = this.value; renderAllShapes();});
  document.getElementById('Head').addEventListener('mousemove', function() {g_Head = this.value; renderAllShapes();});

  document.getElementById('Tail').addEventListener('mousemove', function() {g_tail = this.value; renderAllShapes();});
  document.getElementById('Angle').addEventListener('mousemove', function() {g_selectedAngle = this.value; renderAllShapes(); });

}

function Undo() {
  if (g_shapesList.length > 0) {
      g_shapesList.pop(); 
      renderAllShapes(); 
  } 
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();


//canvas.onmousedown = click;
canvas.onmousemove = function(ev) {
  if (ev.buttons === 1) {
    rotation(ev);
  }
 };

  gl.clearColor(0.0, 0.0, 0.0, 1.0);


  requestAnimationFrame(tick); 
}

var g_startTime = performance.now()/ 1000.0;
var g_seconds = performance.now()/ 1000.0 - g_startTime;


function rotation(ev){
  const x = ev.clientX - canvas.getBoundingClientRect().left;
  const y = ev.clientY - canvas.getBoundingClientRect().top;

  AngleX = 360 - (x / canvas.getBoundingClientRect().width) * 360;
  AngleY = 360 - (y / canvas.getBoundingClientRect().height) * 360;
}


function updateAnimationAngles() {
  if (g_bodyAnimation) {
    g_body = (45 * Math.sin(g_seconds));
  }
  if (g_tailAnimation) {
    g_tail = 20 * Math.sin(2 * Math.PI * g_seconds)
  }
  if (g_HeadAnimation) {
    g_Head = 20 * Math.sin(2 * Math.PI * g_seconds)
  }
}


function tick() {
  g_seconds = performance.now()/1000.0 - g_startTime;
  updateAnimationAngles();
  console.log(g_seconds);
  renderAllShapes();
  requestAnimationFrame(tick);
}

var g_shapesList = [];

function click(ev) {
  let [x, y] = convertCoordinatesEventToGL(ev);
  let point;
  if(g_selectedType == POINT){
    point = new Point();
  }else if(g_selectedType == TRIANGLE) {
    point = new Triangle();
  }else if(g_selectedType == CIRCLE){
    point = new Circle();
    point.segment = g_selectedSegment;
  }
  point.position = [x,y];
  point.color = g_selectedColor.slice();
  point.size = g_size;
  g_shapesList.push(point);

  renderAllShapes();
}


function convertCoordinatesEventToGL(ev){
    
    var x = ev.clientX; 
    var y = ev.clientY; 
    var rect = ev.target.getBoundingClientRect();
    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
    return([x, y]);
}

function renderAllShapes(){
  // Clear <canvas>
  var startTime = performance.now();

  //var globalRotMat = new Matrix4().rotate(g_selectedAngle, 0, 1, 0);
  var globalRotMat = new Matrix4().rotate(AngleX, 0, 1, 0).rotate(AngleY, 1, 0, 0).rotate(g_selectedAngle, 0, 1, 0);

  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);


  renderScene();

  var duration = performance.now() - startTime;
  sendTextToHTML(" ms: " + Math.floor(duration) + "fps: " + Math.floor(10000/duration)/10, "numdot");

}
  
function sendTextToHTML(text, htmlID){
    var htmlElm = document.getElementById(htmlID);
    if(!htmlElm){
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}
function renderScene() {

  // Main body of the dog
  var body = new Cube();
  body.color = [0.6, 0.4, 0.2, 1.0]; 
  body.matrix.setTranslate(-0.4, -0.3, 0.0);
  body.matrix.rotate(g_body, 0, 1, 0); 
  var bodyconstruct = new Matrix4(body.matrix);
  body.matrix.scale(1, 0.5, 0.5);
  body.render();

    // Head of the dog
    var head = new Cube();
    head.color = [1.0, 0.8, 0.6, 1.0]; // Light brown for the head
    head.matrix = bodyconstruct;
    head.matrix.translate(-0.4, 0.2, 0.0);
    var consruct = new Matrix4(head.matrix);
    head.matrix.scale(0.5, 0.5, 0.5);
    head.render();

  // nose
  var nose = new Oval();
  nose.color = [1.0, 0.0, 0.0, 1.0];
  nose.matrix = consruct;
  nose.matrix.translate(-0.05, 0.2, 0.25);
  nose.matrix.rotate(g_Head, 0, 1, 0); 
  nose.matrix.scale(0.1, 0.1, 0.1);
  nose.render();

    // Left ear
  var leftear = new Cube();
  leftear.color = [1.0, 1.0, 1.0, 1.0]; // White for the eyes
  leftear.matrix = consruct;
  leftear.matrix.translate(2.0, 3.0, 0.25);
  leftear.matrix.scale(1, 1, 0.5);
  leftear.render();


  // right ear
  var rightear = new Cube();
  rightear.color = [1.0, 1.0, 1.0, 1.0]; // White for the eyes
  rightear.matrix = consruct;
  rightear.matrix.translate(2.0, 0.0, 0.25);
  rightear.matrix.scale(1, 1, 0.5);
  rightear.render();

    // front left leg
    var legBackRight = new Cube();
    legBackRight.color = [0.5, 0.3, 0.1, 1.0]; // Darker brown
    legBackRight.matrix = bodyconstruct;
    legBackRight.matrix.translate(1.0, -1.1, 0.5);
    legBackRight.matrix.scale(0.25, 0.7, 0.15);
    legBackRight.render();

      // back left leg
      var legFrontRight = new Cube();
      legFrontRight.color = [0.5, 0.3, 0.1, 1.0]; // Darker brown
      legFrontRight.matrix = bodyconstruct;
      legFrontRight.matrix.translate(2.0, -0.04, 1);
      legFrontRight.matrix.scale(1.0, 1.9, 0.15);
      legFrontRight.render();

    // back left leg
    var legBackLeft = new Cube();
    legBackLeft.color = [0.5, 0.3, 0.1, 1.0]; // Darker brown
    legBackLeft.matrix = bodyconstruct;
    legBackLeft.matrix.translate(3.0, -0.03, 1);
    legBackLeft.matrix.scale(1.0, 0.9, 0.15);
    legBackLeft.render();

    // back right leg
    var legBackRight = new Cube();
    legBackRight.color = [0.5, 0.3, 0.1, 1.0]; // Darker brown
    legBackRight.matrix = bodyconstruct;
    legBackRight.matrix.translate(1.4, -0.01, 0.50);
    legBackRight.matrix.scale(1.0, 0.67, 0.15);
    legBackRight.render();

  // Tail of the dog
  var tail = new Cube();
  tail.color = [0.9, 0.7, 0.5, 1.0]; // Lighter brown, almost beige
  tail.matrix = bodyconstruct;
  tail.matrix.translate(0.8, 0.7, 0.5);
  tail.matrix.rotate(g_tail, 0, 1, 0); 
  tail.matrix.rotate(45, 0, 1, 0);
  tail.matrix.scale(0.5, 1.0, 0.15);
  tail.render();

}