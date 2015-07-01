var $ = function (selector) { return document.querySelector(selector); }
var reqAnimationFrame = (function () {
  return window[Hammer.prefixed(window, 'requestAnimationFrame')] || function (callback) {
    window.setTimeout(callback, 1000 / 60);
  };
})();
var client = new client();
var me = {};

/**
 * Socket listeners
 */
document.addEventListener('user-joined', userJoined, true);

/**
 * Add a new shape.
 */
$('#add').addEventListener('click', function(ev) {
  // Send to ALL clients including self. It doesn't immediately add a shape to
  // your DOM, the 'add' listener below handles that part.
  socket.emit('add', {
    id: 'shape-' + Math.floor(Math.random() * 1000000000),
    opacity: $('#opacity').value,
    backgroundColor: $('#color').value,
    mixBlendMode: $('#mix-blend').value
  });
  ev.preventDefault();
});

/**
 * Listen for new shapes and add them to DOM.
 */
socket.on('add', function(props) {
  // Create a new element
  var el = document.createElement('div');
  el.id = props.id;
  el.classList.add('shape', 'unchanged');
  el.style.opacity = props.opacity;
  el.style.backgroundColor = props.backgroundColor;
  el.style.mixBlendMode = props.mixBlendMode;

  // Add the new element
  $('#canvas').appendChild(el);

  // Set up Hammer
  var el = document.getElementById(props.id);
  var mc = new Hammer.Manager(el);
  var initX;
  var initY;
  var initAngle = 0;
  var initScale = 1;
  var timer;
  var ticking = false;
  var transform = {
    x: 0,
    y: 0,
    z: 0,
    scale: initScale,
    angle: initAngle,
    rx: 0,
    ry: 0,
    rz: 0
  };

  //----------------------------------------------------------------------------
  // Rendering functions
  //----------------------------------------------------------------------------

  /**
   * Ask for a render and broadcast the shape's current properties.
   */
  function requestElementUpdate(broadcast) {
    if(!ticking) {
      reqAnimationFrame(updateElementTransform);
      ticking = true;

      if (broadcast !== false) {
        client.send('change', {
          me: socket.id,
          id: props.id,
          transform: transform
        });
      }
    }
  }

  /**
   * rAF callback which paints to the screen and emits the movement to others.
   */
  function updateElementTransform() {
    var value = [
      'translate3d(' + transform.x + 'px, ' + transform.y + 'px, ' + transform.z + 'px)',
      'scale(' + transform.scale + ', ' + transform.scale + ')',
      'rotate3d('+ transform.rx +','+ transform.ry +','+ transform.rz +','+  transform.angle + 'deg)'
    ];

    value = value.join(' ');
    el.style.webkitTransform = value;
    el.style.mozTransform = value;
    el.style.transform = value;
    ticking = false;
  }

  //----------------------------------------------------------------------------
  // Touch gestures
  //----------------------------------------------------------------------------

  // Set up the main gesture, multi-touch dragging/rotating
  mc.add(new Hammer.Pan({ threshold: 0, pointers: 0 }));
  mc.add(new Hammer.Rotate({ threshold: 0 })).recognizeWith(mc.get('pan'));
  mc.add(new Hammer.Pinch({ threshold: 0 })).recognizeWith([mc.get('pan'), mc.get('rotate')]);
  mc.on("panstart panmove", onPan);
  mc.on("rotatestart rotatemove", onRotate);
  mc.on("pinchstart pinchmove", onPinch);

  // Tapping gesture
  // mc.add(new Hammer.Tap());
  // mc.on("tap", onTap);

  // Double tapping gesture
  // mc.add(new Hammer.Tap({ event: 'doubletap', taps: 2 }));
  // mc.on("doubletap", onDoubleTap);

  // Clean up all gestures by doing a final render/broadcast.
  mc.on("hammer.input", function(ev) {
    if(ev.isFinal) {
      requestElementUpdate();
    }
  });

  /**
   * Hammer: listen for pan
   */
  function onPan(ev) {
    if (ev.type == 'panstart') {
      // The first time any shape moves, it needs this class removed.
      el.classList.remove('unchanged');

      // Get the starting position for this gesture
      initX = transform.x || 0;
      initY = transform.y || 0;
    }

    // We're already moving, use the values we stored during 'panstart'
    if (ev.type == 'panmove') {
      transform.x = parseInt(initX, 10) + parseInt(ev.deltaX, 10);
      transform.y = parseInt(initY, 10) + parseInt(ev.deltaY, 10);
    }

    requestElementUpdate();
  }

  /**
   * Hammer: listen for pinch
   */
  function onPinch(ev) {
    if (ev.type == 'pinchstart') {
      initScale = transform.scale || 1;
    }

    transform.scale = initScale * ev.scale;

    requestElementUpdate();
  }

  /**
   * Hammer: listen for rotate
   */
  function onRotate(ev) {
    if (ev.type == 'rotatestart') {
      initAngle = transform.angle || 0;
    }

    transform.rz = 1;
    transform.angle = parseInt(initAngle, 10) + parseInt(ev.rotation, 10);

    requestElementUpdate();
  }

  /**
   * Hammer: listen for tap
   */
  // function onTap(ev) {
  //   clearTimeout(timer);

  //   timer = setTimeout(function () {
  //     requestElementUpdate();
  //   }, 200);

  //   requestElementUpdate();
  // }

  /**
   * Hammer: listen for double tap
   */
  // function onDoubleTap(ev) {
  //   transform.rx = 1;
  //   transform.angle = 80;

  //   clearTimeout(timer);
  //   timer = setTimeout(function () {
  //     requestElementUpdate();
  //   }, 500);
  //   requestElementUpdate();
  // }

  //----------------------------------------------------------------------------
  // Socket listeners
  //----------------------------------------------------------------------------

  /**
   * Listen for this shape to change.
   */
  socket.on('change', function(props) {
    if (props.id === el.id) {
      // In case this is the first time the shape has moved, remove this class.
      el.classList.remove('unchanged');

      // Transform and animate the shape.
      transform = props.transform;
      requestElementUpdate(false);
    }
  });
});

/**
 * Log a user in
 */
function join() {
  me.nick = $('#nick').value;
  me.room = $('#room').value || false;

  var data = {
    'nick': me.nick,
    'room': me.room
  };

  // Attempt to join the room.
  client.send('join', data, function (res, data) {
    // Something went wrong.
    if (!res) { alert(data); return false; }

    // Join the room.
    client.room = data.room;
    window.location.hash = ('#' + data.room);

    // Hide login form.
    $('#btn-login').value = '👍';
    setTimeout(function () {
      $('#form-login').classList.add('hidden');
    }, 1000);
  });
}

// Listen for form submission.
$('#form-login').addEventListener('submit', function (ev) {
  join();
  ev.preventDefault();
});

// Auto-fill room name when hash is present
if (window.location.hash !== '') {
  $('#room').value = window.location.hash;
}

/**
 * The server reports that a new person has connected.
 */
function userJoined(data) {
  // One day we'll have an indicator that someone joined. It would go here.

  // Log to console.
  console.info('Heads up, %s just joined!', data.nick);
}
