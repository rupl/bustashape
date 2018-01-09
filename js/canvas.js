'use strict';

// Initialize the canvas instance of two.js
var canvas = $('#canvas');
var two = new Two({
  fullscreen: true,
  autostart: true,
}).appendTo(canvas);


// Allow tweening to run continuously.
two.bind('update', function twoUpdateListener() {
  TWEEN.update();
});


// For local development
if (busta.debug.enabled) {
  console.debug('💥 two.js initialized using ' + two.type + ' renderer.');
}


// Define some properties for the canvas.
busta.canvas = {
  ticking: false,
  initX: 0,
  initY: 0,
  x: 0,
  y: 0,
  initScale: 1,
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
  if (busta.debug.enabled) {
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
  if (busta.debug.enabled) {
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
          busta.canvas.x -= (e.shiftKey) ? 100 : 10;
          break;

        // Right arrow.
        case 39:
          busta.canvas.x += (e.shiftKey) ? 100 : 10;
          break;

        // Up arrow.
        case 38:
          busta.canvas.y -= (e.shiftKey) ? 100 : 10;
          break;

        // Down arrow.
        case 40:
          busta.canvas.y += (e.shiftKey) ? 100 : 10;
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
          busta.canvas.scale /= 1.08;
          break;
        case 95: // [Shift]
          busta.canvas.scale /= 2;
          break;

        // Zoom out
        case 61:
          busta.canvas.scale *= 1.08;
          break;
        case 43: // [Shift]
          busta.canvas.scale *= 2;
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
      busta.canvas.initScale = Math.n(busta.canvas.scale) || 1;
      busta.canvas.initX = Math.n(busta.canvas.x) || 0;
      busta.canvas.initY = Math.n(busta.canvas.y) || 0;
    }

    if (ev.type === 'pinchmove' && ev.target === svg) {
      busta.canvas.scale = busta.canvas.initScale * ev.scale;
      busta.canvas.center.x = ev.center.x;
      busta.canvas.center.y = ev.center.y;

      if (!busta.canvas.ticking) {
        requestAnimationFrame(redrawCanvasScale);
        busta.canvas.ticking = true;
      }
    }

    if (ev.type === 'panstart' && ev.target === svg) {
      // Get the starting position for this gesture
      busta.canvas.initX = Math.n(busta.canvas.x) || 0;
      busta.canvas.initY = Math.n(busta.canvas.y) || 0;
    }

    // We're already moving, use the values we stored during 'panstart'
    if (ev.type === 'panmove' && ev.target === svg) {
      busta.canvas.x = Math.n(busta.canvas.initX) + Math.n(ev.deltaX);
      busta.canvas.y = Math.n(busta.canvas.initY) + Math.n(ev.deltaY);

      if (!busta.canvas.ticking) {
        requestAnimationFrame(redrawCanvasPan);
        busta.canvas.ticking = true;
      }
    }
  }
}


//
// Redraw the entire scene using two.js
//
function redrawCanvasScale() {
  // First, limit scaling to our official ceiling.
  if (busta.canvas.scale > ZOOM_LIMIT) {
    busta.canvas.scale = ZOOM_LIMIT;
  }
  if (busta.canvas.scale < 1/ZOOM_LIMIT) {
    busta.canvas.scale = 1/ZOOM_LIMIT;
  }

  // Update canvas zoom. This will alter the X/Y coordinates by a bit.
  var matrix = zui.zoomSet(busta.canvas.scale, busta.canvas.center.x, busta.canvas.center.y);

  // Pull the new X/Y coordinates out of ZUI and keep our stuff in sync.
  var offset = matrix.updateOffset();
  busta.canvas.x = offset.surfaceMatrix.elements[2];
  busta.canvas.y = offset.surfaceMatrix.elements[5];

  // debug
  if (busta.debug.enabled) {
    busta.debug.canvas(busta.canvas);
  }

  // Release next frame.
  busta.canvas.ticking = false;
}

//
// Redraw the entire scene using two.js
//
function redrawCanvasPan() {
  // Update scene.
  zui.translateSurfaceTo(busta.canvas.x, busta.canvas.y);
  zui.updateSurface();

  // debug
  if (busta.debug.enabled) {
    busta.debug.canvas(busta.canvas);
  }

  // Redraw and release next frame.
  busta.canvas.ticking = false;
}
