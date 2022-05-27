var lat = 0;
var lon = 0;
var az = 0;
var opGrid = [];
var opParts = [];
var opEasting = [];
var opNorthing = [];
var hitDistSq = 2500; //50m squared (using the squared distance vector)

AFRAME.registerComponent('checkload', {
  init: function () {
    this.el.addEventListener('loaded', function (event) {
      console.log('Loaded', event);
    })
  }
});//end component 

AFRAME.registerComponent('compass', {
  init: function () {
    const sceneEl = document.querySelector('a-scene');
    const camViewEl = sceneEl.querySelector("#viewDirection");
    console.log(camViewEl);
  },
  tick: function () {
    const sceneEl = document.querySelector('a-scene');
    const cameraRigEl = sceneEl.querySelector('#camera-rig');
    const camViewEl = sceneEl.querySelector("#viewDirection");
    var camRigRot = cameraRigEl.getAttribute('rotation').y;
    var rotationRaw = camViewEl.getAttribute('rotation').y;
    var rotation = parseFloat(camRigRot) + parseFloat(rotationRaw);
    var viewAz = rot2bearing(rotation);
    var viewAzMils = deg2mils(viewAz);
    viewAz = Math.round(viewAz);
    viewAzMils = Math.round(viewAzMils);
    this.el.setAttribute('text','value',viewAz.toString() +" deg\n"+ viewAzMils.toString() +" mils");     
  }        
});//end component 

AFRAME.registerComponent('compassdial', {
  init: function () {
    const sceneEl = document.querySelector('a-scene');
    const camViewEl = sceneEl.querySelector("#viewDirection");
    console.log(camViewEl);
    //this.tick = AFRAME.utils.throttleTick(this.tick, 300, this); 
    this.el.addEventListener('loaded', function (event) {
  console.log('Loaded', event);
      //this.previousError = 0;
    });
  },
  tick: function (time,delta) {
    const sceneEl = document.querySelector('a-scene');
    const cameraRigEl = sceneEl.querySelector('#camera-rig');
    const camViewEl = sceneEl.querySelector("#viewDirection");
    var camRigRot = cameraRigEl.getAttribute('rotation').y;
    var rotationRaw = camViewEl.getAttribute('rotation').y;
    var rotation = parseFloat(camRigRot) + parseFloat(rotationRaw);
    var error = Math.sin(time/300);//(Math.random() * 3)-1.5;         
    this.el.object3D.rotation.y= (error-rotation)*0.01745329251994329576923690768489;  //convert degree to radians, and right to left hand
  }
});//end component 

AFRAME.registerComponent('gps', {

  init: function () {    
    //add display to DOM
    const newGPSDiv = document.createElement('div');
    newGPSDiv.setAttribute("id", "gps-block");
    const newGPSSpan = document.createElement('span');
    newGPSSpan.setAttribute("id", "gps-text-block");
    newGPSSpan.innerText = "Acquiring \n Satalites";
    newGPSDiv.appendChild(newGPSSpan);
    document.body.insertBefore(newGPSDiv,null); //before null = end of document
    newGPSDiv.style.visibility = 'hidden';
    
    //set refresh rate
    this.tick = AFRAME.utils.throttleTick(this.tick, 1000, this);   
    console.log("GPS Loaded");
  },
  tick: function () {
    const gpstextblock = document.getElementById('gps-text-block');
    if (document.getElementById('gps-block').style.visibility == 'visible') {
      const sceneEl = document.querySelector('a-scene');
      const cameraRigEl = sceneEl.querySelector('#camera-rig');
      const camViewEl = sceneEl.querySelector("#viewDirection");
      var camRigPos = cameraRigEl.getAttribute('position');
      var camPosRaw = camViewEl.getAttribute('position');
      var camPosX = camRigPos.x + camPosRaw.x;
      var camPosZ = camRigPos.z + camPosRaw.z;
      var N = +opNorthing - camPosZ;
      var E = +opEasting + camPosX ;
      console.log("Position",Math.round(E), Math.round(N));
      var gpsError1 = (Math.random() * 10)-5;
      var gpsError2 = (Math.random() * 10)-5;
      var viewGpsE = Math.round(E + gpsError1);
      var viewGpsN = Math.round(N + gpsError2);
      var textToDisplay = opParts.zoneNumber.toString() + 
            opParts.zoneLetter.toString() +"\n" + opParts.hunK +
            "\n" + viewGpsE.toString() +"e\n"+ viewGpsN.toString() + "n";
      gpstextblock.innerText = textToDisplay;
    };
  }       
});//end component 

