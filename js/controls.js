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
  y: 0,
};

// Lookup the animationend event for this browser.
var animationEvent = whichAnimationEvent();

//
// Initialize preset buttons
//
// Each shape is an add button of its own, with data-attrs controlling
// the properties of the new shape. The properties of a preset can be changed
// by dragging the drawer open and manipulating the form elements that are
// exposed. All changes are instant and tapping the shape again will create a
// shape with the new properties.
//
// TODO: Perhaps make an invisible element which takes up about 15-20px of
//       space directly above the drawer, so that sloppy grabs still open or
//       close the drawer.
//
$$('#form-controls').forEach(function (el) {
  var mc = new Hammer.Manager(el);
  mc.options.domEvents = true;

  mc.add(new Hammer.Pan({ threshold: 0, pointers: 0 }));
  mc.on("panstart panmove panend", dragControls);

  // Don't ever submit the form. Ever.
  el.addEventListener('submit', function(ev) {
    ev.preventDefault();
  });
});

$$('.preset').forEach(function (el) {
  var mc = new Hammer.Manager(el);
  mc.options.domEvents = true;

  mc.add(new Hammer.Tap());
  mc.on("tap", handlePresetTap);
});

// Set focus on first preset.
var firstPreset = $$('.preset')[0];
setPresetFocus(firstPreset);

// Set listeners on shape input
(function initControls() {
  $$('input[name="shape"]').forEach(function(el) {
    el.addEventListener('change', function() {
      // Save setting.
      var proto = $('.preset.is-focused').childNodes[0];
      proto.dataset.shape = this.value;

      // Update visual appearance.
      setPresetOptions(proto);
    });
  });

  $('#color').addEventListener('change', function(ev) {
    // Save setting.
    var proto = $('.preset.is-focused').childNodes[0];
    proto.dataset.color = this.value;

    // Update visual appearance.
    setPresetOptions(proto);

    // Prevent the #form-controls listener from grabbing this gesture.
    ev.stopPropagation();
  });

  $('#opacity').addEventListener('input', function(ev) {
    // Save setting.
    var proto = $('.preset.is-focused').childNodes[0];
    proto.dataset.opacity = this.value;

    // Update visual appearance.
    setPresetOptions(proto);

    // Prevent the #form-controls listener from grabbing this gesture.
    ev.stopPropagation();
    ev.preventDefault();
  });

  $('#mix-blend-mode').addEventListener('change', function(ev) {
    // Save setting.
    var proto = $('.preset.is-focused').childNodes[0];
    proto.dataset.mixBlendMode = this.value;

    // Update visual appearance.
    setPresetOptions(proto);

    // Prevent the #form-controls listener from grabbing this gesture.
    ev.stopPropagation();
  });

  // Updates all proto shapes with current options.
  $$('.proto').forEach(setPresetOptions);
})();


//
// Helper function to handle taps to presets. They have different behaviors
// depending on the state of the controls (open/closed).
//
function handlePresetTap(ev) {
  if (controls.classList.contains('is-open')) {
    setPresetFocus(ev.srcEvent.target);
  } else {
    window.createShape(ev);
  }
}


//
// Helper function to set focus on a different preset.
//
function setPresetFocus(el) {
  var settings = {};
  var presets = $$('.preset');
  var target = el;

  // Remove focus from previous element.
  presets.forEach(function (preset) {
    preset.classList.remove('is-focused');
  });

  // Walk upwards through the DOM until we find the preset wrapper.
  // This is just in case the actual shape element was directly tapped.
  while (!target.classList.contains('preset')) {
    target = target.parentNode;
  }

  // Set focus on target.
  target.classList.add('is-focused');
  settings = target.childNodes[0].dataset;

  // Update settings to match focused preset. Inverse of setPresetOptions().
  $('#shape--' + settings.shape).checked = true;
  $('#opacity').value = settings.opacity;
  $('#color').value = settings.color;
  $('#color').style.backgroundColor = settings.color;
  $('#mix-blend-mode').value = settings.mixBlendMode;
}


//
// Helper function to update focused preset when options are changed.
//
function setPresetOptions(el) {
  // reset class
  el.classList.remove('proto--square','proto--rectangle','proto--circle','proto--triangle');
  el.classList.add('proto--' + el.dataset.shape);

  // set simple props
  el.style.color = el.dataset.color;
  el.style.opacity = el.dataset.opacity;
  el.style.mixBlendMode = el.dataset.mixBlendMode;
}


