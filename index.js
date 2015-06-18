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

/**
 * Someone connected.
 */
io.on('connection', function(socket){
  console.log('user: connected');

  /**
   * A new shape appears!
   */
  socket.on('add', function(props){
    console.log('ADD', props);
    io.emit('add', props);
  });

  /**
   * A shape is being dragged.
   */
  socket.on('change', function(props){
    console.log('CHANGE', props);
    io.emit('change', props);
  });

  /**
   * Someone got bored.
   */
  socket.on('disconnect', function(){
    console.log('user: disconnected');
    io.emit('status', 'someone left');
  });
});

/**
 * Listen for users to connect
 */
http.listen(3000, function(){
  console.log('Listening on port 3000');
});