AFRAME.registerComponent('ground-clamp', {
        schema: {
          height: {default: 0},
        },

    tick: function () {
        var position = this.el.object3D.position;

        var location = new THREE.Vector3(position.x, 9000, position.z);
        const direction = new THREE.Vector3(0, -1, 0);
        const raycaster = new THREE.Raycaster();
        raycaster.set(location, direction);

        const mesh = document.querySelector("#ground").object3D;
        var intersects = raycaster.intersectObject(mesh, true);
      
      if (intersects.length > 0){
        var point = intersects[0].point; // a three value point XYZ in world coord
        var Y = point.y + this.data.height;
        this.el.object3D.position.y=Y;    
      }
    }
  }); //end component 

AFRAME.registerComponent('groundcheck', {
    schema: {
        height: {default: 0},
    },
    init: function () {
        this.tick = AFRAME.utils.throttleTick(this.tick, 1000, this);    
    },

    tick: function () {
        var position = this.el.object3D.position;
        var location = new THREE.Vector3(position.x, 9000, position.z);
        const direction = new THREE.Vector3(0, -1, 0);
        const raycaster = new THREE.Raycaster();
        raycaster.set(location, direction);

        const mesh = document.querySelector("#ground").object3D;
        var intersects = raycaster.intersectObject(mesh, true);
      
      if (intersects.length > 0){
        var point = intersects[0].point; // a three value point XYZ in world coord
        var Y = point.y + this.data.height;
        this.el.object3D.position.y=Y;  //set onto ground
        //console.log(this.el.components.type.data);
        if (this.el.components.type.data=="tank") {
          var normal = intersects[0].face.normal;
          var normal2 = new THREE.Vector3(normal.z, normal.y, normal.x).normalize();  
          var up = new THREE.Vector3( 0, 0, 1);          
          this.el.object3D.quaternion.setFromUnitVectors(up, normal2);
          var up2 = new THREE.Vector3( 0, 1, 0);
          this.el.object3D.rotateOnAxis(up2,-1.5708);
        }
      }
    }
  }); //end component 

AFRAME.registerComponent('loadscreen', {
  
  init: function () {
        this.rendercount=0;
        this.loadcomplete=false;
    },

    tock: function () {
      if (this.loadcomplete) {return};
      let a = document.querySelector("#ground").object3D.children.length;
      if (a>0 && this.rendercount>a+1) { 
        // Done loading. Hide splash screen
        console.log("LOADER: Done loading",a);        
        this.loadcomplete=true;
        document.querySelector('#splash').style.display = 'none';
        document.getElementById("progress-bar").value = 1;
      } else if (a>0 && this.rendercount>a) {
        // Done with terrain, hide compass
        this.rendercount +=1;
        let ok = setCamView('main');
        document.getElementById("progress-bar").value = 0.99;
        console.log("LOADER: hide compass");        
      } else if (a>0 && this.rendercount<=a ) {
        // Terrain tiles loaded, wait while they move to correct location
        this.rendercount +=1;
        document.getElementById("progress-bar").value = 0.45 + (0.5*(this.rendercount/a));
        console.log("LOADER: loading ground " + this.rendercount + " of " + a);
      }else {
        // Terrain tiles not loaded. Wait.
        console.log("LOADER: Awaiting ground info",a);
        document.getElementById("progress-bar").value = 0.4;
      };
    }
  }); //end component

// Allow logging to console from inside A-Frame
AFRAME.registerComponent("log", {
  schema: { type: "string" },

  init: function() {
    var stringToLog = this.data;
    console.log(stringToLog);
  }
}); //end component 

AFRAME.registerComponent('type', {
  schema: {type: 'string', default: "tank"}
  //init: function () {},
  //update: function () {},
  //tick: function () {},
  //remove: function () {},
  //pause: function () {},
  //play: function () {}
}); //end component 


// Initial socket connection
const urlParams = new URLSearchParams(window.location.search); // get all parameters from the url
const code = urlParams.get("game"); //get the variable we want
console.log("Attempt join game:", code);
const urlOrigin = window.location.origin;
var socket = io(urlOrigin);
console.log("Socket: ", socket);

