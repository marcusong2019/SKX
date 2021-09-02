if (location.protocol !== 'https:') {
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
}

const urlOrigin = window.location.origin;
var socket = io(urlOrigin);//'https://observed-fire-test.glitch.me/');
  
//socket.on('init', handleInit);
socket.on('initFO', handleInitFO);
//socket.on('gameState', handleGameState);
//socket.on('gameOver', handleGameOver);
socket.on('gameCode', handleGameCode);
socket.on('hit', handleHit);
socket.on('unknownCode', handleUnknownCode);
socket.on('newClient', data => {
  console.log(data);
  handleNewClient(data);
});

var opEasting = 82030; // TODO get from
var opNorthing = 79507;
var opLocation = [opEasting, opNorthing];
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
const target1UpBtn = document.getElementById('target1UpButton');
const target2UpBtn = document.getElementById('target2UpButton');
const target3UpBtn = document.getElementById('target3UpButton');
const target4UpBtn = document.getElementById('target4UpButton');
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

newGameBtn.addEventListener('click', newGame);
gameCodeInput .addEventListener("keypress", forceKeyPressUppercase, false);
joinGameBtn.addEventListener('click', joinGame);
sendFireMissionBtn.addEventListener('click', sendFireMission);

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
    let distance = polarDistance.value;
    [gridE, gridN] = calcPolar2Grid(direction, distance, opLocation);//TODO add FO location- need way to send/track
    
  } else if (correctionTabEl =="block"){
    console.log("correct fire");
    
    console.log(shiftAddDrop.checked,shiftRange.value,shiftRight.checked,shiftDeviation.value);
    
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

function newGame() {
  socket.emit('newGame');
  scenarioPicker();
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

function setScenario(scenarioName) {
  gameScenarioDisplay.innerText = scenarioName;
  init();
}

function init() {
  initialScreen.style.display = "none";
  scenarioScreen.style.display = "none";
  gameScreen.style.display = "block";
  splashMesage.style.display = "none";
  //shotTimer.style.display = "none";

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
/*
function handleGameState(gameState) {
  if (!gameActive) {
    return;
  }
  gameState = JSON.parse(gameState);
  requestAnimationFrame(() => paintGame(gameState));
}

function handleGameOver(data) {
  if (!gameActive) {
    return;
  }
  data = JSON.parse(data);

  gameActive = false;

  if (data.winner === playerNumber) {
    alert('You Win!');
  } else {
    alert('You Lose :(');
  }
}
*/
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