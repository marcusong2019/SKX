if (location.protocol !== 'https:') {
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
}

const urlOrigin = window.location.origin;
var socket = io(urlOrigin);//'https://observed-fire-simulator.glitch.me/');
  
socket.on('initFO', handleInitFO);
socket.on('gameCode', handleGameCode);
socket.on('hit', (dataA, dataB) => handleHit(dataA,dataB));
socket.on('unknownCode', handleUnknownCode);
socket.on('newClientCount', data => {
  console.log(data);
  handleNewClient(data);
});//to inform new join
socket.on('newClientReady',handleClientReady);
socket.on('disconnect', (reason)=> {
  console.log('socket disconnect: '+reason);
  alert('Connection lost. Attempting to reconnect.');  
});
socket.on('reconnect', handleReconnect);
socket.on('reconnect_failed', () => { // default reconnectionAttempts is infinate
   console.log('socket reconnect failed');
  alert('Unable to reconnect. Max attempts reached.');
});

//let canvas, ctx;
let playerNumber;
let gameActive = false;
var opLocation = [50000,50000];
var lastFireMission=[0,0];
var gmAngle = 0; //default
var dangerCloseFlag = false;
var fireRequestText = "";
var readyCount = 0;


const gameScreen = document.getElementById('gameScreen');
const scenarioScreen = document.getElementById('scenarioScreen');
const initialScreen = document.getElementById('initialScreen');
const newGameBtn = document.getElementById('newGameButton');
const joinGameBtn = document.getElementById('joinGameButton');
const gameCodeInput = document.getElementById('gameCodeInput');
const gameCodeDisplay = document.getElementById('gameCodeDisplay');
const linkURL = document.getElementById('linkURL');
//const numConnectionsDisplay = document.getElementById('numConnectionsDisplay');
const sysMessageDisplay = document.getElementById('sysMessageDisplay');
const sendFireMissionBtn = document.getElementById('sendFireMission');
const gameHitDisplay = document.getElementById('gameHitDisplay');
const gameWarningDisplay = document.getElementById('gameWarningDisplay');
const resetBtn = document.getElementById('resetButton');
const fireForEffectBtn = document.getElementById('fireForEffectButton');
const gridEasting = document.getElementById('gridEastingInput');
const gridNorthing = document.getElementById('gridNorthingInput');
const polarDirection = document.getElementById('polarDirectionInput');
const polarDistance = document.getElementById('polarDistanceInput');
const shiftDirection = document.getElementById('shiftDirectionInput');
const shiftRange = document.getElementById('shiftRangeInput');
const shiftAddDrop = document.getElementById('correctRangeAdd');
const shiftDeviation = document.getElementById('shiftDeviationInput');
const shiftRight = document.getElementById('correctDevRight');
const roundType = document.getElementById('roundTypeInput');
const splashMesage = document.getElementById('splashMesage');
const opEastingInput = document.getElementById('opEastingInput');
const opNorthingInput = document.getElementById('opNorthingInput');
const setOpBtn = document.getElementById('setOpButton');
const gmAngleDisplay = document.getElementById('gmAngleDisplay');
const fdcLogDisplay = document.getElementById('fdcLogDisplay');
const setMgrsGridBtn = document.getElementById('setMgrsGridButton');
const gridInput = document.getElementById('gridInput');
const lookDirectionInput = document.getElementById('lookDirectionInput');

var scenario = {};
var target=[];

newGameBtn.addEventListener('click', scenarioPicker);
gameCodeInput.addEventListener("keypress", forceKeyPressUppercase, false);
joinGameBtn.addEventListener('click', joinGame);
sendFireMissionBtn.addEventListener('click', sendFireMission);
resetBtn.addEventListener('click', requestReset);
fireForEffectBtn.addEventListener('click', fireForEffect);
setOpBtn.addEventListener('click', changeOpLocation);
setMgrsGridBtn.addEventListener('click', setCustomMGRS);
gridInput.addEventListener("keypress", forceKeyPressUppercase, false);

gameCodeInput.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    joinGame();
  }
});

