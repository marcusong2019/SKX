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
  client.on('disconnect', (data) => handleDisconnect(data));
  client.on('hit',(dataA, dataB) => {handleHit(dataA, dataB)});
  client.on('requestReset',handleReset);
  client.on('changeGmAngle',(data) => {handleChangeGmAngle(data)});
  client.on('clientReady',handleClientReady);
  client.on('reconnectFDC', (roomName,callback)=>{
    console.log(roomName+": attempt to reconnect game");    
    const room = io.sockets.adapter.rooms[roomName];
    let allUsers;
    let numClients = 0;
    if (room) { allUsers = room.sockets; }
    if (allUsers) { numClients = Object.keys(allUsers).length; }
    if (numClients === 0) { //TODO Should this be >0?
      callback('ROOM EMPTY');
      console.log(roomName+': Room Empty. Close game.');
      return;
    }
    //reconnect FDC to the room
    clientRooms[client.id] = roomName;
    client.number = 1; //only FDC for this event
    client.join(roomName);    
    //inform room that FDC is online
    io.sockets.in(roomName)
    .emit('fdcReconnected');
    io.sockets.in(roomName)
    .emit('newClientCount',(numClients-1));
    console.log(roomName+': FDC reconnected to room');
    callback('OK');
  });
  
  function handleClientReady() {
    const roomName = clientRooms[client.id];
    io.sockets.in(roomName)
    .emit('newClientReady',client.id);
    console.log(roomName + ": FO Ready: "+client.id);
  }
  
  function handleChangeGmAngle(gmAngle) {
    const roomName = clientRooms[client.id];
    console.log(roomName+': Change GM Angle: ' + gmAngle);
    if (!roomName) {
      console.log('Error: no room name on Hit')
      return;
    }
      io.sockets.in(roomName)
    .emit('changeGmAngle',gmAngle);
    
    var tempScenario = JSON.parse(io.sockets.adapter.rooms[roomName].scenario);
    tempScenario.gmAngle = gmAngle;
    io.sockets.adapter.rooms[roomName].scenario = JSON.stringify(tempScenario)
    console.log(roomName+': Change GM Angle in scenario: ' + io.sockets.adapter.rooms[roomName].scenario);
  }
  
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
  
  function handleHit(targetId,targetType) {    
    const roomName = clientRooms[client.id];
    console.log(roomName+': hit');
    if (!roomName) {
      console.log('Error: no room name on Hit')
      return;
    }
      io.sockets.in(roomName)
    .emit('hit',targetId,targetType);
    io.sockets.adapter.rooms[roomName].targetArray.push(targetId);
  }
      
  function handleDisconnect(reason) {
    const roomName = clientRooms[client.id];
    console.log(roomName+': A user disconnected from room: '+reason);
    if (!roomName) {
      console.log('Error: no room name on disconnect')
      return;
    }
    let room = io.sockets.adapter.rooms[roomName]; //todo is there a better io way to get count?
    if (!room) {
      console.log('room empty', roomName);
      return;
    }
    
    if (client.number == 1) {
      //FDC disconnect
      console.log(roomName+': FDC disconnected');
      io.sockets.in(roomName)
      .emit('fdcDisconnect');
    } else if (client.number == 2) {
      //FO disconnect
      let numClients = room.length -1; //todo is there a better io way to get count?
      io.sockets.in(roomName)
      .emit('newClientCount',numClients);
      console.log(roomName+': FO disconnected. FO count: '+numClients);
    }
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
      console.log(roomName+": targets: ", io.sockets.adapter.rooms[roomName].targetArray);
  }
  
      function handleFireMission(gridE, gridN, round) {
      const roomName = clientRooms[client.id];
    if (!roomName) {
      console.log('Error: New fire mission but roomname does not exits');
      return;
    }
        console.log(roomName+': Fire Mission');
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
    client.number = 2;

    client.join(roomName);
    
    client.emit('initFO', 2);
    
    io.sockets.in(roomName)
    .emit('newClientCount',numClients);
    console.log(roomName+': client count: '+numClients);
    
    client.emit('reply','Room Joined '+roomName);
    
    client.emit('scenarioInfo', io.sockets.adapter.rooms[roomName].scenario, io.sockets.adapter.rooms[roomName].targetList, io.sockets.adapter.rooms[roomName].targetArray);
  }

  function handleNewGame(scenario,targets) {
    let roomName = makeid(5);
    clientRooms[client.id] = roomName;
    client.emit('gameCode', roomName);
    console.log('New Game ' + roomName + ' ' + scenario + targets);

    client.join(roomName);
    client.number = 1; 

    io.sockets.adapter.rooms[roomName].targetArray=[];
    io.sockets.adapter.rooms[roomName].targetList=targets;
    io.sockets.adapter.rooms[roomName].scenario=scenario;
  }
});