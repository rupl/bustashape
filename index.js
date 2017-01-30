// Node/npm deps
var express = require('express');
var config = require('./config.json');
var dust = require('dustjs-linkedin');
var cons = require('consolidate');
var pixel = require('node-pixel');
var five = require('johnny-five');
// var Twitter = require('twitter');

var port = process.env.PORT || 8080;
var env = process.env.NODE_ENV || 'local';
var GA = process.env.GA || '';
var rooms = [];
var strip = null;

// Initialize app
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Twitter
// var twitter = new Twitter({
//   consumer_key: process.env.TWITTER_CONSUMER_KEY,
//   consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
//   access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
//   access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
// });

// Twitter threshold. Number of people that must be present to tweet the room.
// var TWITTER_THRESHOLD = process.env.TWITTER_THRESHOLD || 2;

// Expose static assets
app.use(express.static(__dirname + '/_public', {redirect: false}));

// Main app URL
app.get('/', function(req, res){
  cons.dust('views/index.dust', {
    palette: config.palettes[Math.floor(Math.random() * config.palettes.length)],
    GA: GA,
    env: env
  }, function (err, out) {
    if (err) {console.error(err); }
    res.send(out);
  });
});

five.Board().on('ready', function() {
  console.log('Arduino is ready.');
  var led = new five.Led(10);
  led.brightness(48);

  // Setup the NeoPixel ring
  strip = new pixel.Strip({
    board: this,
    controller: "FIRMATA",
    strips: [ {pin: 6, length: 64}, ],
    gamma: 3.6, // 3.6 = night, 2.6 = bright day
  });

  // for debugging, allow REPL interaction with NeoPixel.
  this.repl.inject({
    strip: strip
  });

  // Start app after NeoPixel is ready.
  strip.on("ready", function() {
    console.log("👍  NeoPixel is ready with " + strip.length + " LEDs");
    strip.off();

    /**
     * Someone connected.
     */
    io.on('connection', function(socket){
      // console.log('👥➡  somebody connected');
      var client;
      var roomName;
      var nickname;

      /**
       * A user is joining a room.
       */
      socket.on('join', function(data, fn) {
        // Sanitize input.
        nickname = (data.nick) ? data.nick.toLowerCase().replace(/[^\d\w- ]+/gi, '') : false;
        roomName = (data.room) ? data.room.toLowerCase().replace(/[^\d\w-]+/gi, '') : false;

        // Pick a nickname when none was entered.
        if (!nickname) {
          nickname = Math.random().toString(16).slice(2);
        }

        // Join the requested room or create it.
        if (!roomName) {
          roomName = config.rooms[Math.floor(Math.random() * config.rooms.length)];
        }

        // Set up the room
        if (typeof(rooms[roomName]) === 'undefined') {
          // This room is new. Create the array in the room.
          rooms[roomName] = [];
        } else {
          // This game exists, check for duplicate names
          for ( client in rooms[roomName] ) {
            if (nickname == rooms[roomName][client].nick ) {
              fn( false, 'Nickname already in use.' );
              return;
            }
          }
        }

        // Log the event.
        console.log('👥➡🚪  %s is joining %s', nickname, roomName);

        // List user as a member of the room.
        client = {
          sid: socket.id,
          nick: nickname
        };
        rooms[roomName].push(client);

        // Join room
        socket.join(roomName);

        // Tell others that this person joined.
        socket.broadcast.in(roomName).emit('user-joined', {
          'nick': client.nick,
          'sid' : client.sid
        });

        // Format data for client-side consumption and return it to client.
        // This is received as callback data on the computer who just joined.
        fn(true, {
          'sid': client.sid,
          'nick': nickname,
          'room': roomName,
          'users': rooms[roomName]
        });

        // Broadcast on twitter
        // if (rooms[roomName].length >= TWITTER_THRESHOLD) {
        //   var randomTweet = config.tweets[Math.floor(Math.random() * config.tweets.length)];
        //   twitter.post('statuses/update', {status: randomTweet + ' http://bustashape.com/#' + roomName},  function(error, tweet, response) {
        //     if (error) throw error;
        //     // Log the tweet.
        //     console.log('📣  ', tweet.text)
        //     console.log('🔗  ', 'https://twitter.com/bustashape/status/' + tweet.id);
        //   });
        // }
      });

      function drawSquare(props) {
        var ROW = 8;
        var COL = 1;

        var coords = {
          x: Math.round((props.transform.ww/2 - props.transform.x) / (props.transform.ww / 8)) * COL,
          y: Math.round((props.transform.wh/2 - props.transform.y) / (props.transform.wh / 8)) * ROW,
        }


        // figure out where to start drawing
        // TODO: avoid resolving to default when value is 0
        var ORIGIN = Math.round(27 - coords.x - coords.y) || 27;
        coords.origin = ORIGIN;
        console.log(coords);

        // don't draw beyond LED array. if the params are out of bounds then
        // don't draw anything!
        //
        // TODO: instead of bailing, validate data and allow for partial draws
        // by checking each of the four coords and only drawing those that are
        // inn bounds.
        if (ORIGIN < 0) { return; }
        if (ORIGIN > strip.length - COL - ROW - 1) { return; }

        // draw!
        strip.off();
        strip.pixel(ORIGIN).color(props.color);
        strip.pixel(ORIGIN + COL).color(props.color);
        strip.pixel(ORIGIN + ROW).color(props.color);
        strip.pixel(ORIGIN + ROW + COL).color(props.color);
        strip.pixel(ORIGIN).color(props.color);
        strip.show();
      }

      /**
       * A new shape appears!
       */
      socket.on('add', function(props){
        // We use io.to() instead of socket.to() because when a shape is
        // added, all clients (including the person who initiated the ADD command)
        // need to receive the ADD event in order to create the shape onscreen.
        io.to(props.room).emit('add', props);
        console.log('🔷💥 ', JSON.stringify(props).replace('\n',''));

        props.transform = {};
        props.transform.x = props.x;
        props.transform.y = props.y;

        console.log(props);

        drawSquare(props);
      });

      /**
       * Pass shapes along to new users.
       */
      socket.on('sync-shapes', function (id, shapes) {
        console.log('🔷🔄 ', id, shapes.length, 'shapes total');

        // Split out the payload and emit individual shapes to the new user.
        shapes.forEach(function (shape) {
          socket.to(id).emit('add', shape);
        });
      });

      /**
       * Configure each user's controls remotely
       */
      socket.on('sync-controls', function (id, controls) {
        console.log('📱🔄 ', id, controls);

        socket.to(id).emit('sync-controls', controls);
      });

      /**
       * A shape is being changed.
       */
      socket.on('change', function(props){
        // We use socket.to() instead of io.to() because when shapes are
        // changed, the client who is making the changes should NOT receive the
        // socket data. it happens locally only, and then the changes are then
        // broadcast to all other clients.
        socket.to(props.room).emit('change', props);
        console.log('🔷💨 ', JSON.stringify(props).replace('\n',''));

        drawSquare(props);
      });

      /**
       * Someone got bored.
       */
      socket.on('disconnect', function() {
        if ( !roomName ) {
          // No room was found. The server probably restarted so just bail.
          return false;
        }

        /* Iterate over the bucket _backwards_ so we can cleanly remove the departing
         * client having to recalculate the length (as you would in a for loop) */
        var i = rooms[roomName].length;
        while (i--) {
          if (rooms[roomName][i].sid === socket.id) {
            var client = rooms[roomName][i];
            rooms[roomName].splice(i, 1);

            // This data is safe to broadcast since it's coming from the stored
            // rooms, not the incoming socket data.
            socket.broadcast.emit('user-left', {
              'nick': client.nick,
              'sid' : client.sid
            });

            // Log the event.
            console.log('👥⬅🚪  %s left %s', nickname || 'somebody', roomName || 'an unknown room');
          }
        }

        // Log the event.
        console.log('👥⬅   %s disconnected', nickname || 'somebody');

        // Forget room name
        //
        // If we add a logout button, the UI would reset to the login page and it
        // would be more important for this variable to be reset. But for the time
        // being it's just a formality to unset the room name.
        roomName = null;
      });
    });
  });
});

/**
 * Listen for users to connect
 */
http.listen(port, function(){
  console.log('⚡  Listening on port ' + port + ' in ' + env + ' mode.');
});
