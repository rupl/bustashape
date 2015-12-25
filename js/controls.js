//
// User Interface
//

var controls = $$('#form-controls label');

controls.forEach(function(current, index, array) {
  current.on('touchend', function debugLabel() {
    // Debug
    console.info('You touched ' + current.htmlFor);

    // Shut the current visible widget if needed.
    $$('#form-controls .visible').forEach(function (el, i) {
      el.classList.remove('visible');
      console.info(el);
    });

    // Whitelist which widgets can pop up.
    var toggle_widgets = ['opacity', 'color'];

    // Toggle the widget if needed.
    if (toggle_widgets.indexOf(current.htmlFor) !== -1) {
      $('#' + current.htmlFor).classList.toggle('visible');

      // Remove focus from color input when closing.
      if (current.htmlFor === 'color' && !$('#' + current.htmlFor).classList.contains('visible')) {
        blurAll();
      }
    }
  })
});
