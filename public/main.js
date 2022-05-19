if (location.protocol !== 'https:') {
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
}

const urlOrigin = window.location.origin;
var socket = io(urlOrigin);//'https://observed-fire-test.glitch.me/');
  
socket.on('initFO', handleInitFO);
socket.on('gameCode', handleGameCode);
socket.on('hit', handleHit);
socket.on('unknownCode', handleUnknownCode);
socket.on('newClient', data => {
  console.log(data);
  handleNewClient(data);
});

var opLocation = [50000,50000];
var lastFireMission=[0,0];

const gameScreen = document.getElementById('gameScreen');
const scenarioScreen = document.getElementById('scenarioScreen');
const initialScreen = document.getElementById('initialScreen');
const newGameBtn = document.getElementById('newGameButton');
const joinGameBtn = document.getElementById('joinGameButton');
const gameCodeInput = document.getElementById('gameCodeInput');
const gameCodeDisplay = document.getElementById('gameCodeDisplay');
const linkURL = document.getElementById('linkURL');
const numConnectionsDisplay = document.getElementById('numConnectionsDisplay');
const sendFireMissionBtn = document.getElementById('sendFireMission');
const gameHitDisplay = document.getElementById('gameHitDisplay');
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

var scenario = {};
var target=[];

newGameBtn.addEventListener('click', scenarioPicker);
gameCodeInput .addEventListener("keypress", forceKeyPressUppercase, false);
joinGameBtn.addEventListener('click', joinGame);
sendFireMissionBtn.addEventListener('click', sendFireMission);
resetBtn.addEventListener('click', requestReset);
fireForEffectBtn.addEventListener('click', fireForEffect);

function handleHit () {
  gameHitDisplay.innerText = "..Hit!..";
  console.log("set hit display");
}

function sendFireMission() {
  console.log("FIRE MISSION!")  
  gameHitDisplay.innerText = ""; //reset
  
  var gridTabEl = document.getElementById('gridTab').style.display;
  var polarTabEl = document.getElementById('polarTab').style.display;
  var correctionTabEl = document.getElementById('correctionTab').style.display;
  var gridE;
  var gridN;
  if (polarTabEl == "block") {
    console.log("Adjust fire, polar");
    let direction = polarDirection.value;
    shiftDirection.value = direction;
    let distance = polarDistance.value;
    [gridE, gridN] = calcPolar2Grid(direction, distance, opLocation);//TODO add FO location- need way to send/track
    
  } else if (correctionTabEl =="block"){
    console.log("correct fire");    
    console.log(shiftAddDrop.checked,shiftRange.value,shiftRight.checked,shiftDeviation.value);
    polarDirection.value = shiftDirection.value;
    
    let [x,y] = getAdjustFireShift();
    let [adjEast,adjNorth] = calcAdjustFireShift(shiftDirection.value,x,y);
    gridE = lastFireMission[0] + adjEast;
    gridN = lastFireMission[1] + adjNorth;    
    console.log(x,y,adjEast,adjNorth);
    
  } else if (gridTabEl =="block") {
    console.log("Adjust Fire, grid");  
    console.log(gridEasting.value);
    gridE = gridEasting.value;
    gridN = gridNorthing.value;
  }
  const round = roundType.value;
  gridE = padGrid(gridE);
  gridN = padGrid(gridN);
  console.log(gridE, gridN, round);
  socket.emit('firemissionG',gridE, gridN, round);
  lastFireMission=[gridE,gridN]; //store for future
}

function fireForEffect() {
  const round = roundType.value;
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {  
      adjEast = Math.floor(Math.random() * 101) -50;
      adjNorth = Math.floor(Math.random() * 101) -50;
      gridE = lastFireMission[0] + adjEast;
      gridN = lastFireMission[1] + adjNorth;   
      gridE = padGrid(gridE);
      gridN = padGrid(gridN);
      console.log("Fire For Effect: ", gridE, gridN);
      socket.emit('firemissionG',gridE, gridN, round);
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
  console.log("send reset1");
  socket.emit('requestReset');
  gameHitDisplay.innerText = ""; //reset
  console.log("send reset2");
}

function joinGame() {
  const code = gameCodeInput.value;
  socket.emit('joinGame', code);
}

let canvas, ctx;
let playerNumber;
let gameActive = false;

function scenarioPicker() {
  initialScreen.style.display = "none";
  scenarioScreen.style.display = "block";
  gameScreen.style.display = "none";
}

function setScenario(scenarioID) {
  switch(scenarioID){
    case 0:
      scenario.Name='West Point OP McNair';
      scenario.designator = 'WL';
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
        "n": 7805,
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
  }  
  
  opLocation = convertLatLon2Grid(scenario.lat,scenario.lon);
  
  console.log(scenario);
  gameScenarioDisplay.innerText = scenario.Name;
  gameGridDesignatorDisplay.innerText = scenario.designator;
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
  gameCodeDisplay.innerText = gameCode;
  makeCode(gameCode);
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
  numConnectionsDisplay.innerText = numClients;
}

//from:   https://davidshimjs.github.io/qrcodejs/ 
//MIT license
function makeCode (code) {
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