// First time connection, join game
socket.once("connect", () => {
  console.log("Connected " + socket.id);
  socket.emit("joinGame", code);  
});

// Receive and parse the scenario info, including targets
socket.on('scenarioInfo', (scenarioJSON,targetsJSON)=>{
    console.log(scenarioJSON);
    console.log(targetsJSON);
    const scenario = JSON.parse(scenarioJSON);
    const targets = JSON.parse(targetsJSON);
    console.log(scenario);
    console.log(targets);
  
    lat = scenario.lat;
    lon = scenario.lon;
    az = -1 * scenario.az;
  
    createTerrain(lat,lon);
    setCamera(az);  
    initializeOpLocation(scenario.lat,scenario.lon,scenario.az);
    initializeTargets(targets);
  });

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

socket.on('unknownCode',handleUnknownCode);

socket.on('reset',handleReset);

function createTerrain (lat,lon) {
    var sceneEl = document.querySelector("a-scene");
    var entityEl = document.createElement("a-entity");
    entityEl.setAttribute("id","ground");
    entityEl.setAttribute("class","ground");
    entityEl.setAttribute("render-order","foreground");
    entityEl.setAttribute("static-body","");
    console.log("fovpad:5;elevation:0;lod:14;latitude:"+lat+";longitude:"+lon);
    entityEl.setAttribute("a-terrain", "fovpad:5;elevation:0;lod:14;latitude:"+lat+";longitude:"+lon+";");
    sceneEl.appendChild(entityEl);
    // the A-Terrain system will then take its time to create and load the tiles
    // this is async and does not send an ack
}

function setCamera (az) {
      var cameraRigEl = document.querySelector('#camera-rig');
      cameraRigEl.setAttribute("rotation","0 "+az+" 0");
      console.log("Camera Rig az",az);
}

function handleUnknownCode() {
  alert('Unknown Game Code');
  //forward to the index page to re-enter code or start new
  window.location.href = urlOrigin+'/index.html';
}

function initializeOpLocation(lat,lon,az) {
  console.log("Attempt lat/lon:",lat,lon);
  const opGrid = mgrs.forward([lon, lat],5);
  opParts = mgrs.decode(opGrid) ;
  opEasting = opParts.easting.toString().slice(-5);
  opNorthing = opParts.northing.toString().slice(-5);
  console.log("E:"+opEasting+" N:"+opNorthing);
}

function initializeTargets(targets) {
  console.log("Start target setup ", targets) ;
  targets.forEach(parseTarget);  
}

function parseTarget(item){
  if (item){
    console.log(item);
    var gridE = item.e;
    var gridN = item.n;
    var Model = item.model;
    var Az = item.az;
    if (Model=="squad") {
      console.log("squad at: " + gridE + " " + gridN);
      createSquad(gridE, gridN, Az);
    } else {
      console.log("target at: " + gridE + " " + gridN);
      createTarget(gridE, gridN, Model, Az);
    }    
  } else {
    console.log("target item null");
  }
}
  
function createSquad(gridE, gridN, Az = 0){
  console.log("building squad");
  const azRad = (Az)*(0.01745329251994329576923690768489); //Az in degrees, convert to radians
  console.log("squad az", Az,azRad);
  // x in n  y in e
  const n1 = Math.round( 18*Math.cos(azRad));
  const n2 = Math.round( 13*Math.cos(azRad-0.57));
  const n3 = Math.round( 13*Math.cos(azRad+0.57));
  const n4 = Math.round( 15*Math.cos(azRad-1.23));
  const n5 = Math.round( 16*Math.cos(azRad+3.14));
  const n6 = Math.round( 24*Math.cos(azRad+3.5));
  const n7 = Math.round( 24*Math.cos(azRad+2.85));
  const n8 = Math.round( 33*Math.cos(azRad+2.7));
  const e1 = Math.round( 18*Math.sin(azRad));
  const e2 = Math.round( 13*Math.sin(azRad-0.57));
  const e3 = Math.round( 13*Math.sin(azRad+0.57));
  const e4 = Math.round( 15*Math.sin(azRad-1.23));
  const e5 = Math.round( 16*Math.sin(azRad+3.14));
  const e6 = Math.round( 24*Math.sin(azRad+3.5));
  const e7 = Math.round( 24*Math.sin(azRad+2.85));
  const e8 = Math.round( 33*Math.sin(azRad+2.7));
  
  createTarget(gridE, gridN, "#soldier", (-135-Az)); //Squad Leader in center
  createTarget(gridE+e1, gridN+n1, "#soldier", (-135-Az));
  createTarget(gridE+e2, gridN+n2, "#soldier", (-135-Az));
  createTarget(gridE+e3, gridN+n3, "#soldier", (-90-Az));
  createTarget(gridE+e4, gridN+n4, "#soldier", (-135-Az));
  createTarget(gridE+e5, gridN+n5, "#soldier", (-135-Az));
  createTarget(gridE+e6, gridN+n6, "#soldier", (-115-Az));
  createTarget(gridE+e7, gridN+n7, "#soldier", (-135-Az));
  createTarget(gridE+e8, gridN+n8, "#soldier", (-90-Az));
}

