var client = new client();
var me = {};
var logged_in = false;

// Initialize two.js
var canvas = $('#canvas');
var two = new Two({
  fullscreen: true,
  autostart: true
}).appendTo(canvas);

// Allow tweening to run continuously.
two.bind('update', function twoUpdateListener() {
  TWEEN.update();
});

// debug
if (debug_busta === true) {
  console.debug('💥 two.js initialized using ' + two.type + ' renderer.')
}

// Define some constants for two.js
var START_WIDTH = 200;
var START_HEIGHT = 200;
var START_ANGLE = 0;


/**
 * Listen for new shapes and add them to DOM.
 */
client.socket.on('add', function(props) {
  // Close all form controls that might be open.
  unFocus();

  var START_X = n(props.x);
  var START_Y = n(props.y);

  // Create new shape
  if (props.class === 'circle') {
    var shape = two.makeCircle(START_X, START_Y, START_WIDTH / 2);
  } else if (props.class === 'rectangle') {
    var shape = two.makeRectangle(START_X, START_Y, START_WIDTH * 2, START_HEIGHT);
  } else if (props.class === 'triangle') {
    var shape = two.makePolygon(START_X, START_Y, START_WIDTH / 1.5, 3);
  } else {
    var shape = two.makeRectangle(START_X, START_Y, START_WIDTH, START_HEIGHT);
  }

  // Fill out common props.
  shape.id = props.id;
  shape.fill = props.color;
  shape.opacity = props.opacity;
  shape.noStroke();

  // Set pre-popping size. This will be animated to the "default" settings.
  shape.scale = props.scale / 4;

  // Popping animation
  // @see https://jsfiddle.net/jonobr1/72bytkhm/
  var pop = new TWEEN.Tween(shape)
    .to({
      scale: props.scale
    }, 400)
    .easing(TWEEN.Easing.Elastic.Out)
    .start();

  // Draw shape for first time at scale(0) so we can run the popping animation
  // and apply the advanced CSS props (e.g. blend mode).
  two.update();

  if (debug_busta === true) {
    debugShape(shape);
  }

  // Reference DOM element to allow direct manipulation for a few things.
  var el = shape._renderer.elem;
  el.style.mixBlendMode = props.mixBlendMode;
  el.classList.add('shape');
  el.classList.add('shape--' + props.class);

  // Set up Hammer. Also uses direct DOM node.
  var mc = new Hammer.Manager(el);
  var initX;
  var initY;
  var timer;
  var ticking = false;
  var transform = {
    x: props.x,
    y: props.y,
    angle: START_ANGLE,
    scale: props.scale,
  };


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
      el.classList.remove('grabbing');
    }
  });


  /**
   * Hammer: listen for pan
   */
  function onPan(ev) {
    ev.preventDefault();

    if (ev.type === 'panstart') {
      // The first time any shape moves, it needs this class removed.
      el.classList.remove('unchanged');
      // Change cursor on screens that have one.
      el.classList.add('grabbing');

      // Get the starting position for this gesture
      initX = transform.x;
      initY = transform.y;
    }

    // We're already moving, use the values we stored during 'panstart'
    //
    // We have to factor in the zoom level of the canvas in this delta as well.
    // If we didn't, the shape would not follow the movement of a person's
    // finger in a natural way.
    if (ev.type === 'panmove') {
      transform.x = n(initX) + (n(ev.deltaX) / two.scene.scale);
      transform.y = n(initY) + (n(ev.deltaY) / two.scene.scale);
    }

    requestElementUpdate();
  }

  /**
   * Hammer: listen for pinch
   */
  function onPinch(ev) {
    ev.preventDefault();

    if (ev.type === 'pinchstart') {
      initScale = transform.scale || 1;

      // Change cursor on screens that have one.
      el.classList.add('grabbing');
    }

    if (ev.type === 'pinchmove') {
      // Store new size based on initial scale times the delta
      transform.scale = initScale * ev.scale;
    }

    requestElementUpdate();
  }

  /**
   * Hammer: listen for rotate
   */
  function onRotate(ev) {
    ev.preventDefault();

    if (ev.type === 'rotatestart') {
      initAngle = transform.angle || START_ANGLE;

      // Change cursor on screens that have one.
      el.classList.add('grabbing');
    }

    transform.angle = n(initAngle) + n(ev.rotation);

    requestElementUpdate();
  }

  /**
   * Hammer: listen for tap
   */
  // function onTap(ev) {
  //   requestElementUpdate();
  // }

  /**
   * Hammer: listen for double tap
   */
  // function onDoubleTap(ev) {
  //   requestElementUpdate();
  // }

  //----------------------------------------------------------------------------
  // Rendering functions
  //----------------------------------------------------------------------------

  /**
   * Ask for a render and broadcast the shape's current properties.
   */
  function requestElementUpdate(broadcast) {
    if (!ticking) {
      reqAnimationFrame(redrawElement);
      ticking = true;

      if (broadcast !== false) {
        client.socket.emit('change', {
          id: props.id,
          transform: transform
        });
      }
    }
  }

  /**
   * Talks to two.js and redraws elements.
   */
  function redrawElement() {
    // Tell two.js to update shape
    shape.translation.set(transform.x, transform.y);
    shape.scale = transform.scale;
    shape.rotation = Math.radians(transform.angle);

    if (debug_busta === true) {
      debugShape(shape);
    }

    // Redraw
    two.update();
    ticking = false;
  }

  //----------------------------------------------------------------------------
  // Socket listeners
  //----------------------------------------------------------------------------

  /**
   * Listen for this shape to change.
   */
  client.socket.on('change', function(props) {
    if (props.id === el.id) {
      // In case this is the first time the shape has moved, remove this class.
      el.classList.remove('unchanged');

      // Transform and animate the shape.
      transform = props.transform;
      requestElementUpdate(false);
    }
  });
});
