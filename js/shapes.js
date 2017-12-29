/* eslint no-unused-vars: 1 */

busta.shape = {
  //
  // Request a new shape on the server.
  //
  // This event calculates some data about the new shape and sends an event to
  // the server, which triggers a new shape on all clients including the person
  // who created the shape. See the 'add' method for the client-side event
  // listener that handles the socket event.
  //
  create: function(ev) {
    // Stop default behavior.
    ev.preventDefault();
    ev.srcEvent.stopPropagation();

    // Store original touch target.
    var target = ev.target;

    // Walk upwards through the DOM until we find the preset wrapper.
    //
    // We listen for touch events on the wrappers in addition to the proto shapes
    // themselves to account for fat-finger taps. This while loop ensures that the
    // rest of this function is always "starting" from the container, regardless
    // of whether the container or the proto shape itself was tapped.
    while (!target.classList.contains('preset')) {
      target = target.parentNode;
    }

    // Proto shape is the only direct child of preset container.
    var preset = target.childNodes[0];

    // New shape position
    //
    // Shapes get lost when the user doesn't see them immediately. New shapes
    // should appear in the center of the user's viewport so it's noticeable when
    // it appears. The numbers generated here are relative to scene_transform, so
    // they will appear in the same place on the canvas on all other screens, even
    // if it's not the center of the other person's screen.
    var REL_SCALE = 1 / scene_transform.scale;
    var REL_X = Math.floor((-scene_transform.x + (two.width / 2)) / scene_transform.scale);
    var REL_Y = Math.floor((-scene_transform.y + (two.height / 2)) / scene_transform.scale);

    // Set button to active so it's obvious that it was pressed. The incoming
    // socket event will unset this class.
    preset.classList.add('active');

    // Send to ALL clients including self. It doesn't immediately add a shape to
    // the DOM, the 'add' socket listener does it after a round trip to server.
    client.socket.emit('add', {
      room: client.room,
      id: 'shape-' + Math.floor(Math.random() * 1000000000),
      class: preset.dataset.shape,
      opacity: preset.dataset.opacity,
      color: preset.dataset.color,
      borderColor: preset.dataset.color,
      mixBlendMode: preset.dataset.mixBlendMode,
      x: REL_X,
      y: REL_Y,
      scale: REL_SCALE,
      angle: 0,
    });

    // Log to GA
    ga('send', 'event', 'Shapes', 'create', client.room);
  },


  //
  // Add a shape to the canvas.
  //
  // This is the client-side event listener which draws new shapes when it hears
  // events from the server. This function draws new shapes even when your client
  // triggered the 'create' event originally.
  //
  add: function(ev) {
    // Read shape data from event
    var props = ev.props;

    // Define some constants for two.js shapes
    var START_WIDTH = 200;
    var START_HEIGHT = 200;

    // Just bail if a shape with this ID already exists. It would be much better
    // to not duplicate calls, but this at least avoids over-populating the DOM.
    if ($('#' + props.id)) return;

    var START_X = Math.n(props.x);
    var START_Y = Math.n(props.y);
    var shape;

    // Create new shape
    if (props.class === 'circle') {
      shape = two.makeCircle(START_X, START_Y, START_WIDTH / 2);
    } else if (props.class === 'rectangle') {
      shape = two.makeRectangle(START_X, START_Y, START_WIDTH * 2, START_HEIGHT);
    } else if (props.class === 'triangle') {
      shape = two.makePolygon(START_X, START_Y, START_WIDTH / 1.5, 3);
    } else {
      shape = two.makeRectangle(START_X, START_Y, START_WIDTH, START_HEIGHT);
    }

    // Fill out common props
    shape.id = props.id;
    shape.fill = props.color;
    shape.opacity = props.opacity;
    shape.rotation = Math.radians(props.angle);
    shape.noStroke();

    // Set pre-popping size. This will be animated to the "default" settings.
    shape.scale = props.scale / 4;

    // Popping animation
    // @see https://jsfiddle.net/jonobr1/72bytkhm/
    new TWEEN.Tween(shape)
      .to({
        scale: props.scale,
      }, 400)
      .easing(TWEEN.Easing.Elastic.Out)
      .start();

    // Draw shape for first time at scale(0) so we can run the popping animation
    // and apply the advanced CSS props (e.g. blend mode).
    two.update();

    if (busta.debug.enabled) {
      busta.debug.shape(shape);
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
    var initScale;
    var initAngle;
    var ticking = false;
    var transform = {
      x: props.x,
      y: props.y,
      angle: props.angle,
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

    /**
     * Hammer: listen for pan
     */
    function onPan(ev) {
      ev.preventDefault();

      if (ev.type === 'panstart') {
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
        transform.x = Math.n(initX) + (Math.n(ev.deltaX) / two.scene.scale);
        transform.y = Math.n(initY) + (Math.n(ev.deltaY) / two.scene.scale);
      }

      requestElementUpdate();
    }

    /**
     * Hammer: listen for pinch
     */
    function onPinch(ev) {
      ev.preventDefault();

      if (ev.type === 'pinchstart') {
        initScale = transform.scale;

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
        initAngle = transform.angle;

        // Change cursor on screens that have one.
        el.classList.add('grabbing');
      }

      transform.angle = Math.n(initAngle) + Math.n(ev.rotation);

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

    /*
     * Hammer: Final
     *
     * Clean up all gestures by doing a final render/broadcast.
     */
    mc.on("hammer.input", function(ev) {
      if(ev.isFinal) {
        requestElementUpdate();
        el.classList.remove('grabbing');
      }
    });

    //----------------------------------------------------------------------------
    // Rendering functions
    //----------------------------------------------------------------------------

    /**
     * Ask for a render and broadcast the shape's current properties.
     */
    function requestElementUpdate(broadcast) {
      if (!ticking) {
        requestAnimationFrame(redrawElement);
        ticking = true;

        if (broadcast !== false) {
          client.socket.emit('change', {
            room: client.room,
            id: props.id,
            transform: transform,
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

      if (busta.debug.enabled) {
        busta.debug.shape(shape);
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
        // Transform and animate the shape.
        transform = props.transform;
        requestElementUpdate(false);
      }
    });
  },
};


//
// Event listeners
//
document.on('add', busta.shape.add, true);
