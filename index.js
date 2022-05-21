// Setup basic express server
var express = require("express");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io")(server);
const { makeid } = require('./utils');

const state = {};
const clientRooms = {};
var port = process.env.PORT || 3000;

server.listen(port, function() {
  console.log("Server listening at port %d", port);
});

// Routing
app.use(express.static("public"));

io.on('connection', client => {
  console.log('new connection');

  client.on('newGame', (dataA, dataB) => {handleNewGame(dataA, dataB)});
  client.on('joinGame', (data) => handleJoinGame(data));
  client.on('test', handleTest);
  client.on('target', (data) => {handleNewTarget(data)});
  client.on('firemissionG', (dataA, dataB, dataC) => {handleFireMission(dataA, dataB, dataC)});
  client.on('disconnect', handleDisconnect);
  client.on('hit',handleHit);
  client.on('requestReset',handleReset);
  
  function handleReset() {
    const roomName = clientRooms[client.id];
    console.log('Request to Reset ' + roomName);    
    if (!roomName) {
      console.log('Error: no room name to reset')
      return;
    }
    io.sockets.in(roomName)
    .emit('reset');
    console.log('Reset ' + roomName);
  }
  
  function handleHit() {    
    const roomName = clientRooms[client.id];
    console.log('hit ' + roomName);
    if (!roomName) {
      console.log('Error: no room name on Hit')
      return;
    }
      io.sockets.in(roomName)
    .emit('hit');
  }
      
  function handleDisconnect() {
    console.log('A user disconnected');
  }
  
  function handleTest() {
    console.log('Replied to test message');
    client.emit('reply','hello');
  }

    function handleNewTarget(tgtNum) {
      const roomName = clientRooms[client.id];
    if (!roomName) {
      console.log('Error: New target but roomname does not exist');
      return;
    }
      io.sockets.in(roomName)
    .emit('target',tgtNum);
      io.sockets.adapter.rooms[roomName].targetArray[tgtNum]=true;
      console.log("targets: ", io.sockets.adapter.rooms[roomName].targetArray);
  }
  
      function handleFireMission(gridE, gridN, round) {
      const roomName = clientRooms[client.id];
    if (!roomName) {
      console.log('Error: New fire mission but roomname does not exits');
      return;
    }
        console.log('Fire Mission ' + roomName);
      io.sockets.in(roomName)
    .emit('firemissionG',gridE, gridN, round);
  }
  
  function handleJoinGame(roomName, callback) {
    const room = io.sockets.adapter.rooms[roomName];
console.log("join game " + roomName);
    let allUsers;
    if (room) {
      allUsers = room.sockets;
    }

    let numClients = 0;
    if (allUsers) {
      numClients = Object.keys(allUsers).length;
    }

    if (numClients === 0) {
      client.emit('unknownCode');
      console.log('unknown code');
      return;
    } 
    
    clientRooms[client.id] = roomName;

    client.join(roomName);
    
    client.emit('initFO', 2);
    
    io.sockets.in(room)
    .emit('newClient',numClients);
    console.log(numClients);
    
    client.emit('reply','Room Joined '+roomName);
    
    client.emit('scenarioInfo', io.sockets.adapter.rooms[roomName].scenario, io.sockets.adapter.rooms[roomName].targetList);
  }

  function handleNewGame(scenario,targets) {
    let roomName = makeid(5);
    clientRooms[client.id] = roomName;
    client.emit('gameCode', roomName);
    console.log('New Game ' + roomName + ' ' + scenario);

    client.join(roomName);
    client.number = 1;
    io.sockets.adapter.rooms[roomName].targetArray=[false,false,false,false,false];
    io.sockets.adapter.rooms[roomName].targetList=targets;
    io.sockets.adapter.rooms[roomName].scenario=scenario;
  }
});