gridEasting.addEventListener("keypress", event => submitBtnOnEnter(event));
gridNorthing.addEventListener("keypress", event => submitBtnOnEnter(event));
polarDirection.addEventListener("keypress", event => submitBtnOnEnter(event));
polarDistance.addEventListener("keypress", event => submitBtnOnEnter(event));
shiftDirection.addEventListener("keypress", event => submitBtnOnEnter(event));
shiftRange.addEventListener("keypress", event => submitBtnOnEnter(event));
shiftDeviation.addEventListener("keypress", event => submitBtnOnEnter(event));

function submitBtnOnEnter (event) {
    if (event.key === "Enter") {
    event.preventDefault();
    sendFireMission();
  }
}


function handleHit (targetId,targetType) {
  gameHitDisplay.innerText = "..Hit!..";
  fdcLogDisplay.value += "Hit: "+targetId + " "+targetType +"\n";
  fdcLogDisplay.focus();
  sysMessageDisplay.innerText = targetId + " "+targetType;
  console.log("set hit display");
}

function changeOpLocation() {
  //get values from form
  var newOpEast = opEastingInput.value;
  var newOpNorth = opNorthingInput.value;
  //make sure correct digits, if less
  newOpEast = padGrid(newOpEast);
  newOpNorth = padGrid(newOpNorth);
  if ( (!newOpEast && newOpEast!=0) || (!newOpNorth && newOpNorth!=0) ) {
    console.log("grid error: OP Location NOT changed",newOpEast,newOpNorth);
    alert("OP Location Error: No change made");
    return
  };
  // TODO Should we move the red benchmark also??
  opLocation = [+newOpEast, +newOpNorth];  
  console.log("OP Location Changed",opLocation);
  fdcLogDisplay.value += "OP location updated: " + opLocation + "\n";
  fdcLogDisplay.focus();
  // store new current location in placeholder for future reference
  opEastingInput.placeholder = newOpEast;
  opNorthingInput.placeholder = newOpNorth;
  // remove the input text (placeholder will show) and help indicate the change
  opEastingInput.value = null;
  opNorthingInput.value = null;
}

function updateCompassGM () {
  const gmActive = document.getElementById('selectGmActive').value;
  console.log("Change Compass Setting: ", gmActive);
  if (gmActive == "magnetic") {
    socket.emit('changeGmAngle',gmAngle);
    fdcLogDisplay.value += "Compass changed to magnetic north: FO must use GM Angle \n";
    fdcLogDisplay.focus();
  } else {
    socket.emit('changeGmAngle',0);
    fdcLogDisplay.value += "Compass changed to grid north \n";
    fdcLogDisplay.focus();
  }
  
}

