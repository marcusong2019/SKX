// Setup basic express server
var express = require("express");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io")(server);
var port = process.env.PORT || 3000;

server.listen(port, function() {
  console.log("Server listening at port %d", port);
});

// Routing
app.use(express.static("public"));

var numClients = 0;

io.on("connection", function(socket) {
  numClients++;
  io.emit("stats", { numClients: numClients });

 socket.on("score", function(data) {

    console.log("Score", data.score);
  });
  
  socket.on("disconnect", function() {
    numClients--;
    io.emit("stats", { numClients: numClients });

    console.log("Connected clients:", numClients);
  });
});
