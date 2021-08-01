const opEasting = padGrid(82030);
const opNorthing = padGrid(79507);
console.log(opNorthing);
const opDesignator = "18TWL";
var opMgrsStr = opDesignator+opEasting+opNorthing;
console.log(opMgrsStr);
const [lon, lat] = mgrs.toPoint(opMgrsStr);
console.log("OP at lat: "+lat+" lon: "+lon);
const easting = "1234";
console.log(easting.toString().length);

// Allow logging to console from inside A-Frame
AFRAME.registerComponent("log", {
  schema: { type: "string" },

  init: function() {
    var stringToLog = this.data;
    console.log(stringToLog);
  }
});

// Initial connection
const urlParams = new URLSearchParams(window.location.search); // get all parameters from the url
const code = urlParams.get("game"); //get the variable we want
  console.log("Attempt join game:", code);
var socket = io("https://observed-fire-simulator.glitch.me/");
  console.log(socket);
socket.on("connect", () => {
  console.log("Connected " + socket.id);
});
socket.emit("joinGame", code);

// react to incoming messages
socket.on("reply", data => {
  console.log(data);
});

socket.on("target", data => {
  handleNewTarget(data);
});
socket.on("firemissionG", (data1, data2, data3) => {
  handleFireMission(data1, data2, data3);
});

// Observed Fire Sim Functions
function convertGrid(easting,northing) {
  var E = padGrid(easting);
  var N = padGrid(northing);
  var Y =  opNorthing - N;
  var X = E - opEasting;
  return [X, Y];
  console.log("east",easting,E,X);
  console.log("north",northing,N,Y);
  console.log("OP",opEasting,opNorthing);
}

function padGrid(ening) {
  var len = ening.toString().length;
  console.log("length: "+len);
  var Xin;
  if (len==3){
      Xin = Number(ening+"00");
    }else if (len==4){
      Xin = Number(ening+"0");
    }else if (len==5){
      Xin = Number(ening);    
  } else {
    console.log("Bad grid");
    alert("Grid must be in 6, 8, or 10 digit format")
  }
  return Xin;
}

function handleNewTarget(tgtNum) {
  console.log(tgtNum);
  if (tgtNum == 1) {
    createTarget(100,0);
    console.log("Creating Target 1");
  } else if (tgtNum == 2) {
    createTarget(100,100);
    console.log("Creating Target 2");
  } else if (tgtNum == 3) {
    createTarget(300,-175);
    console.log("Creating Target 3");
  } else if (tgtNum == 4) {
    createTarget(160,880);
    console.log("Creating Target 4");
  } else {
    console.log("request for target failed");
  }
}

function handleFireMission(gridE, gridN, round) {
  console.log(gridE, gridN, round);
  var [X,Y] = convertGrid(gridE,gridN);
  //const X = gridE;
  //const Y = gridN;
  console.log(X,Y);
  createIDF(X, Y);
}

function getGroundLevel(X, Z) {
  const location = new THREE.Vector3(X, 9000, Z);
  const direction = new THREE.Vector3(0, -1, 0);
  const raycaster = new THREE.Raycaster();
  raycaster.set(location, direction);

  const mesh = document.querySelector("#ground").sceneEl.object3D;
  const intersects = raycaster.intersectObject(mesh, true);

  return {
    point: intersects[0].point, // a three value point XYZ in world coord
    normal: intersects[0].face.normal //a three part vector for the normal to face at that point
  };
}