function sendFireMission() {
  console.log("FIRE MISSION!")  
  gameHitDisplay.innerText = ""; //reset
  gameWarningDisplay.innerText = ""; //reset
  sysMessageDisplay.innerText = ""; //reset
  
  var gridTabEl = document.getElementById('gridTab').style.display;
  var polarTabEl = document.getElementById('polarTab').style.display;
  var correctionTabEl = document.getElementById('correctionTab').style.display;
  var settingsTabEl = document.getElementById('settingsTab').style.display;
  var gridE;
  var gridN;
  if (polarTabEl == "block") {
    console.log("Adjust fire, polar");
    let direction = polarDirection.value;
    shiftDirection.value = direction;
    let distance = polarDistance.value;
    fireRequestText = "Direction: "+direction+" Distance: "+distance;
    [gridE, gridN] = calcPolar2Grid(direction, distance, opLocation);//TODO add FO location- need way to send/track
    
    
  } else if (correctionTabEl =="block"){
    console.log("correct fire");    
    console.log(shiftAddDrop.checked,shiftRange.value,shiftRight.checked,shiftDeviation.value);
    polarDirection.value = shiftDirection.value;
    if (shiftRight.checked == true) {
      fireRequestText = "Right "+shiftDeviation.value
    } else {
      fireRequestText = "Left "+shiftDeviation.value
    } 
    if (shiftAddDrop.checked==true) {
      fireRequestText += " Add " + shiftRange.value;
    } else {
      fireRequestText += " Drop " + shiftRange.value;
    }
    
    
    let [x,y] = getAdjustFireShift();
    let [adjEast,adjNorth] = calcAdjustFireShift(shiftDirection.value,x,y);
    gridE = lastFireMission[0] + adjEast;
    gridN = lastFireMission[1] + adjNorth;    
    console.log(x,y,adjEast,adjNorth);    
    
  } else if (gridTabEl =="block") {
    console.log("Adjust Fire, grid");  
    gridE = gridEasting.value;
    gridN = gridNorthing.value;
    fireRequestText = scenario.designator+gridE+gridN;
    
  } else if (settingsTabEl =="block") {
    console.log("Submit on settings: do nothing");
  }
  const round = roundType.value;
  gridE = padGrid(gridE);
  gridN = padGrid(gridN);
  if ( (!gridE && gridE!=0) || (!gridN && gridN!=0) ) {
    // catch error if bad grid
    console.log("grid error",gridE,gridN);
    return
  }
  console.log("request", gridE, gridN, round);
  let dangerClose = checkDangerClose(gridE,gridN);
  if (dangerClose && !dangerCloseFlag) {
    gameWarningDisplay.innerText = "..CONFIRM DANGER CLOSE..";
    sysMessageDisplay.innerText = "Submit again to confirm and fire";
    fdcLogDisplay.value += "Alert: danger close \n";
    fdcLogDisplay.focus();
    dangerCloseFlag = true;
    console.log("CHECK FIRE. Set warning display: Danger Close");
  } else {
    dangerCloseFlag = false;
    errorE = Math.floor(shotError());
    errorN = Math.floor(shotError());
    gridE = gridE + errorE;
    gridN = gridN + errorN;
    console.log("shot", gridE, gridN);
    socket.emit('firemissionG',gridE, gridN, round);
    lastFireMission=[gridE,gridN]; //store for future
    fdcLogDisplay.value += "Fire Mission: "+fireRequestText+"\n";
    fdcLogDisplay.focus();
    shiftRange.value = ""; //reset
    shiftDeviation.value=""; //reset
  }
}

function checkDangerClose (gridE, gridN) {
  let X = ((gridE-opLocation[0])**2) + ((gridN-opLocation[1])**2);
  if (X<360000) {
    console.log("DANGER CLOSE")
    return true
  } else {
    return false
  }
}

function fireForEffect() {
  const round = roundType.value;
  fdcLogDisplay.value += "Fire for Effect \n";
  fdcLogDisplay.focus();
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {  
      adjEast = Math.floor(Math.random() * 101) -50;
      adjNorth = Math.floor(Math.random() * 101) -50;
      gridE = lastFireMission[0] + adjEast;
      gridN = lastFireMission[1] + adjNorth;   
      gridE = padGrid(gridE);
      gridN = padGrid(gridN);
      if ( (gridE || gridE==0) && (gridN || gridN==0) ) {
        console.log("Fire For Effect: ", gridE, gridN);
        socket.emit('firemissionG',gridE, gridN, round);
      } else {
        console.log("grid error",gridE,gridN);
      };
    }, Math.floor(Math.random() * 1500));
  };
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
    Xin = null;
  }
  return Xin;
}

function calcAdjustFireShift(direction,x,y) {      
    let dirRadians = direction * Math.PI / 3200; //mils to radians
    adjEast = ( x * Math.cos(dirRadians) ) + ( y * Math.sin(dirRadians) );
    adjNorth = (-1 * x * Math.sin(dirRadians) ) + ( y * Math.cos(dirRadians) );
  return [Math.round(adjEast),Math.round(adjNorth)];
}

function getAdjustFireShift() {
  let x = 0;
  let y = 0;
      if (shiftAddDrop.checked==true) {
      y = shiftRange.value;
    } else {
      y = -shiftRange.value;
    };
    
    if (shiftRight.checked==true) {
      x = shiftDeviation.value;
    } else {
      x = -shiftDeviation.value;
    };
  console.log(x,y);
  return [x,y];
}

