//
// User Interface
//

// Event listeners for drawer.
var toggle = $('#toggle').on('click', toggleDrawer);
var toggle = $('#toggle').on('touchend', toggleDrawer);

// Gather control elements.
var controls = $$('#form-controls label');

// Set up each widget.
controls.forEach(function(current, index, array) {
  current.on('touchend', function toggleLabel() {
    if ($('#form-controls').classList.contains('controls--open')) {
      var widget = $('#' + current.htmlFor);

      // Collapse all controls.
      collapseControls();

      // Enable the widget that was clicked.
      widget.removeAttribute('disabled');
      if (widget.id !== 'color') {
        widget.removeAttribute('readonly');
      }

      // Whitelist which widgets can pop up.
      var toggle_widgets = ['opacity'];

      // Toggle the widget if needed.
      if (toggle_widgets.indexOf(current.htmlFor) !== -1) {
        widget.classList.toggle('visible');

        // Remove focus from color input when closing.
        if (current.htmlFor === 'color') {
          blurAll();
        }
      }
    }
  })
});

// Enable color picker on color input
jsColorPicker('#color', {
  size: 3,
  fps: 60,
  noAlpha: true,
  customBG: '#000',
  appendTo: $('label[for="color"]'),
  memoryColors: false,
  noRangeBackground: false,
  noResize: false,
  noRGBr: false,
  noRGBg: false,
  noRGBb: false,
});

// Helper function to toggle Drawer
function toggleDrawer(e) {
  var drawer = $('#form-controls');

  // Toggle drawer.
  drawer.classList.toggle('controls--open');

  // Additional processing based on open/close.
  if (drawer.classList.contains('controls--open')) {
    // Allow ADD button to listen for events.
    $('#add').removeAttribute('readonly');
    $('#add').removeAttribute('disabled');
  } else {
    // PRevent ADD button from listening for events.
    $('#add').setAttribute('readonly', 'readonly');
    $('#add').setAttribute('disabled', 'disabled');
    // Disable/close the drawer's controls.
    collapseControls();
  }

  // Don't submit form.
  e.preventDefault();
}

// Helper function to unfocus all controls.
function collapseControls() {
  // Shut the current visible widget if needed.
  $$('#form-controls label').forEach(function (el, i) {
    var child_element = $('#' + el.htmlFor);

    el.classList.remove('visible');
    child_element.setAttribute('readonly', 'readonly');
    child_element.setAttribute('disabled', 'disabled');
  });
}
