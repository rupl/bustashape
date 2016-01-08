// Node/npm deps
var express = require('express');
var config = require('./config.json');
var dust = require('dustjs-linkedin');
var cons = require('consolidate');
var busta = require('./js/server/bustashape');
var port = process.env.PORT || 8080;
var env = process.env.NODE_ENV || 'development';
var GA = process.env.GA || '';
var rooms = [];

// Initialize app
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


// Expose static assets
app.use(express.static(__dirname + '/_public', {redirect: false}));


// Main app URL
app.get('/', function(req, res){
  cons.dust('views/index.dust', {
    GA: GA
  }, function (err, out) {
    if (err) {console.error(err); }
    res.send(out);
  });
});

/**
 * Someone connected.
 */
io.on('connection', function(socket){
  console.log('user: connected');

  /**
   * A user is joining a room.
   */
  socket.on('join', function(data, fn) {
    // Sanitize input.
    var client = {};
    var nickname = (data.nick) ? data.nick.toLowerCase().replace(/[^\d\w- ]+/gi, '') : false;
    var roomName = (data.room) ? data.room.toLowerCase().replace(/[^\d\w-]+/gi, '') : false;

    // Force a nickname.
    if (!nickname) {
      // The client will see `false` and alert this message.
      fn( false, 'Please pick a nickname.' );
      return;
    }

    // Join the requested room or create it.
    if (!roomName) {
      // Generate strings until a room name is found.
      var attempts = 0;
      while ( !roomName && (rooms[roomName] !== 'undefined') ) {
        if ( attempts < 5 ) {
          roomName = config.rooms[Math.floor(Math.random() * config.rooms.length)];
        } else {
          // We've failed to get a friendly room name. Just make a random string.
          roomName = Math.floor(Math.random() * 100000);
        }
        attempts++;
      }
    }

    // Set up the room
    if (typeof(rooms[roomName]) === 'undefined') {
      // This room is new. Create the array in the room.
      rooms[roomName] = [];
    } else {
      // This room exists, check for duplicate names
      for ( client in rooms[roomName] ) {
        if (nickname == rooms[roomName][client].nick ) {
          fn( false, 'Nickname already in use.' );
          return;
        }
      }
    }

    // Store the room name.
    socket.room = roomName;

    // Log the event.
    console.log('user: %s is joining %s', nickname, roomName);

    // List user as a member of the room.
    client = {
      sid: socket.id,
      nick: nickname,
      room: roomName
    };
    rooms[roomName].push(client);

    // Join room
    socket.join(roomName);

    // Tell others that this person joined.
    socket.broadcast.to(socket.room).emit('user-join', {
      'nick': client.nick,
      'sid' : client.sid
    });

    // Callback
    fn(true, {
      'sid': client.sid,
      'nick': nickname,
      'room': roomName,
      'users': rooms[roomName]
    });
  });


  /**
   * A new shape appears!
   */
  socket.on('add', function(props){
    console.log('ADD', socket.room, props);
    // Don't use socket.broadcast because the user who initiated the event needs
    // to receive it in the same fashion as the others in the room.
    io.to(socket.room).emit('add', props);
  });

  /**
   * A shape is being changed.
   */
  socket.on('change', function(props){
    console.log('CHANGE', socket.room, props);

    busta.checkForChanges(props, function nopeCB() {
      console.log('no collision right now');
      socket.broadcast.to(socket.room).emit('change', props);
    }, function yepCB() {
      console.log('💥 💥 💥  collision!!! 💥 💥 💥 ');

      // ...now do something to clone the shape and assign it to the last person
      // who touched it.
    });
  });

  /**
   * Someone got bored.
   */
  socket.on('disconnect', function() {
    // Get current room
    var room = socket.room;

    if ( !room ) {
      // No room was found. The server probably restarted so just bail.
      return false;
    }

    // Iterate over the bucket backwards so we can cleanly remove the departing
    // client without having to recalculate the length (like a for loop).
    var i = rooms[room].length;
    while (i--) {
      if (rooms[room][i].sid === socket.id) {
        var client = rooms[room][i];
        rooms[room].splice(i, 1);

        // This data is safe to send out since it's coming from the stored
        // rooms, not the incoming socket data.
        socket.broadcast.to(socket.room).emit('user-quit', {
          'nick': client.nick,
          'sid' : client.sid
        });

        // Log the event.
        console.log("Shucks. %s disconnected..", client.nick);
      }
    }
  });
});

/**
 * Listen for users to connect
 */
http.listen(port, function(){
  console.log('Listening on port ' + port);
});