function calcPolar2Grid(direction, distance, opLocation=[0,0]) {
  console.log('calc polar');
  let dirRadians = direction * Math.PI / 3200; //mils to radians
  let shiftE = distance * ( Math.sin(dirRadians) );
  let shiftN = distance * ( Math.cos(dirRadians) );
  let gridE = opLocation[0] + Math.round(shiftE);
  let gridN = opLocation[1] + Math.round(shiftN);
  console.log(gridE,gridN);
  return [gridE, gridN];
}

function requestTarget(tgtNum){
  socket.emit('target',tgtNum);
  console.log("send target "+tgtNum);
}

function requestReset() {
  console.log("send reset request");
  socket.emit('requestReset');
  gameHitDisplay.innerText = ""; //reset
  gameWarningDisplay.innerText = ""; //reset
  sysMessageDisplay.innerText = ""; //reset
  fdcLogDisplay.value += "RESET\n";
  fdcLogDisplay.focus();
}

function joinGame() {
  const code = gameCodeInput.value;
  socket.emit('joinGame', code);
  fdcLogDisplay.value += "Join game code: " + code + "\n";
  fdcLogDisplay.focus();
}

function scenarioPicker() {
  initialScreen.style.display = "none";
  scenarioScreen.style.display = "block";
  gameScreen.style.display = "none";
}

function setCustomMGRS() {
  var mgrsStr = gridInput.value;
  var lookDir = lookDirectionInput.value;
  var opLocation = setScenarioMgrs(mgrsStr,lookDir);
  console.log("A: ",opLocation);
  var targetList = setRandomTargets(opLocation,lookDir);
  setScenarioInfoDisplay(scenario,targetList);
}

function setRandomTargets (opLoc,lookDir,tgtCount = 8) {
  console.log('setup targets');
  var targets=[];
  for (let i = 0; i < tgtCount; i++) {
    targets[i] = createRandomTarget(opLoc,lookDir);
  }  
  console.log(targets);
  return targets;
}

function createRandomTarget(opLoc,lookDir) {
  // random integer +/- 1000 (dir is mils):
  var dirOffset = Math.floor(Math.random() * 2000) -1000;
  var direction = +lookDir + dirOffset;
  // random integer from 500 to 2000:
  var distance = Math.floor(Math.random() * 1501) + 500;
  let [gridE, gridN] = calcPolar2Grid(direction, distance, opLoc);
  console.log("new tgt: ",lookDir,dirOffset,direction,distance,gridE,gridN);
  
  let roll = Math.random();
  let type = "squad";
  if ( roll > 0.6 ) {
    type = "squad";
  } else if (roll > 0.3) {
    type = "#T90Tank";
  } else {
    type = "#BTR80";
  };
  
  let tgtDir = (lookDir*(360/6400)) - 180;
  
  target = {
        "e": +gridE,
        "n": +gridN,
        "model": type,
        "az":  +tgtDir};
  console.log("target created: ", target);
  return target;
}

function setScenarioMgrs(mgrsStr,lookDir=0){
  console.log("grid: "+mgrsStr.toUpperCase());
  // TODO add error checking
  var point = mgrs.toPoint(mgrsStr);
  console.log("Lat/Lon: ",point);
  var lat = +point[1];
  var lon = +point[0];
  
  var opParts = mgrs.decode(mgrsStr);
  var opHunK = opParts.hunK.toString();
  var opEasting = opParts.easting.toString().slice(-5);
  var opNorthing = opParts.northing.toString().slice(-5);
  var opLocation = [+opEasting,+opNorthing];
  
  let azDir = (lookDir*(360/6400)) //convert mils to degrees
  
  scenario = {
        Name: 'Custom ' + mgrsStr,
        designator: opHunK,
        gmAngle: 0,
        lat: lat,
        lon: lon,
        az: azDir
      };   
  console.log(scenario);
  lookupMag(lat,lon);
  console.log("declination (mils): "+scenario.gmAngle);
  return opLocation;  
}

// setdecl and lookupMag from:
// https://stackoverflow.com/questions/6641159/magnetic-declination-in-javascript-google-maps
//
function setdecl(v){
 console.log("declination found (deg): "+v);
  gmAngle = Math.round(v * (6400/360));
 scenario.gmAngle = gmAngle;
  gmAngleDisplay.innerText = gmAngle;
  console.log('scenario gmAngle set');
  console.log("declination (mils): "+scenario.gmAngle);
  socket.emit('changeGmAngle',gmAngle);
}

