/* global io */


  

  var socket = io();



  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('message', function(msg){
      console.log(msg);
      document.getElementById("message").innerHTML = msg;
    });