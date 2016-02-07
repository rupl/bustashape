'use strict';

// If touch events are detected, use a different UI.
if (Modernizr.touchevents) {
  if (debug_busta === true) {
    console.debug('👆 Touch events detected. Setting up mobile canvas...');
  }

  var scene_transform = {
    ticking: false,
    initX: 0,
    initY: 0,
    initScale: 1,
    x: 0,
    y: 0,
    scale: 1
  };

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
    if (ev.type === 'pinchstart' && ev.target === svg) {
      scene_transform.initScale = n(scene_transform.scale) || 1;
      scene_transform.initX = n(scene_transform.x) || 0;
      scene_transform.initY = n(scene_transform.y) || 0;

      // If the pinchstart was detected, we've done all the work that is needed
      // for this cycle. Do not proceed to capture pan gestures.
      // return;
    }

    if (ev.type === 'pinchmove' && ev.target === svg) {
      // @TODO: assign the scene once when it is created and remove this
      // expensive lookup completely out of the callback.
      var el = $('#' + two.scene.id);

      // @TODO: find out what getBoundingClientRect is when I have internet
      // again. Hopefully it's cross-browser? Chrome/Safari/FF have it.
      var boundry = el.getBoundingClientRect();

      if (debug_busta === true) {
        // console.debug(ev);
        // console.debug(el.getBoundingClientRect());
      }

      // First, capture the new scale. This is a basic operation that comes
      // directly from the event data.
      scene_transform.scale = scene_transform.initScale * ev.scale;

      // Next, calculate the origin for this scale transform. We can't just move
      // the transform-origin of the canvas so we calculate a new position based
      // on the `center` of the pinch gesture versus the size and position of
      // the canvas.
      scene_transform.x = scene_transform.x - ((boundry.width / 2 - ev.center.x) * ev.scale);
      scene_transform.y = scene_transform.y - ((boundry.height / 2 - ev.center.y) * ev.scale);

      if (!scene_transform.ticking) {
        requestAnimationFrame(redrawCanvas);
        scene_transform.ticking = true;
      }

      // If the pinchmove was detected, we've done all the work that is needed
      // for this cycle. Do not proceed to capture pan gestures.
      // return;
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
        requestAnimationFrame(redrawCanvas);
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
function redrawCanvas() {
  // Update canvas zoom & position.
  two.scene.translation.set(scene_transform.x, scene_transform.y);
  two.scene.scale = scene_transform.scale;

  if (debug_busta === true) {
    debugCanvas(scene_transform);
  }

  // Redraw and release next frame.
  two.update();
  scene_transform.ticking = false;
}
