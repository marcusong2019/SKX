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

  client.on('newGame', handleNewGame);
  client.on('joinGame', handleJoinGame);
  client.on('test', handleTest);
  client.on('target', (data) => {handleNewTarget(data)});
  client.on('firemissionG', (dataA, dataB, dataC) => {handleFireMission(dataA, dataB, dataC)});
  client.on('disconnect', handleDisconnect);
  client.on('hit',handleHit);
  
  function handleHit() {
    console.log('hit');
    const roomName = clientRooms[client.id];
    if (!roomName) {
      return;
    }
      io.sockets.in(roomName)
    .emit('hit');
  }
      
  function handleDisconnect() {
    console.log('A user disconnected');
  }
  
  function handleTest() {
    client.emit('reply','hello');
  }

    function handleNewTarget(tgtNum) {
      const roomName = clientRooms[client.id];
    if (!roomName) {
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
      return;
    }
      io.sockets.in(roomName)
    .emit('firemissionG',gridE, gridN, round);
  }
  
  
  function handleJoinGame(roomName) {
    const room = io.sockets.adapter.rooms[roomName];
console.log("join game");
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
      return;
    } 
    
    clientRooms[client.id] = roomName;

    client.join(roomName);
    //client.number = 2;
    client.emit('initFO', 2);
    
    io.sockets.in(room)
    .emit('newClient',numClients);
    console.log(numClients);
    
    client.emit('reply','Room Joined '+roomName);
  }

  function handleNewGame() {
    let roomName = makeid(5);
    clientRooms[client.id] = roomName;
    client.emit('gameCode', roomName);

    //state[roomName] = initGame();

    client.join(roomName);
    client.number = 1;
    client.emit('init', 1);
    io.sockets.adapter.rooms[roomName].targetArray=[false,false,false,false,false];
  }
});