function createTarget(X, Z, Model = "#T90Tank", Az = 0) {
  var groundLevel = getGroundLevel(X, Z);
  var position = groundLevel.point;
  var normal = groundLevel.normal;

  var sceneEl = document.querySelector("a-scene");
  var entityEl = document.createElement("a-entity");
  //entityEl.setAttribute("id", "target1");  //needs to be unique
  entityEl.setAttribute("position", position);
  var entityE2 = document.createElement("a-entity");
  entityE2.setAttribute("gltf-model", Model); //can I abstract model if scale and position may be affected? may need ifs
  entityE2.setAttribute("scale", "1 1 1");
  entityE2.setAttribute("position", "0 0 0");
  entityE2.setAttribute("rotation", "0 " + Az + " 0"); // rotate to Az for facing direction-my not match map bearing

  // append entities to build up scene
  entityEl.appendChild(entityE2);
  sceneEl.appendChild(entityEl);
  entityEl.object3D.lookAt(normal); //sit correctly on terrain
  console.log("Target Created at ", position);
}

function createIDF(X, Z) {
  var groundLevel = getGroundLevel(X, Z);
  var position = groundLevel.point;

  var sceneEl = document.querySelector("a-scene");
  var entityEl = document.createElement("a-entity");
  entityEl.setAttribute("position", position);
  var entityFire1 = createFireEl(45);
  var entityFire2 = createFireEl(-45);
  var entitySmoke1 = createSmokeEl(0);
  var entitySmoke2 = createSmokeEl(90);

  entityEl.appendChild(entityFire1);
  entityEl.appendChild(entityFire2);
  entityEl.appendChild(entitySmoke1);
  entityEl.appendChild(entitySmoke2);
  sceneEl.appendChild(entityEl);

  setTimeout(function() {
    entityEl.parentNode.removeChild(entityEl);
  }, 300000); //delay is in milliseconds
}

function createFireEl(Rot = 0) {
  var entityFire = document.createElement("a-image");
  entityFire.setAttribute("src", "#fire");
  entityFire.setAttribute("material", "alphaTest: 0.5");
  entityFire.setAttribute("geometry", "");
  entityFire.setAttribute("side", "double");
  entityFire.setAttribute("rotation", "0 " + Rot + " 0");
  entityFire.setAttribute(
    "animation",
    "property: scale; from: 1 1 1; to: 10 20 10; dur: 700; loop: 2; dir: alternate"
  );
  entityFire.setAttribute("position", "0 0 0");
  return entityFire;
}

function createSmokeEl(Rot = 0) {
  var entityE2 = document.createElement("a-image");
  entityE2.setAttribute("src", "#cloud");
  entityE2.setAttribute("material", "alphaTest: 0.1");
  entityE2.setAttribute("geometry", "");
  entityE2.setAttribute("side", "double");
  entityE2.setAttribute("rotation", "0 " + Rot + " 0");
  entityE2.setAttribute("opacity", "0.8");
  entityE2.setAttribute(
    "animation",
    "property: scale; from: 10 10 1; to: 30 30 1; dur: 5000; loop: 1"
  );
  entityE2.setAttribute(
    "animation__2",
    "property: opacity; from: 0.8; to: 1.0; dur: 2000; loop: 1"
  );
  entityE2.setAttribute(
    "animation__3",
    "property: opacity; from: 1.0; to: 0.2; delay: 2000; dur: 120000; loop: 1"
  );
  entityE2.setAttribute("position", "0 0 0");
  return entityE2;
}


document.addEventListener("keypress", function(e){
  console.log("keypress",e.keyCode);
    if(e.keyCode == 32) { //space bar
      swapCameras();      
    };
});

if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
  console.log("mobile");
  document.addEventListener("click", swapCameras);
}else{
  console.log("not mobile");
}


function swapCameras() {
  var mainCameraEl = document.querySelector('#camera1');
  var secondCameraEl = document.querySelector('#camera2');
  console.log("main cam",mainCameraEl.getAttribute('camera').active);
  if (mainCameraEl.getAttribute('camera').active) {
    mainCameraEl.setAttribute('camera', 'active', false);
    mainCameraEl.setAttribute('visible', false);
    secondCameraEl.setAttribute('camera', 'active', true);
  } else {
    mainCameraEl.setAttribute('camera', 'active', true);
    mainCameraEl.setAttribute('visible', true);
    secondCameraEl.setAttribute('camera', 'active', false);
  };
  console.log("swap cameras")
}