function lookupMag(lat, lon) {
   var url=
"https://www.ngdc.noaa.gov/geomag-web/calculators/calculateIgrfgrid?lat1="+lat+"&lat2="+lat+"&lon1="+lon+"&lon2="+lon+
"&latStepSize=0.1&lonStepSize=0.1&magneticComponent=d&resultFormat=xml";
   $.get(url, function(xml, status){
     console.log(xml);
        setdecl( $(xml).find('declination').text());
   });
  return true
}

function setScenario(scenarioID) {
  switch(scenarioID){
    case 0:
      scenario.Name='West Point OP McNair';
      scenario.designator = 'WL';
      scenario.gmAngle = -250,
      scenario.lat = 41.36289858633997;
      scenario.lon = -74.01923243991936;
      scenario.az = 165;
      //18T WL 82030 79507
      
      target[1] = {
        "e": 81900,
        "n": 78750,
        "model": "squad",
        "az": 40 }
      
      target[2] = {
        "e": 82100,
        "n": 78050,
        "model": "#T90Tank",
        "az": 0 }
      
      target[3] = {
        "e": 81800,
        "n": 78100,
        "model": "#BTR80",
        "az": 90 }
      
      target[4] = {
        "e": 81850,
        "n": 78150,
        "model": "#T90Tank",
        "az": 90 }
      
      break;
      
    case 1:
      scenario = {
        Name: 'West Point Test',
        designator: 'WL',
        gmAngle: -250,
        lat: 41.3499529,
        lon: -74.0195403,
        az: 328
      };   
      //18TWL8202178070
      
      //1st Platoon
      target[0] = {
        "e": 82110,
        "n": 79120,
        "model": "#T90Tank",
        "az": 140 }      
      target[1] = {
        "e": 82106,
        "n": 79110,
        "model": "#T90Tank",
        "az": 135 }      
      target[2] = {
        "e": 82100,
        "n": 79097,
        "model": "#T90Tank",
        "az": 150 }      
      target[3] = {
        "e": 82090,
        "n": 79057,
        "model": "#T90Tank",
        "az": 145 }
      
      //2nd Platoon
      target[4] = {
        "e": 81000,
        "n": 78150,
        "model": "#BTR80",
        "az": 5 }      
      target[5] = {
        "e": 81000,
        "n": 78000,
        "model": "#BTR80",
        "az": 45 }      
      target[6] = {
        "e": 81320,
        "n": 78000,
        "model": "squad",
        "az": 29 }      
      target[7] = {
        "e": 81050,
        "n": 78260,
        "model": "squad",
        "az": 20 }
      target[8] = {
        "e": 80200,
        "n": 77750,
        "model": "#BTR80",
        "az": 0 }  
      
      //3rd Platoon
      target[9] = {
        "e": 81000,
        "n": 79000,
        "model": "#T90Tank",
        "az": 0 }
      target[10] = {
        "e": 81000,
        "n": 78900,
        "model": "#T90Tank",
        "az": 10 }
      target[11] = {
        "e": 80950,
        "n": 78800,
        "model": "#T90Tank",
        "az": 15 }
      target[12] = {
        "e": 81040,
        "n": 78950,
        "model": "#soldier",
        "az": 90 }  
      break;
    
    case 2:
      scenario = {
        Name: 'Tower 4 Ridge',
        designator: 'ND',
        gmAngle: 74,
        lat: 34.6826690,
        lon: -98.4699191,        
        az: 270
      };
      //14SND4855737981
      
      target[0] = {
        "e": 47725,
        "n": 37805,
        "model": "squad",
        "az": 165 }
      
      target[1] = {
        "e": 47615,
        "n": 37969,
        "model": "#T90Tank",
        "az": 170 }
      
      target[2] = {
        "e": 47900,
        "n": 38020,
        "model": "#T90Tank",
        "az": 180 }
      
      target[3] = {
        "e": 47920,
        "n": 37600,
        "model": "#T90Tank",
        "az": 135 }      
      break;
      
      case 3:
      scenario = {
        Name: 'Ft Sill OB 11',
        designator: 'ND',
        gmAngle: 74,
        lat: 34.6661786,
        lon: -98.4542747,
        az: 315
      };      
      //14S ND 50000 36160
      
      target[0] = {
        "e": 47515,
        "n": 37879,
        "model": "#T90Tank",
        "az": 35 }
      
      target[1] = {
        "e": 47615,
        "n": 37969,
        "model": "#T90Tank",
        "az": 40 }
      
      target[2] = {
        "e": 47900,
        "n": 38020,
        "model": "#T90Tank",
        "az": 45 }
      
      target[3] = {
        "e": 47920,
        "n": 37500,
        "model": "#T90Tank",
        "az": 39 }      
      break; 
      
      case 4:
      scenario = {
        Name: 'Hill 876 East',
        designator: 'NV',
        gmAngle: 204,
        lat:  35.353608, 
        lon: -116.559363,
        az: 105
      };      
      //11SNV40041234
      
      target[0] = {
        "e": 43000,
        "n": 12000,
        "model": "#T90Tank",
        "az": 247 }
      
      target[1] = {
        "e": 43080,
        "n": 11900,
        "model": "#T90Tank",
        "az": 245 }
      
      target[2] = {
        "e": 43110,
        "n": 12110,
        "model": "#T90Tank",
        "az": 260 }
      
      target[3] = {
        "e": 43600,
        "n": 11900,
        "model": "squad",
        "az": 180 }    
      
      target[4] = {
        "e": 41500,
        "n": 11700,
        "model": "#T90Tank",
        "az": 270 }
      
      target[5] = {
        "e": 41550,
        "n": 11550,
        "model": "#T90Tank",
        "az": 270 }
      
      target[6] = {
        "e": 41600,
        "n": 11400,
        "model": "#T90Tank",
        "az": 270 }
      
      target[7] = {
        "e": 41640,
        "n": 11250,
        "model": "#T90Tank",
        "az": 270 }
      
      target[8] = {
        "e": 41450,
        "n": 13000,
        "model": "#BTR80",
        "az": 270 }
      
      target[9] = {
        "e": 41530,
        "n": 13000,
        "model": "#BTR80",
        "az": 270 }
      
      target[10] = {
        "e": 41605,
        "n": 13000,
        "model": "#BTR80",
        "az": 270 }
      
      target[11] = {
        "e": 41350,
        "n": 13015,
        "model": "#BTR80",
        "az": 270 }
      
      break;
  }
  setScenarioInfoDisplay(scenario,target);
 }

