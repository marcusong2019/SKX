  var lat = 0;
  var lon = 0;
  var az = 0;
var opGrid = [];
  var opParts = [];
  var opEasting = [];
  var opNorthing = [];
  var hitDistSq = 2500; //50m squared (using the squared distance vector)

// Initial connection
const urlParams = new URLSearchParams(window.location.search); // get all parameters from the url
const code = urlParams.get("game"); //get the variable we want
console.log("Attempt join game:", code);
const urlOrigin = window.location.origin;
var socket = io(urlOrigin);
console.log("Socket: ", socket);
socket.on("connect", () => {
  console.log("Connected " + socket.id);
//});
socket.emit("joinGame", code, (scenarioJSON,targetsJSON)=>{
  console.log(scenarioJSON);
  console.log(targetsJSON);
  const scenario = JSON.parse(scenarioJSON);
  const targets = JSON.parse(targetsJSON);
console.log(scenario);
  lat = scenario.lat;
  lon = scenario.lon;
  az = -1 * scenario.az;
  
  //setup terrain
        var sceneEl = document.querySelector("a-scene");
        var entityEl = document.createElement("a-entity");
        entityEl.setAttribute("id","ground");
        entityEl.setAttribute("class","ground");
        entityEl.setAttribute("render-order","foreground");
        entityEl.setAttribute("static-body","");
        console.log("fovpad:5;elevation:0;lod:14;latitude:"+lat+";longitude:"+lon);
        entityEl.setAttribute("a-terrain", "fovpad:5;elevation:0;lod:14;latitude:"+lat+";longitude:"+lon+";");
        sceneEl.appendChild(entityEl);
  
  //set camera
      var cameraRigEl = document.querySelector('#camera-rig');
      cameraRigEl.setAttribute("rotation","0 "+az+" 0");
      console.log("Camera Rig az",az);
  
  initializeMap(scenario.lat,scenario.lon,scenario.az);
  initializeTargets(targets);
});
});
//console.log(scenarioJSON);
console.log(lat);

// react to incoming messages
socket.on("reply", data => {
  console.log(data);
});

//socket.on('scenarioInfo', (dataA,dataB) => {
 // handleScenarioInfo(dataA,dataB);
//});

socket.on("target", data => {
  handleNewTarget(data);
});

socket.on("firemissionG", (data1, data2, data3) => {
  handleFireMission(data1, data2, data3);
});

socket.on('unknownCode',handleUnknownCode);

socket.on('reset',handleReset);


function handleUnknownCode() {
  alert('Unknown Game Code');
  //forward to the index page to re-enter code or start new
  window.location.href = urlOrigin+'/index.html';
}

//function handleScenarioInfo(scenario,targetList) {
//  initializeMap(scenario.lat,scenario.lon,scenario.az);
//  initializeTargets(targetList);
//}

function initializeMap(lat,lon,az) {
  console.log("Attempt lat/lon:",lat,lon);
  const opGrid = mgrs.forward([lon, lat],5);
  const opParts = mgrs.decode(opGrid);
  opEasting = opParts.easting.toString().slice(-5);
  opNorthing = opParts.northing.toString().slice(-5);
  console.log("E:"+opEasting+" N:"+opNorthing);
  const hitDistSq = 2500; //50m squared (using the squared distance vector)
}

function initializeTargets(targets) {
  console.log("Start target setup ", targets) ;
  targets.forEach(createTarget1);  
  
}

