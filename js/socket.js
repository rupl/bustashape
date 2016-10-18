//------------------------------------------------------------------------------
// Hook socket events to document events
//------------------------------------------------------------------------------
var me = {};

/**
 * Set up socket listeners
 */
var createClient = function() {
  var room = window.location.origin;
  this.socket = io().connect(room);

  // Warn when the connection is lost.
  this.socket.on('disconnect', function () {
    console.warn('You\'re disconnected!');
  });

  // When connection is finally re-stablished, join the bustashape room.
  this.socket.on('reconnect', function () {
    console.info('Reconnecting...');

    // If there's a room name in the URL, reconnect.
    if (window.location.hash != '') {
      me.join();
    }
  });

  this.socket.on('user-joined', function(data) {
    var evt = createEvent('user-joined');
    evt.nick = data.nick;
    evt.sid = data.sid;
    document.dispatchEvent(evt);
  });

  this.socket.on('user-left', function(data) {
    var evt = createEvent('user-left');
    evt.nick = data.nick;
    evt.sid = data.sid;
    document.dispatchEvent(evt);
  });

  this.socket.on('sync-controls', function(data) {
    var evt = createEvent('sync-controls');
    evt.colors = data.colors;
    document.dispatchEvent(evt);
  });

  function createEvent(name) {
    var ev = document.createEvent('Event');
    ev.initEvent(name, true, true);
    return ev;
  }
};

/**
 * Allow events to be sent from client code.
 */
createClient.prototype.send = function(cmd, data, fn) {
  if ( fn != null ) {
    this.socket.emit(cmd, data, fn);
  } else {
    this.socket.emit(cmd, data);
  }
};

//
// init for this user.
//
/* eslint-disable no-unused-vars */
var client = new createClient();
