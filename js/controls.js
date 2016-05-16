//
// User Interface
//

// Adding shapes
//
// Each shape is an add button of its own, with data-attrs controlling
// the properties of the new shape.
$$('.proto').forEach(function (el) {
  if (Modernizr.touchevents) {
    el.on('touchend', createShape);
  }
  else {
    el.on('click', createShape);
  }
});

//
// Callback for the simple Add action. When a user drags up the menu to reveal
// shape options, there is a different set of actions executed.
//
function createShape(ev) {
  // New shape position
  //
  // Shapes get lost when the user doesn't see them immediately. New shapes
  // should appear in the center of the user's viewport so it's noticeable when
  // it appears. The numbers generated here are relative to scene_transform, so
  // they will appear in the correct place on all other screens as well.
  var REL_SCALE = 1 / scene_transform.scale;
  var REL_X = Math.floor((-scene_transform.x + (two.width / 2)) / scene_transform.scale);
  var REL_Y = Math.floor((-scene_transform.y + (two.height / 2)) / scene_transform.scale);

  // Set button to active so it's obvious that it was pressed. The incoming
  // socket event will unset this class.
  this.classList.add('active');

  // Send to ALL clients including self. It doesn't immediately add a shape to
  // your DOM, the 'add' socket listener that part.
  client.socket.emit('add', {
    class: this.dataset.shape,
    opacity: this.dataset.opacity,
    color: this.dataset.color,
    borderColor: this.dataset.color,
    mixBlendMode: this.dataset.blend,
    x: REL_X,
    y: REL_Y,
    scale: REL_SCALE,
  });
  ev.preventDefault();
}

// If save button is possible, create it now.
//
// @TODO: During room creation, create config to either show or hide button
//        instead of always hiding when touch events are detected.
if (Modernizr.atobbtoa && Modernizr.adownload && !Modernizr.touchevents) {
  // Find control panel.
  var controls = $('#form-controls');

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
