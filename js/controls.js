//
// User Interface
//

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
  save_button.on('click', function saveCanvas() {
    // Generate SVG
    var save_svg = $('#canvas').innerHTML.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    var data_uri = 'data:image/svg+xml;base64,' + window.btoa(save_svg);
    var filename = 'bustashape-' + window.location.hash.replace('#', '') + '-' + Date.now() + '.svg';

    // Download SVG
    save_button.setAttribute('href', data_uri);
    save_button.setAttribute('download', filename);
  });
}
