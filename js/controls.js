//
// User Interface
//

// The height of the drawer when closed. Defined in CSS.
var CONTROLS_HEIGHT = 64;

// The velocity a gesture must be. Higher threshold means fewer gestures will be
// considered swipes.
var SWIPE_THRESHOLD = 0.666;

// The controls themselves.
var controls = $('#form-controls');

// The datastore for gestures involving the controls. We store animation data
// in here instead of directly touching the controls for better performance.
var controls_transform = {
  ticking: false,
  height: controls.getClientRects()[0].height - CONTROLS_HEIGHT,
  init: {y: 0},
  y: 0
};

//
// Initialize preset buttons
//
// Each shape is an add button of its own, with data-attrs controlling
// the properties of the new shape. The properties of a preset can be changed
// by dragging the drawer open and manipulating the form elements that are
// exposed. All changes are instant and tapping the shape again will create a
// shape with the new properties.
//
// TODO: create a dummy event listener for the drawer itself which prevents
//       default and avoids triggering any OS gestures (like pull to refresh),
//       avoiding unintentional triggering if the person misses any of the
//       targets in the drawer.
//
// TODO: Perhaps make an invisible element which takes up about 15-20px of
//       space directly above the drawer, so that sloppy grabs still open or
//       close the drawer.
//
$$('.preset').forEach(function (el) {
  var mc = new Hammer.Manager(el);

  mc.add(new Hammer.Pan({ threshold: 0, pointers: 0 }));
  mc.add(new Hammer.Tap());
  mc.on("panstart panmove panend", dragControls);
  mc.on("tap", createShape);
});

//
// Callback for controls gestures.
//
function dragControls(ev) {
  ev.preventDefault();
  var direction = 'up';

  // Grab initial position so we know where to move.
  if (ev.type === 'panstart') {
    // Get the starting position for this gesture
    controls_transform.init.y = controls_transform.y;
  }

  // We're already moving, update form controls.
  if (ev.type === 'panmove') {
    // Store the raw delta.
    controls_transform.y = n(controls_transform.init.y) + n(ev.deltaY);

    // Don't let controls drop below screen. This is done by ensuring that our
    // translateY is always a NEGATIVE number. Negative means UP in CSS transform.
    if (controls_transform.y > 0) {
      controls_transform.y = 0;
    }

    // Don't open too far, always stop at the height of the controls.
    if (controls_transform.y < -controls_transform.height) {
      controls_transform.y = -controls_transform.height;
    }

    // Redraw.
    if (!ev.isFinal && !controls_transform.ticking) {
      redrawControls();
      controls_transform.ticking = true;
    }
  }

  // Determine how to transition the drawer open or closed based on the final
  // velocity or position of the gesture.
  if (ev.type === 'panend') {

    // First check event velocity/direction to see if it was a swiping motion.
    // When a swipe is detected, follow the swipe regardless of current position.
    if (Math.abs(ev.velocityY) > SWIPE_THRESHOLD) {
      direction = ev.velocityY > 0 ? 'up' : 'down';

      // Set animation.
      controls.classList.add(direction + '-fast');

      // Set a timer to remove animation class.
      setTimeout(function () {
        // Set transform to its end position.
        var temp_transform = direction == 'down' ? 0 : -236;
        controls_transform.y = temp_transform;
        redrawControls();

        // remove class that was just set after it runs.
        controls.classList.remove(direction + '-fast');
      }, 300);

      // we're done here.
      return;
    }

    // Velocity was not sufficient to consider the gesture a swipe. Instead of
    // tracking the gesture, we need to calculate whether the drawer is more
    // open or closed, then transition to that state. The logic is more or less
    // the same as velocity.
    direction = Math.abs(controls_transform.y) > 118 ? 'up' : 'down';

    // Set animation.
    controls.classList.add(direction + '-slow');

    // Set a timer to remove animation class.
    setTimeout(function () {
      // Set transform to its end position.
      var temp_transform = direction == 'down' ? 0 : -236;
      controls_transform.y = temp_transform;
      redrawControls();

      // remove class that was just set after it runs.
      controls.classList.remove(direction + '-slow');
    }, 800);

    // we're done here.
    return;
  }
}

// Helper function to manage controls state and animation.
function redrawControls () {
  reqAnimationFrame(function () {
    var final_value = 'translateY(' + controls_transform.y + 'px)';

    // Set position.
    controls.style.webkitTransform = final_value;
    controls.style.transform = final_value;

    // release frame
    controls_transform.ticking = false;
  });
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

