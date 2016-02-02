'use strict';

// If touch events are detected, use a different UI.
if (Modernizr.touchevents) {
  console.debug('👆 Touch events detected. Setting up mobile canvas...');

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
  var svg = $('#canvas svg');
  var scene = new Hammer.Manager(svg);
  scene.add(new Hammer.Pan({ threshold: 0, pointers: 0 }));
  scene.add(new Hammer.Pinch({ threshold: 0 })).recognizeWith([scene.get('pan')]);
  scene.on("panstart panmove", onScenePan);
  scene.on("pinchstart pinchmove", onScenePinch);

  /*
   * Callback for changing position of canvas.
   */
  function onScenePan(ev) {
    console.debug(ev);
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

  /*
   * Callback for changing zoom level of canvas.
   */
  function onScenePinch(ev) {
    console.debug(ev);
    if (ev.type === 'pinchstart' && ev.target === svg) {
      initScale = scene_transform.scale || 1;
    }

    if (ev.type === 'pinchmove' && ev.target === svg) {
      scene_transform.scale = initScale * ev.scale;

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

  // Redraw and release next frame.
  two.update();
  scene_transform.ticking = false;
}
