//------------------------------------------------------------------------------
// Hook socket events to document events
//------------------------------------------------------------------------------

/**
 * Set up socket listeners
 */
var client = function() {
  var room = window.location.origin;
  this.socket = io().connect(room);

  this.socket.on('user-joined', function(data) {
    var evt = createEvent('user-joined');
    evt.nick = data.nick;
    evt.sid = data.sid;
    document.dispatchEvent(evt);
  });

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
