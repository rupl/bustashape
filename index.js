// Node/npm deps
var express = require('express');
var port = process.env.PORT || 3000;


// Initialize app
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


// Configure app details like templates and static assets
app.use(express.static(__dirname + '/public', {redirect: false}));


// Main app URL
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

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
   * A shape is being changed.
   */
  socket.on('change', function(props){
    console.log('CHANGE', props);
    socket.broadcast.emit('change', props);
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
http.listen(port, function(){
  console.log('Listening on port ' + port);
});