//
// Callback for controls gestures.
//
function dragControls(ev) {
  var direction = 'up';

  // First, we need to figure out if we're bailing out of this callback.
  // There are several form controls whose function is completely disrupted
  // by this listener. We need to exit early when we detect that they are
  // being manipulated.
  if (ev.srcEvent.target === $('#opacity')) {
    // Bail.
    return;
  } else {
    // If we're proceeding, then prevent default behavior and allow this cb
    // to control the drawer.
    ev.preventDefault();
  }

  // Grab initial position so we know where to move.
  if (ev.type === 'panstart') {
    // Get the starting position for this gesture
    controls_transform.init.y = controls_transform.y;
  }

  // Determine how to transition the drawer open or closed based on the final
  // velocity or position of the gesture.
  if (ev.type === 'panend') {
    // First check event velocity/direction to see if it was a swiping motion.
    // When a swipe is detected, follow the swipe regardless of current position.
    if (Math.abs(ev.velocityY) > SWIPE_THRESHOLD) {
      direction = ev.velocityY > 0 ? 'up' : 'down';
      controls.classList.add(direction + '-fast');
    } else {
      // Velocity was not sufficient to consider the gesture a swipe. Instead of
      // tracking the gesture, we need to calculate whether the drawer is more
      // open or closed, then transition to that state.
      direction = Math.abs(controls_transform.y) > (controls_transform.height / 2) ? 'up' : 'down';
      controls.classList.add(direction + '-slow');
    }

    // Remove animation class afterwards.
    animationEvent && controls.addEventListener(animationEvent, function finishAnimation() {
      var goingDown = direction == 'down';

      // Set transform to end position of controls animation.
      controls_transform.y = goingDown ? 0 : -controls_transform.height;

      // Don't use rAF for this DOM update. It should always be immediate.
      controls.style.webkitTransform = 'translateY(' + controls_transform.y + 'px)';
      controls.style.transform = 'translateY(' + controls_transform.y + 'px)';

      // Remove any possible animation classes.
      controls.classList.remove('up-fast', 'up-slow', 'down-fast', 'down-slow');

      // Add a class if the drawer was just opened, remove if closed
      if (!goingDown) {
        controls.classList.add('is-open');
      } else {
        controls.classList.remove('is-open');
      }

      // Remove this event listener.
      controls.removeEventListener(animationEvent, finishAnimation);
    });
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
}

//
// Helper function to manage controls state and animation.
//
function redrawControls () {
  requestAnimationFrame(function () {
    var final_value = 'translateY(' + controls_transform.y + 'px)';

    // Set position.
    controls.style.webkitTransform = final_value;
    controls.style.transform = final_value;

    // release frame
    controls_transform.ticking = false;
  });
}


//
// If save button is possible, create it now.
//
// @TODO: During room creation, create config to either show or hide button
//        instead of always hiding when touch events are detected.
//
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
  window.onload = function() {
    document.addEventListener('keypress', function handleSaveCommands(e) {
      var key = e.which || e.keyCode;

      // Only react to the `s` key, and only do it if we've joined a room.
      if (!!window.logged_in && key === 115) {
        // Prep the SVG for download.
        saveCanvas();

        // Trigger download immediately.
        $('#save').click();
        return;
      }
    });
  };
}


//
// Take contents of canvas and encode them into save button so they can be
// downloaded. The click or keypress event handles the button triggering.
//
function saveCanvas() {
  // Generate SVG.
  var save_button = $('#save');
  var save_svg = $('#canvas').innerHTML.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  var data_uri = 'data:image/svg+xml;base64,' + window.btoa(save_svg);
  var filename = 'bustashape-' + window.location.hash.replace('#', '') + '-' + Date.now() + '.svg';

  // Prep link for new download.
  save_button.setAttribute('href', data_uri);
  save_button.setAttribute('download', filename);
}


//
// Helper function to provide the proper prefix for an event listener.
//
function whichAnimationEvent(){
  var t;
  var fake = document.createElement('fakeelement');
  var animations = {
    'animation':'animationend',
    'OAnimation':'oAnimationEnd',
    'MozAnimation':'animationend',
    'WebkitAnimation':'webkitAnimationEnd',
  };

  for (t in animations) {
    if (fake.style[t] !== undefined) {
      return animations[t];
    }
  }
}


//
// unFocus
//
// In the new UI, the add buttons are no longer form elements. "blurring" is not
// a matter of focusing on an invisible form item. It is done stylistically.
//
function unFocus() {
  $$('.proto').forEach(function unFocusProto(el) {
    el.classList.remove('active');
  });
}


//
// Event listeners
//
document.on('sync-controls', syncControls, true);
client.socket.on('add', unFocus);

/**
 * Sync controls.
 *
 * Receives data from other users and reconfigures controls to match the
 * settings of the group. Currently only does colors.
 */
function syncControls (palette) {
  // Sync colors.
  if (palette.hasOwnProperty('colors')) {
    var current = 0;
    $$('.proto').forEach(function (proto) {
      proto.dataset.color = palette.colors[current++];
      setPresetOptions(proto);
    });
  }
}
