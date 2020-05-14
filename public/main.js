/* global io */
var socket = io();


  // Whenever the server emits 'stop typing', kill the typing message
socket.on('announcements', function(data) {
        console.log('Got announcement:', data.message);
    });

socket.emit('event', { message: 'Hey, I have an important message!' });

 socket.on('stats', function(data) {
        console.log('Connected clients:', data.numClients);
    });