'use strict';

// This is a global so that any piece of the app can be aware of the user's
// position in space.
var scene_transform = {
  ticking: false,
  initX: 0,
  initY: 0,
  initScale: 1,
  x: 0,
  y: 0,
  scale: 1,
  center: {
    x: two.width / 2,
    y: two.height / 2,
  },
  origin: {},
};

// Zoom limit is due to internals of two.js — it rounds to three
// sig-figs when setting matrix transforms of Groups and Paths so if we
// exceed the resolution of the numbers, weird stuff happens.
var ZOOM_LIMIT = 500;

// Setup zooming/panning mechanism.
var zui = new ZUI(two);
zui.addLimits(1 / ZOOM_LIMIT, ZOOM_LIMIT);

//
// Touch UI
//
if (Modernizr.touchevents) {
  if (debug_busta !== 'undefined') {
    console.debug('👆 Touch events detected. Setting up mobile canvas...');
  }

  // Set up zoom/pan for the whole scene.
  var svg = $('#canvas svg');
  var scene = new Hammer.Manager(svg);
  scene.add(new Hammer.Pinch({ threshold: 0 }));
  scene.add(new Hammer.Pan({ threshold: 0, pointers: 0 })).recognizeWith([scene.get('pinch')]);
  scene.on("pinchstart pinchmove panstart panmove", changeCanvas);
}

//
// Non-touch UI.
//
// Touch events are not detected. Set up some keyCode listeners to make it nicer
// for projection and other public displays.
//
else {
  if (debug_busta !== 'undefined') {
    console.debug('💻 No touch events detected. Setting up projection mode.');
  }

  // We have to set up two event listeners because the `-` and `=` keys report
  // different values across different browsers inside the `keypress` event, and
  // additionally, Chrome doesn't fire the listeners for arrow keys on `keydown`
  // event listeners.

  // Pan handler. heh.
  document.addEventListener('keydown', function handleProjectorPan(e) {
    var key = e.which || e.keyCode;

    if (me.logged_in) {
      switch (key) {

        // Left arrow.
        case 37:
          scene_transform.x -= (e.shiftKey) ? 100 : 10;
          break;

        // Right arrow.
        case 39:
          scene_transform.x += (e.shiftKey) ? 100 : 10;
          break;

        // Up arrow.
        case 38:
          scene_transform.y -= (e.shiftKey) ? 100 : 10;
          break;

        // Down arrow.
        case 40:
          scene_transform.y += (e.shiftKey) ? 100 : 10;
          break;
      }

      // Update screen.
      redrawCanvasPan();
    }
  });

  // Zoom handler.
  document.addEventListener('keypress', function handleProjectorZoom(e) {
    var key = e.which || e.keyCode;

    if (me.logged_in) {
      switch (key) {

        // Zoom in
        case 45:
          scene_transform.scale /= 1.08;
          break;
        case 95: // [Shift]
          scene_transform.scale /= 2;
          break;

        // Zoom out
        case 61:
          scene_transform.scale *= 1.08;
          break;
        case 43: // [Shift]
          scene_transform.scale *= 2;
          break;
      }

      // Update screen.
      redrawCanvasScale();
    }
  });
}


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

    if (ev.type === 'pinchstart' && ev.target === svg) {
      scene_transform.initScale = n(scene_transform.scale) || 1;
      scene_transform.initX = n(scene_transform.x) || 0;
      scene_transform.initY = n(scene_transform.y) || 0;
    }

    if (ev.type === 'pinchmove' && ev.target === svg) {
      scene_transform.scale = scene_transform.initScale * ev.scale;
      scene_transform.center.x = ev.center.x;
      scene_transform.center.y = ev.center.y;

      if (!scene_transform.ticking) {
        requestAnimationFrame(redrawCanvasScale);
        scene_transform.ticking = true;
      }
    }

    if (ev.type === 'panstart' && ev.target === svg) {
      // Get the starting position for this gesture
      scene_transform.initX = n(scene_transform.x) || 0;
      scene_transform.initY = n(scene_transform.y) || 0;
    }

    // We're already moving, use the values we stored during 'panstart'
    if (ev.type === 'panmove' && ev.target === svg) {
      scene_transform.x = n(scene_transform.initX) + n(ev.deltaX);
      scene_transform.y = n(scene_transform.initY) + n(ev.deltaY);

      if (!scene_transform.ticking) {
        requestAnimationFrame(redrawCanvasPan);
        scene_transform.ticking = true;
      }
    }
  }
}


//
// Redraw the entire scene using two.js
//
function redrawCanvasScale() {
  // First, limit scaling to our official ceiling.
  if (scene_transform.scale > ZOOM_LIMIT) {
    scene_transform.scale = ZOOM_LIMIT;
  }
  if (scene_transform.scale < 1/ZOOM_LIMIT) {
    scene_transform.scale = 1/ZOOM_LIMIT;
  }

  // Update canvas zoom. This will alter the X/Y coordinates by a bit.
  var matrix = zui.zoomSet(scene_transform.scale, scene_transform.center.x, scene_transform.center.y);

  // Pull the new X/Y coordinates out of ZUI and keep our stuff in sync.
  var offset = matrix.updateOffset();
  scene_transform.x = offset.surfaceMatrix.elements[2];
  scene_transform.y = offset.surfaceMatrix.elements[5];

  // debug
  if (debug_busta !== 'undefined') {
    window.debugCanvas(scene_transform);
  }

  // Redraw and release next frame.
  scene_transform.ticking = false;
}

//
// Redraw the entire scene using two.js
//
function redrawCanvasPan() {
  // Update scene.
  zui.translateSurfaceTo(scene_transform.x, scene_transform.y);
  zui.updateSurface();

  // debug
  if (debug_busta !== 'undefined') {
    window.debugCanvas(scene_transform);
  }

  // Redraw and release next frame.
  scene_transform.ticking = false;
}
