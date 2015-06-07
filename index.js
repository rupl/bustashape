// Node/npm deps
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Main app URL
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

// CSS/JS
app.use('/css', express.static(__dirname + '/css'));
app.use('/js', express.static(__dirname + '/js'));

// Sockets
io.on('connection', function(socket){
  console.log('a user connected');
  io.emit('status', 'someone joined');

  socket.on('add', function(props){
    console.log('shape added', props);
    io.emit('add', props);
  });

  socket.on('move', function(props){
    console.log('shape moved', props);
    io.emit('move', props);
  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
    io.emit('status', 'someone left');
  });
});

// Listen for users to connect
http.listen(3000, function(){
  console.log('listening on port 3000');
});
