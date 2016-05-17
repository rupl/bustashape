//
// Callback for the simple Add action. When a user drags up the menu to reveal
// shape options, there is a different set of actions executed.
//
function createShape(ev) {
  var preset = ev.target;

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
  preset.classList.add('active');

  // Send to ALL clients including self. It doesn't immediately add a shape to
  // your DOM, the 'add' socket listener that part.
  client.socket.emit('add', {
    class: preset.dataset.shape,
    opacity: preset.dataset.opacity,
    color: preset.dataset.color,
    borderColor: preset.dataset.color,
    mixBlendMode: preset.dataset.blend,
    x: REL_X,
    y: REL_Y,
    scale: REL_SCALE,
  });
  ev.preventDefault();
}
