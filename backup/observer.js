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
function handleNewTarget(tgtNum) {
  console.log(tgtNum);
  if (tgtNum == 1) {
    createTarget1();
    console.log("Creating Target 1");
  } else if (tgtNum == 2) {
    createTarget2();
    console.log("Creating Target 2");
  } else if (tgtNum == 3) {
    createTarget3();
    console.log("Creating Target 3");
  } else if (tgtNum == 4) {
    createTarget4();
    console.log("Creating Target 4");
  } else {
    console.log("request for target failed");
  }
}

function handleFireMission(gridE, gridN, round) {
  console.log(gridE, gridN, round);
  const X = gridE;
  const Y = gridN;
  createHE(X, Y);
}

function createHE(X, Y) {
  console.log("createHE at ", X, Y, entityEl);
  
  var sceneEl = document.querySelector("a-scene");
  var entityEl = document.createElement("a-image");
  // Do `.setAttribute()`s to initialize the entity.
  //entityEl.setAttribute('id', 'target1');
  entityEl.setAttribute("src", "#fire");
  entityEl.setAttribute("material", "alphaTest: 0.5");
  entityEl.setAttribute("geometry", "");
  entityEl.setAttribute("side", "double");
  entityEl.setAttribute(
    "animation",
    "property: scale; from: 1 1 1; to: 10 20 10; dur: 700; loop: 2; dir: alternate"
  );
  entityEl.setAttribute("position", X + " 0 " + Y);
  
  /*
  var entityE2 = document.createElement("a-image");
  // Do `.setAttribute()`s to initialize the entity.
  //entityEl.setAttribute('id', 'target1');
  entityE2.setAttribute("src", "#cloud");
  entityE2.setAttribute("material", "alphaTest: 0.5");
  entityE2.setAttribute("geometry", "");
  entityE2.setAttribute("side", "double");
  entityE2.setAttribute(
    "animation",
    "property: scale; from: 8 1 1; to: 40 50 1; dur: 5000; loop: 1"
  );
  //entityE2.setAttribute('animation',"property: height; from: 1; to: 50; dur: 10000");
  //entityE2.setAttribute('animation',"property: width; from: 10; to: 4; dur: 7000");
  //entityE2.setAttribute('animation',"property: position; from: 10; to: 4; dur: 7000");
  entityE2.setAttribute("position", X + " 2 " + Y);
  sceneEl.appendChild(entityE2);
*/
  
  var entityE2 = document.createElement("a-image");
  entityE2.setAttribute("src", "#cloud");
  entityE2.setAttribute("material", "alphaTest: 0.1");
  entityE2.setAttribute("geometry", "");
  entityE2.setAttribute("side", "double");
  entityE2.setAttribute("rotation", "0 45 0");
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
  entityE2.setAttribute("position", X + " 0 " + Y);
  
  var entityE3 = document.createElement("a-image");
  entityE3.setAttribute("src", "#cloud");
  entityE3.setAttribute("material", "alphaTest: 0.1");
  entityE3.setAttribute("geometry", "");
  entityE3.setAttribute("side", "double");
  entityE3.setAttribute("rotation", "0 -45 0");
  entityE3.setAttribute("opacity", "0.8");
  entityE3.setAttribute(
    "animation",
    "property: scale; from: 10 10 1; to: 30 30 1; dur: 5000; loop: 1"
  );
    entityE3.setAttribute(
    "animation__2",
    "property: opacity; from: 0.8; to: 1.0; dur: 2000; loop: 1"
  );
  entityE3.setAttribute(
    "animation__3",
    "property: opacity; from: 1.0; to: 0.2; delay: 2000; dur: 120000; loop: 1"
  );  
  entityE3.setAttribute("position", X + " 0 " + Y);
  
  sceneEl.appendChild(entityE2);
  sceneEl.appendChild(entityE3);
  sceneEl.appendChild(entityEl);
  
  // delete the fire element from impact after it's animation ends
  setTimeout(function(){ 
        entityEl.parentNode.removeChild(entityEl);
   },1400); //delay is in milliseconds 
  // delete the dirt cloud after 5 min (300 sec)
  setTimeout(function(){ 
        entityE2.parentNode.removeChild(entityE2);
        entityE3.parentNode.removeChild(entityE3);
   },300000); //delay is in milliseconds 
  
}

function createTarget1() {
  var sceneEl = document.querySelector("a-scene");
  var entityEl = document.createElement("a-entity");
  // Do `.setAttribute()`s to initialize the entity.
  entityEl.setAttribute("id", "target1");
  entityEl.setAttribute("gltf-model", "#M2Bradley");
  entityEl.setAttribute("scale", "1 1 1");
  entityEl.setAttribute("rotation", "0 120 0");
  entityEl.setAttribute("position", "100 1.917 100");
  sceneEl.appendChild(entityEl);
  console.log("createTarget");
}

function createTarget2() {
  var sceneEl = document.querySelector("a-scene");
  var entityEl = document.createElement("a-entity");
  // Do `.setAttribute()`s to initialize the entity.
  entityEl.setAttribute("id", "target2");
  entityEl.setAttribute("gltf-model", "#M2Bradley");
  entityEl.setAttribute("scale", "1 1 1");
  entityEl.setAttribute("rotation", "0 120 0");
  entityEl.setAttribute("position", "0 1.917 100");
  sceneEl.appendChild(entityEl);
  console.log("createTarget");
}

function createTarget3() {
  var sceneEl = document.querySelector("a-scene");
  var entityEl = document.createElement("a-entity");
  // Do `.setAttribute()`s to initialize the entity.
  entityEl.setAttribute("id", "target3");
  entityEl.setAttribute("gltf-model", "#T90Tank");
  entityEl.setAttribute("scale", "1 1 1");
  entityEl.setAttribute("rotation", "0 90 0");
  entityEl.setAttribute("position", "-100 0 100");
  sceneEl.appendChild(entityEl);
  console.log("createTarget");
}

function createTarget4() {
  var sceneEl = document.querySelector("a-scene");
  var entityEl = document.createElement("a-entity");
  // Do `.setAttribute()`s to initialize the entity.
  entityEl.setAttribute("id", "target4");
  entityEl.setAttribute("gltf-model", "#T90Tank");
  entityEl.setAttribute("scale", "1 1 1");
  entityEl.setAttribute("rotation", "0 120 0");
  entityEl.setAttribute("position", "-100 0 0");
  sceneEl.appendChild(entityEl);
  console.log("createTarget");
}
