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
var users = [];
io.on("connection", function(socket) {

  socket.on("score", function(data) {
    const index = users
      .map(function(e) {
        return e.id;
      })
      .indexOf(socket.id);
    users[index]['score'] = data;
    io.emit("stats",users);
  });

  /* socket.on('adduser', function (name) {
       users.push({id: socket.id, name: name, score: 0});
       io.emit("stats", { data: users });
    });*/

  socket.on("newuser", function(nick) {
    var newUser = {id: socket.id, name: nick, score: 0};
    users.push(newUser);
    io.emit("users", users);
  });
});
