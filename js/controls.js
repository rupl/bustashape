//
// User Interface
//

// The value in pixels before the controls will visually respond to a drag.
var CONTROLS_STICKINESS = 9;

// The controls themselves.
var controls = $('#form-controls');

// The datastore for gestures involving the controls. We store animation data
// in here instead of directly touching the controls for better performance.
var controls_transform = {
  ticking: false,
  height: controls.getClientRects()[0].height,
  init: {y: 0},
  y: 0
};

// Initialize preset buttons
//
// Each shape is an add button of its own, with data-attrs controlling
// the properties of the new shape. The properties of a preset can be changed
// by dragging the drawer open and manipulating the form elements that are
// exposed. All changes are instant and tapping the shape again will create a
// shape with the new properties.
$$('.proto').forEach(function (el) {
  // Set up Hammer for controls.
  var mc = new Hammer.Manager(el);

  mc.add(new Hammer.Pan({ threshold: 0, pointers: 0 }));
  mc.add(new Hammer.Tap());
  mc.on("panstart panmove", dragControls);
  mc.on("tap", createShape);
});

//
// Callback for controls gestures.
//
function dragControls(ev) {
  ev.preventDefault();

  if (ev.type === 'panstart') {
    // Get the starting position for this gesture
    controls_transform.init.y = controls_transform.y;
  }

  // We're already moving, update form controls.
  if (ev.type === 'panmove') {
    controls_transform.y = n(controls_transform.init.y) + n(ev.deltaY);

    // Don't let controls drop below screen. This is done by ensuring that our
    // translateY is always a NEGATIVE number. Negative means UP in CSS transform.
    if (controls_transform.y > 0) {
      controls_transform.y = 0;
    }

    // Make the controls "sticky" — the first 5 pixels of movement should not
    // be displayed. This will avoid UI responses to very small or accidental
    // drag movements.
    if (controls_transform.y > CONTROLS_STICKINESS) {
      controls_transform.y = 0;
    }

    // Don't open too far, always stop at the height of the controls.
    if (controls_transform.y < -controls_transform.height) {
      controls_transform.y = -controls_transform.height;
    }

    if (ev.isFinal) {
      // Instead of tracking the gesture, we need to calculate whether the
      // drawer is more open or closed, then transition to that state.
      //
      // Detection
      // * First check ev.direction to see which way was being swiped.
      // * If that is somehow inconclusive, check actual position.
      //
      // Reaction
      // * Add two CSS animations each behind a class.
      // * Append class to the controls.
    }

    // Redraw.
    if (!ev.isFinal && !controls_transform.ticking) {
      reqAnimationFrame(function () {
        var final_value = 'translateY(' + controls_transform.y + 'px)';

        controls.style.webkitTransform = final_value;
        controls.style.transform = final_value;

        // console.debug('xf', controls_transform);
        controls_transform.ticking = false;
      });
      controls_transform.ticking = true;
    }
  }
}

// If save button is possible, create it now.
//
// @TODO: During room creation, create config to either show or hide button
//        instead of always hiding when touch events are detected.
if (Modernizr.atobbtoa && Modernizr.adownload && !Modernizr.touchevents) {
  // Create save button.
  var save_button = document.createElement('a');
  save_button.setAttribute('id', 'save');
  save_button.setAttribute('aria-role', 'button');
  save_button.innerHTML = '💾';

  // Add button to control panel.
  controls.appendChild(save_button);

  // Set up event listener.
  //
  // Saving the SVG can be invoked any number of times during a session.
  // The downloads are timestamped to make for easy oranization of files.
  save_button.on('click', saveCanvas);

  // Listen for `s` key
  window.onload = function(){
    document.onkeypress = function(e) {
      var key = e.keyCode || e.which;
      if (!!window.logged_in && key === 115) {
        saveCanvas();
        $('#save').click();
        return;
      }
    };
  };
}

// Take contents of canvas and encode them into save button so they can be
// downloaded. The click or keypress event handles the button triggering.
function saveCanvas() {
  // Generate SVG
  var save_button = $('#save');
  var save_svg = $('#canvas').innerHTML.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  var data_uri = 'data:image/svg+xml;base64,' + window.btoa(save_svg);
  var filename = 'bustashape-' + window.location.hash.replace('#', '') + '-' + Date.now() + '.svg';

  // Download SVG
  save_button.setAttribute('href', data_uri);
  save_button.setAttribute('download', filename);
}
