//
// Callback for the simple Add action. When a user drags up the menu to reveal
// shape options, there is a different set of actions executed.
//
function createShape(ev) {
  // Stop default behavior.
  ev.preventDefault();
  ev.srcEvent.stopPropagation();

  // Store original touch target.
  var target = ev.target;

  // Walk upwards through the DOM until we find the preset wrapper.
  //
  // We listen for touch events on the wrappers in addition to the proto shapes
  // themselves to account for fat-finger taps. This while loop ensures that the
  // rest of this function is always "starting" from the container, regardless
  // of whether the container or the proto shape itself was tapped.
  while (!target.classList.contains('preset')) {
    target = target.parentNode;
  }

  // Proto shape is the only direct child of preset container.
  var preset = target.childNodes[0];

  // New shape position
  //
  // Shapes get lost when the user doesn't see them immediately. New shapes
  // should appear in the center of the user's viewport so it's noticeable when
  // it appears. The numbers generated here are relative to scene_transform, so
  // they will appear in the same place on the canvas on all other screens, even
  // if it's not the center of the other person's screen.
  var REL_SCALE = 1 / scene_transform.scale;
  var REL_X = Math.floor((-scene_transform.x + (two.width / 2)) / scene_transform.scale);
  var REL_Y = Math.floor((-scene_transform.y + (two.height / 2)) / scene_transform.scale);

  // Set button to active so it's obvious that it was pressed. The incoming
  // socket event will unset this class.
  preset.classList.add('active');

  // Send to ALL clients including self. It doesn't immediately add a shape to
  // the DOM, the 'add' socket listener does it after a round trip to server.
  client.socket.emit('add', {
    room: client.room,
    id: 'shape-' + Math.floor(Math.random() * 1000000000),
    class: preset.dataset.shape,
    opacity: preset.dataset.opacity,
    color: preset.dataset.color,
    borderColor: preset.dataset.color,
    mixBlendMode: preset.dataset.mixBlendMode,
    x: REL_X,
    y: REL_Y,
    scale: REL_SCALE,
    angle: 0,
  });

  // Log to GA
  ga('send', 'event', 'Shapes', 'create', client.room);
}