function setScenarioInfoDisplay (scenario,target) {
  
  opLocation = convertLatLon2Grid(scenario.lat,scenario.lon);
  opEastingInput.placeholder = opLocation[0];
  opNorthingInput.placeholder = opLocation[1];
  gmAngle = scenario.gmAngle;
  
  console.log(scenario);
  gameScenarioDisplay.innerText = scenario.Name;
  gameGridDesignatorDisplay.innerText = scenario.designator;
  gameGridDesignatorDisplay2.innerText = scenario.designator;
  gmAngleDisplay.innerText = gmAngle;
  socket.emit('newGame',JSON.stringify(scenario),JSON.stringify(target));
  init();
}

function convertLatLon2Grid(lat,lon) {
  console.log("Convert: ", lat, lon);
  const opGrid = mgrs.forward([lon, lat],5);
  const opParts = mgrs.decode(opGrid);
  const opEasting = opParts.easting.toString().slice(-5);
  const opNorthing = opParts.northing.toString().slice(-5);
  console.log("E:"+opEasting+" N:"+opNorthing);
  var data = [+opEasting,+opNorthing];
  console.log(data);
  return data;
}

function init() {
  initialScreen.style.display = "none";
  scenarioScreen.style.display = "none";
  gameScreen.style.display = "block";
  gameActive = true;
  fdcLogDisplay.value += "\nFDC ready: Waiting for observers \n";
  fdcLogDisplay.focus();
}

function handleInit(number) {
  playerNumber = number;
}

function handleInitFO(number) {
  playerNumber = number;
  const code = gameCodeInput.value;
  window.location.href = urlOrigin+'/FO.html?game=' + code;
}