function createTarget(gridE, gridN, Model = "#T90Tank", Az = 0) {
  var [X,Z] = convertGrid(gridE,gridN);
  var position = new THREE.Vector3(X, 0, Z);

  var sceneEl = document.querySelector("a-scene");
  var entityEl = document.createElement("a-entity");
  entityEl.setAttribute("position", position);
  entityEl.setAttribute("groundcheck", "");
  entityEl.setAttribute("class", "target");
  if (Model=="#soldier"){
    entityEl.setAttribute("type", "pax");
  }else{
    entityEl.setAttribute("type", "tank");
  }
  entityEl.setAttribute("render-order","foreground");
  var entityE2 = document.createElement("a-entity");
  entityE2.setAttribute("gltf-model", Model); //can I abstract model if scale and position may be affected? may need ifs
  entityE2.setAttribute("scale", "1 1 1");
  entityE2.setAttribute("position", "0 0 0");
  entityE2.setAttribute("rotation", "0 " + -Az + " 0"); // rotate to Az for facing direction-may not match map bearing

  // append entities to build up scene
  entityEl.appendChild(entityE2);
  sceneEl.appendChild(entityEl);
  console.log("Target Created at ", position);
}

function rot2bearing (rot) {
  while (rot > 180) { rot = rot - 360 };
  while (rot < -180) { rot = rot + 360 };
  if (rot <= 0) {az = -rot};
  if (rot > 0) { az= 360-rot};
  return az;        
};

function deg2mils (deg) {
  var mils = ( 6400 / 360 ) * deg;
  return mils;
};

