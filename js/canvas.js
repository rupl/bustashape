'use strict';

var ZOOM_LIMIT = 1000;
var scene_transform = {
  ticking: false,
  initX: 0,
  initY: 0,
  initScale: 1,
  initCenter: {},
  x: 0,
  y: 0,
  scale: 1,
  center: {}
};

// If touch events are detected, use a different UI.
if (Modernizr.touchevents) {
  if (debug_busta === true) {
    console.debug('👆 Touch events detected. Setting up mobile canvas...');
  }

  // Set the Scene to use a manual matrix transformation so the canvas can be
  // controlled directly by hammer.js input data.
  // two.scene._matrix.manual = true;

  // Set up zoom/pan for the whole scene.
  //
  // @TODO: lookup the DOM element for the scene once and only once, but it has
  // to be after it was created due to the first shape appearing. Currently the
  // lookup is done every time a touch gesture is handled, an expensive and
  // repetitive process. (Maybe force its creation before a user hits the
  // 'create shape' button?)
  var svg = $('#canvas svg');
  var scene = new Hammer.Manager(svg);
  scene.add(new Hammer.Pan({ threshold: 0, pointers: 0 }));
  scene.add(new Hammer.Pinch({ threshold: 0 })).recognizeWith([scene.get('pan')]);
  scene.on("panstart panmove pinchstart pinchmove", changeCanvas);

  //
  // Callback for changing position/zoom of canvas.
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
    // Negate default gestures (e.g. pinch-to-select tabs in iPad Safari)
    ev.preventDefault();

    if (ev.type === 'pinchstart' && ev.target === svg) {
      scene_transform.initScale = n(scene_transform.scale) || 1;
      scene_transform.initCenter.x = n(scene_transform.center.x) || ev.center.x;
      scene_transform.initCenter.y = n(scene_transform.center.y) || ev.center.y;
      // scene_transform.initX = n(scene_transform.x) || 0;
      // scene_transform.initY = n(scene_transform.y) || 0;
    }

    if (ev.type === 'pinchmove' && ev.target === svg) {
      // debug
      if (debug_busta === true) {
        // console.debug('ev', ev);
        // console.debug('ev', ev.center.x, ev.center.y);
        // console.debug('scene', scene_transform.center.x, scene_transform.center.y);
        // console.debug('newScale', scene_transform.scale);
      }

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

      // Next, calculate the origin for this scale transform.
      scene_transform.center.x = /*scene_transform.initCenter.x -*/ ev.center.x;
      scene_transform.center.y = /*scene_transform.initCenter.y -*/ ev.center.y;

      if (!scene_transform.ticking) {
        requestAnimationFrame(redrawCanvasScale);
        scene_transform.ticking = true;
      }
    }

    //
    // If no pinch gestures were detected, move on to the pan gestures.
    //

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

// Touch events are not detected.
else {

}

/*
 * rAF callback which redraws the entire scene. Primarily for zoom/pan.
 */
function redrawCanvasScale() {
  //
  // formula for scaling at custom transform-origin:
  // matrix(sx, 0, 0, sy, cx-sx*cx, cy-sy*cy)
  //
  // @see http://stackoverflow.com/a/6714140/175551
  //
  // @TODO: this still needs to be modified to factor in where the <g> was when
  // the pinch started. currently when we use the raw pinch center, the scene
  // jumps to the center then the scaling happens intuitively for the duration
  // of the gesture, but each new gesture causes a jump since it has a new center.
  //
  // We basically just need an `initCenter` similar to all the other variables
  // so store the delta for the duration of each gesture, then update the final
  // value with the new "initial" value.
  //
  // Finally, this direct DOM manipulation has to go. The code as it stands is
  // only working by side-stepping two.js, which means single-finger panning is
  // broken until two.update() is uncommented once again. I have also commented
  // out the setters for two.scene to make it clear that they temporarily have
  // no effect on the UI.
  //
  // To remove my workaround, I need to dig deeper into Two.Vector and learn how
  // to either directly alter the `two.scene._matrix` object, or learn how to
  // feed the numbers into the Vector properly.
  //
  // As a last resort, I could add a flag to this function which either uses the
  // simple translation setter for panning, but does custom matrix transforms
  // for pinching then updates the `two.scene` object at the end.
  //
  var matrix = [
    scene_transform.scale,
    0,
    0,
    scene_transform.scale,
    (scene_transform.center.x - scene_transform.scale * scene_transform.center.x),
    (scene_transform.center.y - scene_transform.scale * scene_transform.center.y)
  ];

  // Update canvas zoom & position using two.js
  // two.scene._matrix
  //   .translate(scene_transform.x, scene_transform.y)
  //   .scale(scene_transform.scale, scene_transform.scale);

  // direct DOM-manip
  var sceneEl = two.scene._renderer.elem;
  sceneEl.setAttribute('transform', 'matrix('+ matrix.join(' ') + ')');

  if (debug_busta === true) {
    debugCanvas(scene_transform);
  }

  // Redraw and release next frame.
  two.update();
  scene_transform.ticking = false;
}

function redrawCanvasPan() {
  // Simple setter: update canvas zoom & position.
  two.scene.translation.set(scene_transform.x, scene_transform.y);
  two.scene.scale = scene_transform.scale;

  if (debug_busta === true) {
    debugCanvas(scene_transform);
  }

  // Redraw and release next frame.
  two.update();
  scene_transform.ticking = false;
}
