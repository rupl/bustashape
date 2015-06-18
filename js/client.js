var socket = io();
var reqAnimationFrame = (function () {
  return window[Hammer.prefixed(window, 'requestAnimationFrame')] || function (callback) {
    window.setTimeout(callback, 1000 / 60);
  };
})();

/**
 * Add a new shape on all clients. It doesn't immediately add a shape to your
 * DOM, the 'add' listener below handles that part.
 */
$('#add').click(function(e){
  socket.emit('add', {
    id: 'shape-' + Math.floor(Math.random() * 1000000000),
    opacity: $('#opacity').val(),
    backgroundColor: $('#color').val(),
    width: $('#size').val() + 'px',
    height: $('#size').val() + 'px',
    mixBlendMode: $('#mix-blend').val(),
    position: 'absolute'
  });
  e.preventDefault();
});

/**
 * Listen for new additions and add them to DOM.
 */
socket.on('add', function(props) {
  // Add the new element
  $('#canvas').append($('<div>')
    .addClass('shape')
    .attr('id', props.id)
    .css(props)
  );

  // Set up Hammer event listeners
  var el = document.getElementById(props.id);
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

  var mc = new Hammer.Manager(el);

  mc.add(new Hammer.Pan({ threshold: 0, pointers: 0 }));
  mc.add(new Hammer.Rotate({ threshold: 0 })).recognizeWith(mc.get('pan'));
  mc.add(new Hammer.Pinch({ threshold: 0 })).recognizeWith([mc.get('pan'), mc.get('rotate')]);
  // mc.add(new Hammer.Tap({ event: 'doubletap', taps: 2 }));
  // mc.add(new Hammer.Tap());

  mc.on("panstart panmove", onPan);
  mc.on("rotatestart rotatemove", onRotate);
  mc.on("pinchstart pinchmove", onPinch);
  // mc.on("tap", onTap);
  // mc.on("doubletap", onDoubleTap);
  mc.on("hammer.input", function(ev) {
    if(ev.isFinal) {
      requestElementUpdate();
    }
  });

  /**
   * Paint the changes.
   */
  function requestElementUpdate(opts) {
    var emit = (opts === 'noEmit') ? 'noEmit' : null;

    if(!ticking) {
      reqAnimationFrame(updateElementTransform);
      ticking = true;

      // If needed, send position to everyone else.
      if (emit !== 'noEmit') {
        socket.emit('change', {
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

  /**
   * Socket: listen for this shape to change.
   */
  socket.on('change', function(props) {
    if (props.me !== socket.id && props.id === el.id) {
      transform = props.transform;

      requestElementUpdate('noEmit');
    }
  });

  /**
   * Hammer: listen for pan
   */
  function onPan(ev) {
    if (ev.type == 'panstart') {
      initX = transform.x || 0;
      initY = transform.y || 0;
    }

    transform.x = parseInt(initX, 10) + parseInt(ev.deltaX, 10);
    transform.y = parseInt(initY, 10) + parseInt(ev.deltaY, 10);

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
});
