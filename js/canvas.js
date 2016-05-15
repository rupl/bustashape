'use strict';

// Zoom limit of 1000 is due to internals of two.js — it rounds to three
// sig-figs when setting matrix transforms of Groups and Paths so if we
// exceed the resolution of the numbers, weird stuff happens.
var ZOOM_LIMIT = 1000;

// This is a global so that any piece of the app can be aware of the user's
// position in space.
var scene_transform = {
  ticking: false,
  initX: 0,
  initY: 0,
  initScale: 1,
  initCenter: {},
  x: 0,
  y: 0,
  scale: 1,
  center: {
    x: two.width / 2,
    y: two.height / 2
  },
  origin: {},
};

// Helps event listeners avoid trampling each other
var lastEventTime = 0;

// If touch events are detected, use a different UI.
if (Modernizr.touchevents) {
  if (debug_busta === true) {
    console.debug('👆 Touch events detected. Setting up mobile canvas...');
  }

  // Set up zoom/pan for the whole scene.
  var svg = $('#canvas svg');
  var scene = new Hammer.Manager(svg);
  scene.add(new Hammer.Pinch({ threshold: 0 }));
  scene.add(new Hammer.Pan({ threshold: 0, pointers: 0 })).recognizeWith([scene.get('pinch')]);
  scene.on("pinchstart pinchmove panstart panmove", changeCanvas);

  //
  // Event listener for changing position/zoom of canvas.
  //
  // There is one callback for all touch gestures in order to minimize
  // calculations needed to generate the proper response to a multi-touch
  // interaction involving both panning and zooming. The function first checks
  // for pinching and if the zoom needs to be adjusted, it automatically
  // incorporates panning to produce an intuitive zoom origin in the center of
  // the two fingers.
  //
  // If there's no pinch gesture occurring, it falls back to a simpler, faster
  // calculation that only pans the canvas instead of zooming it as well.
  //
  function changeCanvas(ev) {
    if (ev.target === svg) {
      // Negate default gestures (e.g. pinch-to-select tabs in iPad Safari)
      ev.preventDefault();

      // Hammer fires this function twice every time an event is generated
      // because we're using the "recognizeWith" option to collect both at once.
      //
      // However, if pinchmove already did its work, the panmove will destroy
      // the data that pinchmove generated and the zoom will look funky. So,
      // bail out of this listener if it was already handled by `pinchmove`
      if (lastEventTime === ev.timeStamp) {
        lastEventTime = ev.timeStamp;
        return;
      } else {
        lastEventTime = ev.timeStamp;
      }

      // Begin pinch gesture.
      if (ev.type === 'pinchstart') {
        scene_transform.initX = n(scene_transform.x);
        scene_transform.initY = n(scene_transform.y);
        scene_transform.initScale = n(scene_transform.scale);
        scene_transform.initCenter.x = n(scene_transform.center.x);
        scene_transform.initCenter.y = n(scene_transform.center.y);
        scene_transform.origin.x = scene_transform.initCenter.x;
        scene_transform.origin.y = scene_transform.initCenter.y;
        scene_transform.origin.steps = 1;
      }

      // Handle pinch gesture.
      if (ev.type === 'pinchmove' && ev.target === svg) {
        // First, capture the new scale. This is a basic operation that comes
        // directly from the event data.
        scene_transform.scale = scene_transform.initScale * ev.scale;

        // Limit scaling to avoid getting lost.
        if (scene_transform.scale < 1 / ZOOM_LIMIT) {
          scene_transform.scale = 1 / ZOOM_LIMIT;
        }
        if (scene_transform.scale > ZOOM_LIMIT) {
          scene_transform.scale = ZOOM_LIMIT;
        }

        // Calculate origin
        scene_transform.origin.x = ev.center.x;
        scene_transform.origin.y = ev.center.y;

        //
        // Formula for scaling at custom transform-origin:
        // matrix(sx, 0, 0, sy, cx-sx*cx, cy-sy*cy)
        //
        // To simulate proper zoom origin, we set the X and Y translation based on
        // the event center and amount of scaling done within the gesture so far.
        //
        // @see http://stackoverflow.com/a/6714140/175551
        scene_transform.x = (scene_transform.origin.x - scene_transform.scale * scene_transform.origin.x);
        scene_transform.y = (scene_transform.origin.y - scene_transform.scale * scene_transform.origin.y);

        // Store for later
        scene_transform.center.x = ev.center.x;
        scene_transform.center.y = ev.center.y;
      }

      // Begin pan gesture.
      if (ev.type === 'panstart' && ev.target === svg) {
        // Get the starting position for this gesture
        scene_transform.initX = n(scene_transform.x);
        scene_transform.initY = n(scene_transform.y);
        scene_transform.origin.steps = 1;
      }

      // Handle pan gesture.
      if (ev.type === 'panmove' && ev.target === svg) {
        scene_transform.x = n(scene_transform.initX) + n(ev.deltaX);
        scene_transform.y = n(scene_transform.initY) + n(ev.deltaY);
      }

      // Re-draw canvas.
      if (!scene_transform.ticking) {
        requestAnimationFrame(redrawCanvas);
        scene_transform.ticking = true;
      }
    }
  }
}

// Touch events are not detected.
else {
  // @TODO: add key-based panning/zooming
}

//
// Redraw the entire scene using two.js
//
function redrawCanvas() {
  // Update scene.
  two.scene.translation.set(scene_transform.x, scene_transform.y);
  two.scene.scale = scene_transform.scale;
  two.update();

  // debug
  if (debug_busta === true) {
    debugCanvas(scene_transform);
  }

  // Redraw and release next frame.
  scene_transform.ticking = false;
}
