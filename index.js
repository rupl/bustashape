(function () {
  var express = require('express'),
      app = express(),
      server = require('http').Server(app),
      io = require('socket.io')(server),
      debug = require('debug')('bustashape'),
      redis = require('redis'),
      client = redis.createClient(),
      dust = require('dustjs-linkedin'),
      cons = require('consolidate'),
      config = require('./config.json'),
      rooms = [];

  /**
   * Setup Express to serve the index
   */
  app
    .use(express.static(__dirname + '/public', {redirect: false}))
    .get('/', function (req, res){
      cons
        .dust('views/index.dust', { GA: process.env.GA || ''}, function (err, out) {
          if (err) {
            debug(err);
            return res.send(err);
          }
          return res.send(out);
        });
    })
    .get('/playback', function (req, res) {
      if (req.query.hasOwnProperty('room') && req.query.room !== ''){
        client.lrange(req.query.room, 0, 999, function (err, replies) {
          res.send(replies.map(function (e) {
            return JSON.parse(e);
          }));
        })
      }
    });

  /**
   * Someone connected.
   */
  io.on('connection', function (socket) {
    debug('user: connected');

    /**
     * A user is joining a room.
     */
    socket.on('join', function (data, fn) {
      // Sanitize input.
      var client = {},
          nickname = (data.nick) ? data.nick.toLowerCase().replace(/[^\d\w- ]+/gi, '') : false,
          roomName = (data.room) ? data.room.toLowerCase().replace(/[^\d\w-]+/gi, '') : false;

      // Force a nickname.
      if (!nickname) {
        // The client will see `false` and alert this message.
        fn(false, 'Please pick a nickname.');
        return;
      }

      // Join the requested room or create it.
      if (!roomName) {
        // Generate strings until a room name is found.
        var attempts = 0;
        while (!roomName && (rooms[roomName] !== 'undefined')) {
          if (attempts < 5) {
            roomName = config.rooms[Math.floor(Math.random() * config.rooms.length)];
          }
          else {
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
        // This game exists, check for duplicate names
        for ( client in rooms[roomName] ) {
          if (nickname == rooms[roomName][client].nick ) {
            fn(false, 'Nickname already in use.');
            return;
          }
        }
      }

      // Store the room name.
      socket.room = roomName;

      // Log the event.
      debug('user: %s is joining %s', nickname, roomName);

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
      socket.broadcast.in(roomName).emit('user-joined', {
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
    socket.on('add', function (props) {
      debug('ADD', props);
      io.to(socket.room).emit('add', props);
      client.multi([
        ['rpush', socket.room, JSON.stringify(props)],
        ['ltrim', socket.room, 0, 999]
      ]).exec(function (error, replies) {
        if (error) {
          debug('Unable to store this action in Redis.');
        }
      });
    });

    /**
     * A shape is being changed.
     */
    socket.on('change', function (props) {
      debug('CHANGE', socket.room, props);
      socket.broadcast.to(socket.room).emit('change', props);
      client.multi([
        ['rpush', socket.room, JSON.stringify(props)],
        ['ltrim', socket.room, 0, 999]
      ]).exec(function (error, replies) {
        if (error) {
          debug('Unable to store this action in Redis.');
        }
      });
    });

    /**
     * Someone got bored.
     */
    socket.on('disconnect', function() {
      // Get current room
      var room = socket.room,
          i;

      if (!room) {
        // No room was found. The server probably restarted so just bail.
        return false;
      }

      /* Iterate over the bucket _backwards_ so we can cleanly remove the departing
       * client having to recalculate the length (as you would in a for loop) */
      i = rooms[room].length;
      while (i--) {
        if (rooms[room][i].sid == socket.id) {
          var client = rooms[room][i];
          rooms[room].splice(i, 1);

          // This data is safe to send out since it's coming from the stored
          // rooms, not the incoming socket data.
          socket.broadcast.emit('client-disconnect', {
            'nick': client.nick,
            'sid' : client.sid
          });

          // Log the event.
          debug("Shucks. %s disconnected..", client.nick);
        }
      }
    });
  });

  /**
   * Listen for users to connect
   */
  server.listen(process.env.PORT || 3000, function(){
    debug('Listening on %s ', process.env.PORT || 3000);
  });

  return server;
})();
