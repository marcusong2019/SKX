//const BG_COLOUR = '#231f20';
//const SNAKE_COLOUR = '#c2c2c2';
//const FOOD_COLOUR = '#e66916';

var socket = io('https://observed-fire-simulator.glitch.me/');
  
//socket.on('init', handleInit);
socket.on('initFO', handleInitFO);
//socket.on('gameState', handleGameState);
//socket.on('gameOver', handleGameOver);
socket.on('gameCode', handleGameCode);
socket.on('unknownCode', handleUnknownCode);
//socket.on('tooManyPlayers', handleTooManyPlayers);

const gameScreen = document.getElementById('gameScreen');
const scenarioScreen = document.getElementById('scenarioScreen');
const initialScreen = document.getElementById('initialScreen');
const newGameBtn = document.getElementById('newGameButton');
const joinGameBtn = document.getElementById('joinGameButton');
const gameCodeInput = document.getElementById('gameCodeInput');
const gameCodeDisplay = document.getElementById('gameCodeDisplay');
const sendFireMissionBtn = document.getElementById('sendFireMission');
const target1UpBtn = document.getElementById('target1UpButton');
const target2UpBtn = document.getElementById('target2UpButton');
const target3UpBtn = document.getElementById('target3UpButton');
const target4UpBtn = document.getElementById('target4UpButton');

newGameBtn.addEventListener('click', newGame);
joinGameBtn.addEventListener('click', joinGame);
sendFireMissionBtn.addEventListener('click', startTarget1);
target1UpBtn.addEventListener('click', startTarget(1));


function startTarget(tgtNum) {
  socket.emit('target',tgtNum);
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

//  canvas = document.getElementById('canvas');
// ctx = canvas.getContext('2d');

//  canvas.width = canvas.height = 600;

//  ctx.fillStyle = BG_COLOUR;
//  ctx.fillRect(0, 0, canvas.width, canvas.height);

//  document.addEventListener('keydown', keydown);
  gameActive = true;
}
/*
function keydown(e) {
  socket.emit('keydown', e.keyCode);
}

function paintGame(state) {
  ctx.fillStyle = BG_COLOUR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const food = state.food;
  const gridsize = state.gridsize;
  const size = canvas.width / gridsize;

  ctx.fillStyle = FOOD_COLOUR;
  ctx.fillRect(food.x * size, food.y * size, size, size);

  paintPlayer(state.players[0], size, SNAKE_COLOUR);
  paintPlayer(state.players[1], size, 'red');
}

function paintPlayer(playerState, size, colour) {
  const snake = playerState.snake;

  ctx.fillStyle = colour;
  for (let cell of snake) {
    ctx.fillRect(cell.x * size, cell.y * size, size, size);
  }
}
*/
function handleInit(number) {
  playerNumber = number;
}
function handleInitFO(number) {
  playerNumber = number;
  const code = gameCodeInput.value;
  window.location.href = 'https://observed-fire-simulator.glitch.me/FO.html?game=' + code;
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
