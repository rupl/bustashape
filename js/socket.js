//------------------------------------------------------------------------------
// Hook socket events to document events
//------------------------------------------------------------------------------
var socket = io();

/**
 * Set up socket listeners
 */
var client = function() {
  var room = window.location.origin;
  this.socket = io.connect(room);

  // Someone joined!
  this.socket.on('user-join', function(data) {
    var evt = createEvent('user-join');
    evt.nick = data.nick;
    evt.sid = data.sid;
    document.dispatchEvent(evt);
  });

  // Someone got bored..
  this.socket.on('user-quit', function(data) {
    var evt = createEvent('user-quit');
    evt.nick = data.nick;
    evt.sid = data.sid;
    document.dispatchEvent(evt);
  });

  // Helper function to create events.
  function createEvent(name) {
    var ev = document.createEvent('Event');
    ev.initEvent(name, true, true);
    return ev;
  }
}

/**
 * Allow events to be sent from client code.
 */
client.prototype.send = function(cmd, data, fn) {
  if ( fn != null ) {
    this.socket.emit(cmd, data, fn);
  } else {
    this.socket.emit(cmd, data);
  }
}