function createTarget1(item){
  if (item){
    console.log(item);
    var gridE = item.e;
    var gridN = item.n;
    var Model = item.model;
    var Az = item.az;
    if (Model=="squad") {
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
  console.log("squad at: " + gridE + " " + gridN);
  
  const C = Math.cos(-Az/0.00098174770);
  const S = Math.sin(-Az/0.00098174770);
  
  const e1 = Math.round( -18*S);
  const e2 = Math.round( -7*C-11*S);
  const e3 = Math.round( 7*C-11*S);
  const e4 = Math.round( -14*C-5*S);
  const e5 = Math.round( 16*S);
  const e6 = Math.round( -7*C+23*S);
  const e7 = Math.round( 7*C+23*S);
  const e8 = Math.round( 14*C+30*S);
  const n1 = Math.round( 18*C);
  const n2 = Math.round( -7*S+11*C);
  const n3 = Math.round( 7*S+11*C);
  const n4 = Math.round( -14*S+5*C);
  const n5 = Math.round( -16*C);
  const n6 = Math.round( -7*S-23*C);
  const n7 = Math.round( 7*S-23*C);
  const n8 = Math.round( 14*S-30*C);
  
  createTarget(gridE, gridN, "#soldier", Az); //Squad Leader in center
  createTarget(gridE+e1, gridN+n1, "#soldier", Az);
  createTarget(gridE+e2, gridN+n2, "#soldier", Az);
  createTarget(gridE+e3, gridN+n3, "#soldier", Az);
  createTarget(gridE+e4, gridN+n4, "#soldier", Az);
  createTarget(gridE+e5, gridN+n5, "#soldier", Az);
  createTarget(gridE+e6, gridN+n6, "#soldier", Az);
  createTarget(gridE+e7, gridN+n7, "#soldier", Az);
  createTarget(gridE+e8, gridN+n8, "#soldier", Az);
}

// Initial connection
/*        const urlParams = new URLSearchParams(window.location.search); // get all parameters from the url
        var lat = urlParams.get("lat"); //get the variable we want
        var lon = urlParams.get("lon"); //get the variable we want
        var az = urlParams.get("az"); //get the variable we want
        if (az==null) { az = 0 };
        if (lat==null || lon==null) {
          lat = 41.36289858633997;
          lon = -74.01923243991936;
          if (az==0) { az = 165 };
        };
        az = -1 * az;
        console.log("Attempt lat/lon:",lat,lon);
        */
/*
const opGrid = mgrs.forward([lon, lat],5);
const opParts = mgrs.decode(opGrid);
const opEasting = opParts.easting.toString().slice(-5);
const opNorthing = opParts.northing.toString().slice(-5);
console.log("E:"+opEasting+" N:"+opNorthing);
const hitDistSq = 2500; //50m squared (using the squared distance vector)
*/


/*
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
*/


// Allow logging to console from inside A-Frame
AFRAME.registerComponent("log", {
  schema: { type: "string" },

  init: function() {
    var stringToLog = this.data;
    console.log(stringToLog);
  }
});

      AFRAME.registerComponent('compass', {
        init: function () {
          //this.el.setAttibute('text','value','test');
          //const cameraDirection = new THREE.Vector3(0,0,1);
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
          //console.log("raw "+rotation);
          var viewAz = rot2bearing(rotation);
          var viewAzMils = deg2mils(viewAz);
          viewAz = Math.round(viewAz);
          viewAzMils = Math.round(viewAzMils);
          //console.log("setting "+ viewAz + " or mils: "+viewAzMils);
          this.el.setAttribute('text','value',viewAz.toString() +" deg\n"+ viewAzMils.toString() +" mils");
          /*
          //works to get euler angle
          var rotVec = this.el.object3D.getWorldDirection(THREE.Vector3(1,0,0)); //get rotation - likely in radians
          var rotation = new THREE.Euler();
          rotation.setFromVector3(rotVec);
          console.log(rotation);
          */          
        }
        
      });//end component 
      function rot2bearing (rot) {
        while (rot > 180) { rot = rot - 360 };
        while (rot < -180) { rot = rot + 360 };
        if (rot <= 0) {az = -rot};
        if (rot > 0) { az= 360-rot};
        //console.log("convert to "+az);
        return az;        
      };
      
      function deg2mils (deg) {
        var mils = ( 6400 / 360 ) * deg;
        return mils;
      };

AFRAME.registerComponent('ground-clamp', {
        schema: {
          height: {default: 0},
        },

    tick: function () {
        var position = this.el.object3D.position; //getAttribute('position');

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
  });

AFRAME.registerComponent('type', {
  schema: {type: 'string', default: "tank"}
  //init: function () {},
  //update: function () {},
  //tick: function () {},
  //remove: function () {},
  //pause: function () {},
  //play: function () {}
  });



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

/*function handleNewTarget(tgtNum) {
  //console.log(tgtNum);  
  if (tgtNum == 1) {
    createTarget(82300,79000);
    console.log("Creating Target 1");
  } else if (tgtNum == 2) {
    createTarget(82100,79100);
    console.log("Creating Target 2");
  } else if (tgtNum == 3) {
    createTarget(81800,78100);
    console.log("Creating Target 3");
  } else if (tgtNum == 4) {
    createTarget(81850,78150);
    console.log("Creating Target 4");
  } else {
    console.log("request for target failed");
  } 
  
  //console.log(tgtArray);
  
  
}*/

function handleFireMission(gridE, gridN, round) {
  console.log(gridE, gridN, round);
  var [X,Y] = convertGrid(gridE,gridN);
  //const X = gridE;
  //const Y = gridN;
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
    //tgtPosition.x tgtPosition.y
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
  els.object3D.rotation.x += 1.5707963267948966192313216916398;
  els.object3D.position.y += 0.5;
  els.components.type.data="deadSoldier";
  console.log("Dead rotation ",els);
}

function reviveSoldier (els) {
  els.object3D.rotation.x += -1.5707963267948966192313216916398;
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

function createTarget(gridE, gridN, Model = "#T90Tank", Az = 0) {
  var [X,Z] = convertGrid(gridE,gridN);
  var groundLevel = getGroundLevel(X, Z);
  var position = groundLevel.point;
  var normal = groundLevel.normal;

  var sceneEl = document.querySelector("a-scene");
  var entityEl = document.createElement("a-entity");
  //entityEl.setAttribute("id", "target1");  //needs to be unique
  entityEl.setAttribute("position", position);
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
  entityE2.setAttribute("rotation", "0 " + Az + " 0"); // rotate to Az for facing direction-my not match map bearing

  // append entities to build up scene
  entityEl.appendChild(entityE2);
  sceneEl.appendChild(entityEl);
  entityEl.object3D.lookAt(normal); //sit correctly on terrain
  console.log("Target Created at ", position);
}

function createIDF(X, Z, agl=0) {
  var groundLevel = getGroundLevel(X, Z);
  var position = groundLevel.point;
  //console.log("ground at",position.y);
  position.y = position.y + agl;
  //console.log("burst at",position.y);

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
  //console.log("created fire");
  
}

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