function handleGameCode(gameCode) {
  scenario.gameCode = gameCode;
  gameCodeDisplay.innerText = gameCode;
  makeQrCode(gameCode);
  console.log('Game Code received: '+gameCode);
}

function handleUnknownCode() {
  reset();
  alert('Unknown Game Code')
}

function handleTooManyPlayers() {
  reset();
  alert('This game is already in progress');
}

function reset() {
  playerNumber = null;
  gameCodeInput.value = '';
  initialScreen.style.display = "block";
  gameScreen.style.display = "none";
}

function handleNewClient(numClients) {
  console.log("Client count change: "+numClients);
  //numConnectionsDisplay.innerText = numClients;
  sysMessageDisplay.innerText = "FO Count: " + numClients.toString();
  fdcLogDisplay.value += "FO Count: " + numClients.toString() +"\n";
  fdcLogDisplay.focus();
}

function handleClientReady() {
  readyCount +=1;
  fdcLogDisplay.value += "FO Ready: "+readyCount+"\n";
  fdcLogDisplay.focus();
}

//from:   https://davidshimjs.github.io/qrcodejs/ 
//MIT license
function makeQrCode (code) {
  var qrcode = new QRCode("qrcodeDisplay");
	var elText = urlOrigin+'/FO.html?game=' + code;
	
	if (!elText) {
		alert("no room code");
		return;
	}
	
	qrcode.makeCode(elText);
  //linkDisplay.innerText = elText;
  linkURL.href = elText;
}

function forceKeyPressUppercase(e)
  {
    var charInput = e.keyCode;
    if((charInput >= 97) && (charInput <= 122)) { // lowercase
      if(!e.ctrlKey && !e.metaKey && !e.altKey) { // no modifier key
        var newChar = charInput - 32;
        var start = e.target.selectionStart;
        var end = e.target.selectionEnd;
        e.target.value = e.target.value.substring(0, start) + String.fromCharCode(newChar) + e.target.value.substring(end);
        e.target.setSelectionRange(start+1, start+1);
        e.preventDefault();
      }
    }
  }

// from w3schools.com example for tabs
// https://www.w3schools.com/howto/howto_js_tabs.asp
// correctionTab  polarTab gridTab

document.getElementById("defaultOpen").click();

function openAdjustFire(evt, fireMissionType) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(fireMissionType).style.display = "block";
  evt.currentTarget.className += " active";
  console.log(fireMissionType);
  console.log(document.getElementById('correctionTab').style.display);
  console.log(document.getElementById('polarTab').style.display);
  console.log(document.getElementById('gridTab').style.display);
}

function randomApproxNormal (v = 5) {
  // simple method for creating approximately normal distro
  // v=5 iterations yields a mean ~0.5 and stdev ~0.125 (65% within 1 StDev)
  var r = 0;
  for (var i=v; i>0; i--) {
    r += Math.random();
  }
  return r/v;  
}

function shotError (cep = 15) { //was 30 drop to 15
  var a = 0.5 - randomApproxNormal(5); //random normal from -0.5 to +0.5 with mean zero
  var b = cep/0.125; // multiplier based on CEP, 66% should be within 'CEP'
  var c = b*a;
  console.log("calc shot error", c);
  return c;  
}

function handleReconnect () {
 if (scenario.gameCode) {
   socket.emit('reconnectFDC',scenario.gameCode, (response) => {
     switch(response){
       case 'OK':
         console.log('reconnected: resume game '+scenario.gameCode);
         alert('Reconnected: resume game '+scenario.gameCode);
         fdcLogDisplay.value += "Reconnected to server. Resume FDC.";
         fdcLogDisplay.focus();
         break;
       case 'ROOM EMPTY':
         console.log('reconnected: room empty');
         alert('Reconnected to server. Game no longer active. Resetting.');
         fdcLogDisplay.value += "GAME CODE DOES NOT EXIST ON SERVER. Click Exit.";
         fdcLogDisplay.focus();
         gameHitDisplay.innerText = "..EXIT GAME..";
         break;
     }
   });
 } else {
   console.log('No Code to reconnect');
 }
};