// Observed Fire Sim Functions
function convertGrid(easting,northing) {
  var E = padGrid(easting);
  var N = padGrid(northing);
  var Y =  opNorthing - N;
  var X = E - opEasting;
  console.log("east",easting,E,X);
  console.log("north",northing,N,Y);
  console.log("OP",opEasting,opNorthing);
  return [X, Y];
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

function handleFireMission(gridE, gridN, round) {
  console.log(gridE, gridN, round);
  var [X,Y] = convertGrid(gridE,gridN);
  let plusZ = 0;
  if (round=="HEVT") {plusZ=7;};
  console.log(X,Y);
  var impactPosition = createIDF(X, Y, plusZ);
  checkTargetHit (impactPosition);
}

function checkTargetHit (impactPosition) {
  console.log("checktargets");
  var sceneEl = document.querySelector("a-scene");
  var els = sceneEl.querySelectorAll(".target");
  console.log(els);
  for (var i = 0; i < els.length; i++) {
    var tgtPosition = els[i].getAttribute('position');
    console.log(i,tgtPosition);
    var distSq = tgtPosition.distanceToSquared(impactPosition);
    if (distSq <= hitDistSq) {
      console.log("HIT ",els[i]);
      if (els[i].components.type.data=="tank"){
        createHit(tgtPosition);
      }     
      if (els[i].components.type.data=="pax"){
        createKillSoldier(els[i]);
      }
      socket.emit('hit');// TODO send target num      
    }
  };
}

function createKillSoldier (els) {
  els.object3D.rotation.x += 1.5707963267948966192313216916398; // =pi/2 rotate 90deg
  els.object3D.position.y += 0.5;
  els.components.type.data="deadSoldier";
  console.log("Dead rotation ",els);
}

function reviveSoldier (els) {
  els.object3D.rotation.x += -1.5707963267948966192313216916398; // =pi/2 rotate 90deg
  els.object3D.position.y += -0.5;
  els.components.type.data="pax";
  console.log("Revive ",els);
}

function getGroundLevel(X, Z) {
  const location = new THREE.Vector3(X, 9000, Z);
  const direction = new THREE.Vector3(0, -1, 0);
  const raycaster = new THREE.Raycaster();
  raycaster.set(location, direction);

  const mesh = document.querySelector("#ground").object3D;
  var intersects = raycaster.intersectObject(mesh, true);

  return {
    point: intersects[0].point, // a three value point XYZ in world coord
    normal: intersects[0].face.normal //a three part vector for the normal to face at that point
  };
}


function createIDF(X, Z, agl=0) {
  let sprite = true;
  if(sprite) {
    // sprite based IDF marker
    createIDFsprite(X, Z, agl);    
  } else {
    createIDFparticle(X, Z, agl);
  };
}

function createIDFsprite(X, Z, agl=0) {
  var groundLevel = getGroundLevel(X, Z);
  var position = groundLevel.point;
  position.y = position.y + agl;

  var sceneEl = document.querySelector("a-scene");
  var entityEl = document.createElement("a-entity");
  entityEl.setAttribute("position", position);
  entityEl.setAttribute("class", "IDF");
  var entityFire1 = createFireEl(45);
  var entityFire2 = createFireEl(-45);
  var entitySmoke1 = createSmokeEl(0);
  var entitySmoke2 = createSmokeEl(90);

  entityEl.appendChild(entitySmoke1);
  entityEl.appendChild(entitySmoke2);
  entityEl.appendChild(entityFire1);
  entityEl.appendChild(entityFire2);
  sceneEl.appendChild(entityEl);

  setTimeout(function() {
    entityEl.parentNode.removeChild(entityEl);
  }, 300000); //delay is in milliseconds
  
    return position;
}

function createIDFparticle(X, Z, agl=0) {
  var groundLevel = getGroundLevel(X, Z);
  var position = groundLevel.point;
  position.y = position.y + agl;

  var sceneEl = document.querySelector("a-scene");
  var entityEl = document.createElement("a-entity");
  entityEl.setAttribute("position", position);
  entityEl.setAttribute("class", "IDF");
  var entityChunk1 = document.createElement("a-dodecahedron");
  var entityChunk2 = document.createElement("a-entity");
  var entityFire = document.createElement("a-entity");
  var entityCloud1 = document.createElement("a-entity");
  var entityCloud2 = document.createElement("a-entity");
  var entityTrails1 = document.createElement("a-entity");
  var entityTrails2 = document.createElement("a-entity");
  var entityTrails3 = document.createElement("a-entity");
  var entityTrails4 = document.createElement("a-entity");
  var entityTrails5 = document.createElement("a-entity");
  var entityTrails6 = document.createElement("a-entity");
  
  //entityChunk1.setAttribute("id", "rock");
  entityChunk1.setAttribute("color", "#5a4f3e");
  entityChunk1.setAttribute("radius", "1");
  entityChunk1.setAttribute("mesh-particles", "radialType: sphere; radialVelocity: 15..20; acceleration: 0 -10 0; duration: 1; lifeTime: 3; rotation: 0 0 0,0 180 0; spawnRate: 50; spawnType: burst;");
  
  entityChunk2.setAttribute("particle-system", "type: 2; blending: 1; color: #5a4f3e; dragValue: 3; duration: 1; maxParticleCount: 10000; opacity: 0.8 0.4; velocityValue: 0 25 0; velocitySpread: 15 4 15; particleCount: 300; size: 2; sizeSpread: 2; texture: https://cdn.glitch.global/faddae4b-024b-4177-af7b-9e2db2934bce/fog.png;");
  entityFire.setAttribute("particle-system", "accelerationValue: 0, 2, 0; accelerationSpread: 0 2 0; blending: 1; color: #FFFF70,#FF9D2F,#C25B1B; duration: 3; maxAge: 1; opacity: 1,0; particleCount: 150; positionSpread: 6 4 6; size: 16,32; sizeSpread: 8; velocityValue: .4 .1 0; velocitySpread: .4 0 .4; texture: https://cdn.glitch.global/faddae4b-024b-4177-af7b-9e2db2934bce/explosion.png?v=1653327532440;");
  entityCloud1.setAttribute("particle-system", "type: 2; blending: 1; color: #5D4B3D; accelerationValue: 0 -0.1 0; accelerationSpread: 0.1 0.1 0.1; dragValue: 1; duration: 60; opacity: 0.4 0.1; positionSpread: 20 20 20; velocityValue: 0 0 0; velocitySpread: 0 0 0; particleCount: 300; size: 8; sizeSpread: 5; texture: https://cdn.glitch.global/faddae4b-024b-4177-af7b-9e2db2934bce/fog.png;");
  entityCloud2.setAttribute("particle-system", "type: 2; blending: 1; color: #ded5ce; accelerationValue: 0 0.5 0; accelerationSpread: 1 0.4 1; dragValue: 1; duration: 30; maxAge: 10; opacity: 0.4 0.1; positionSpread: 10 10 10; velocityValue: 0 0 0; velocitySpread: 0 0 0; particleCount: 300; size: 8; sizeSpread: 5; texture: https://cdn.glitch.global/faddae4b-024b-4177-af7b-9e2db2934bce/fog.png;");
  entityCloud2.setAttribute("position","0 15 0");
                             
  entityTrails1.setAttribute("particle-system", "type: 2; blending: 1; color: #332419,#a88e79; dragValue: 3; duration: 1; maxParticleCount: 10000; opacity: 0.8 0.4; velocityValue: 10 20 0; velocitySpread: 1 1 1; particleCount: 300; size: 0.2; sizeSpread: 2; texture: https://cdn.glitch.global/faddae4b-024b-4177-af7b-9e2db2934bce/fog.png;");
  entityTrails2.setAttribute("particle-system", "type: 2; blending: 1; color: #332419,#a88e79; dragValue: 3; duration: 1; maxParticleCount: 10000; opacity: 0.8 0.4; velocityValue: 10 20 0; velocitySpread: 1 1 1; particleCount: 300; size: 0.2; sizeSpread: 2; texture: https://cdn.glitch.global/faddae4b-024b-4177-af7b-9e2db2934bce/fog.png;");
  entityTrails3.setAttribute("particle-system", "type: 2; blending: 1; color: #332419,#a88e79; dragValue: 3; duration: 1; maxParticleCount: 10000; opacity: 0.8 0.4; velocityValue: -10 20 0; velocitySpread: 1 1 1; particleCount: 300; size: 0.2; sizeSpread: 2; texture: https://cdn.glitch.global/faddae4b-024b-4177-af7b-9e2db2934bce/fog.png;");
  entityTrails4.setAttribute("particle-system", "type: 2; blending: 1; color: #332419,#a88e79; dragValue: 3; duration: 1; maxParticleCount: 10000; opacity: 0.8 0.4; velocityValue: 5 20 5; velocitySpread: 1 1 1; particleCount: 300; size: 0.2; sizeSpread: 2; texture: https://cdn.glitch.global/faddae4b-024b-4177-af7b-9e2db2934bce/fog.png;");
  entityTrails5.setAttribute("particle-system", "type: 2; blending: 1; color: #332419,#a88e79; dragValue: 3; duration: 1; maxParticleCount: 10000; opacity: 0.8 0.4; velocityValue: 5 20 -5; velocitySpread: 1 1 1; particleCount: 300; size: 0.2; sizeSpread: 2; texture: https://cdn.glitch.global/faddae4b-024b-4177-af7b-9e2db2934bce/fog.png;");
  entityTrails6.setAttribute("particle-system", "type: 2; blending: 1; color: #332419,#5a4f3e; dragValue: 3; duration: 1; maxParticleCount: 10000; opacity: 0.8 0.4; velocityValue: 0 10 15; velocitySpread: 1 1 1; particleCount: 300; size: 0.2; sizeSpread: 2; texture: https://cdn.glitch.global/faddae4b-024b-4177-af7b-9e2db2934bce/fog.png;");
  
  entityChunk1.setAttribute("particle-controller","");
  entityChunk2.setAttribute("particle-controller","");
  entityFire.setAttribute("particle-controller","");
  entityCloud1.setAttribute("particle-controller","");
  entityCloud2.setAttribute("particle-controller","");
  entityCloud2.setAttribute("particle-controller","");                             
  entityTrails1.setAttribute("particle-controller","");
  entityTrails2.setAttribute("particle-controller","");
  entityTrails3.setAttribute("particle-controller","");
  entityTrails4.setAttribute("particle-controller","");
  entityTrails5.setAttribute("particle-controller","");
  entityTrails6.setAttribute("particle-controller","");
  
  entityEl.appendChild(entityChunk1);
  entityEl.appendChild(entityChunk2);
  entityEl.appendChild(entityFire);
  entityEl.appendChild(entityCloud1);
  entityEl.appendChild(entityCloud2);
  entityEl.appendChild(entityTrails1);
  entityEl.appendChild(entityTrails2);
  entityEl.appendChild(entityTrails3);
  entityEl.appendChild(entityTrails4);
  entityEl.appendChild(entityTrails5);
  entityEl.appendChild(entityTrails6);  
  
  sceneEl.appendChild(entityEl);

  setTimeout(function() {
    entityEl.parentNode.removeChild(entityEl);
  }, 300000); //delay is in milliseconds
  
    return position;
}

function createFireEl(Rot = 0, tgtHit = false) {
  var entityFire = document.createElement("a-image");
  entityFire.setAttribute("src", "#fire");
  entityFire.setAttribute("material", "alphaTest: 0.2");
  entityFire.setAttribute("material", "blending: additive");
  entityFire.setAttribute("render-order","fire");
  entityFire.setAttribute("geometry", "");
  entityFire.setAttribute("side", "double");
  entityFire.setAttribute("rotation", "0 " + Rot + " 0");
  entityFire.setAttribute("position", "0 0 0");
  if (tgtHit) {
    console.log("hitflames");
    entityFire.setAttribute(
      "animation",
      "property: scale; from: 20 20 1; to: 50 75 1; dur: 500; loop: 1"
    );
    entityFire.setAttribute(
      "animation__2",
      "property: scale; from: 20 20 1; to: 30 30 1; delay: 500; dur: 700; loop: true; dir: alternate"
    );
    entityFire.setAttribute(
      "animation__3",
      "property: rotation; from: 0 "+(Rot-40) + " 0; to: 0 "+(Rot+40)+" 0; delay: 500; dur: 900; loop: true; dir: alternate"
    );
  } else {
    entityFire.setAttribute(
      "animation",
      "property: scale; from: 1 1 1; to: 10 20 10; dur: 700; loop: 2; dir: alternate"
    );
  }  
  return entityFire;
}

function createSmokeEl(Rot = 0) {
  var entityE2 = document.createElement("a-image");
  entityE2.setAttribute("src", "#cloud");
  entityE2.setAttribute("material", "alphaTest: 0.2");
  entityE2.setAttribute("render-order","smoke");
  entityE2.setAttribute("geometry", "");
  entityE2.setAttribute("side", "double");
  entityE2.setAttribute("rotation", "0 " + Rot + " 0");
  entityE2.setAttribute("opacity", "0.8");
  entityE2.setAttribute("position", "0 0 0");  
  entityE2.setAttribute(
    "animation",
    "property: scale; from: 10 10 1; to: 30 30 1; dur: 2000; loop: 1"
  );
  entityE2.setAttribute(
    "animation__2",
    "property: opacity; from: 0.8; to: 1.0; dur: 2000; loop: 1"
  );
  entityE2.setAttribute(
    "animation__3",
    "property: opacity; from: 1.0; to: 0.5; delay: 2000; dur: 2000; loop: 1"
  );
  entityE2.setAttribute(
    "animation__4",
    "property: opacity; from: 0.5; to: 0.2; delay: 4000; dur: 120000; loop: 1"
  );
  entityE2.setAttribute(
    "animation__5",
    "property: scale; from: 30 30 1; to: 30 20 1; delay: 5000; dur: 60000; loop: 1"
  );
  
  return entityE2;
}

/*function createHit(position) {
  let sprite = true;
  if(sprite) {
    // sprite based IDF marker
    createHitsprite (position);    
  } else {
    createHitparticle (position);
  };
}*/


function createHit (position) {
  var sceneEl = document.querySelector("a-scene");
  var entityEl = document.createElement("a-entity");
  entityEl.setAttribute("position", position);
  entityEl.setAttribute("class", "IDF");
  var entityFire1 = createFireEl(45,true);
  var entityFire2 = createFireEl(-45,true);
  
  entityEl.appendChild(entityFire1);
  entityEl.appendChild(entityFire2);
  sceneEl.appendChild(entityEl);
}

/*function createHitparticle (position) { //creates a burning hit at the position. particle based.
  var sceneEl = document.querySelector("a-scene");
  var entityEl = document.createElement("a-entity");
  entityEl.setAttribute("position", position);
  entityEl.setAttribute("class", "IDF");
  entityEl.setAttribute('ground-clamp','');
  var entityFire = document.createElement("a-entity");
  var entitySmoke = document.createElement("a-entity");
  
  entityFire.setAttribute('particle-system','accelerationValue: 0, 2, 0; accelerationSpread: 0 2 0; blending: 2; color: #FFFF70,#FF9D2F,#C25B1B; maxAge: 1; opacity: 1,0; particleCount: 150; positionSpread: 3 2 3; size: 16,32; sizeSpread: 4; velocityValue: .4 .1 0; velocitySpread: .4 0 .4; texture: https://cdn.glitch.global/faddae4b-024b-4177-af7b-9e2db2934bce/explosion.png?v=1653327532440;');
  entitySmoke.setAttribute('position','0 2 0');
  entitySmoke.setAttribute('particle-system','accelerationValue: 1, 0, 0; accelerationSpread: 0.5 0 0.5; blending: 1; color: #444,#999; maxAge: 4; opacity: 0,0.5,1,0; opacitySpread: 0.5; particleCount: 400; positionSpread: 2 1 2; size: 20,32; sizeSpread: 4,10; velocityValue: 1 15 0; velocitySpread: 1.4 5 1.4; texture: https://cdn.glitch.global/faddae4b-024b-4177-af7b-9e2db2934bce/fog.png;');
  
  entityEl.appendChild(entityFire);
  entityEl.appendChild(entitySmoke);
  sceneEl.appendChild(entityEl);
} */

function handleReset () {
  console.log("ResetIDF");
  var sceneEl = document.querySelector("a-scene");
  var els = sceneEl.querySelectorAll(".IDF");
  console.log(els);
  for (var i = 0; i < els.length; i++) {
    els[i].parentNode.removeChild(els[i]);
    els[i].destroy();
    console.log("Destroy IDF" + i);
  };
  var els2 = sceneEl.querySelectorAll(".target");
  for (var i = 0; i < els2.length; i++) {
     if (els2[i].components.type.data=="deadSoldier"){
        reviveSoldier(els2[i]);
       console.log(els2);
      }
  };
}

function setCamView(cam) {
        var mainCameraEl = document.querySelector('#camera1');
        var binoCameraEl = document.querySelector('#camera2');
        var compassCameraEl = document.querySelector('#camera3');
        var compassEl = document.querySelector('#compass');
        
        switch(cam) {
            case 'main':            
              mainCameraEl.setAttribute('camera', 'active', true);                
              binoCameraEl.setAttribute('camera', 'active', false);
              binoCameraEl.setAttribute('visible', false);
              compassCameraEl.setAttribute('camera', 'active', false);
              compassEl.setAttribute('visible', false); 
              console.log("switch to MAIN view");
            break;
            case 'bino':            
              mainCameraEl.setAttribute('camera', 'active', false);                
              binoCameraEl.setAttribute('camera', 'active', true);
              binoCameraEl.setAttribute('visible', true);
              compassCameraEl.setAttribute('camera', 'active', false);
              compassEl.setAttribute('visible', false); 
              console.log("switch to BINO view");
            break;
            case 'compass':            
              mainCameraEl.setAttribute('camera', 'active', true);                
              binoCameraEl.setAttribute('camera', 'active', false);
              binoCameraEl.setAttribute('visible', false);
              compassCameraEl.setAttribute('camera', 'active', false);
              compassEl.setAttribute('visible', true); 
              console.log("switch to COMPASS view");
            break;
            case 'compassdial':            
              mainCameraEl.setAttribute('camera', 'active', false);                
              binoCameraEl.setAttribute('camera', 'active', false);
              binoCameraEl.setAttribute('visible', false);
              compassCameraEl.setAttribute('camera', 'active', true);
              compassEl.setAttribute('visible', true); 
              console.log("switch to COMPASS DIAL view");
            break;
            default:            
              mainCameraEl.setAttribute('camera', 'active', true);                
              binoCameraEl.setAttribute('camera', 'active', false);
              binoCameraEl.setAttribute('visible', false);
              compassCameraEl.setAttribute('camera', 'active', false);
              compassEl.setAttribute('visible', false); 
              console.log("switch to DEFUALT (MAIN) view");
            break;
        };
  return true;
}