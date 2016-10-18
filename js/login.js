/**
 * Log a user in
 */
me.logged_in = false;


//
// Join a room
//
me.join = function () {
  // me.nick = $('#nick').value;
  me.room = $('#room').value || false;

  var data = {
    // 'nick': me.nick,
    'room': me.room,
  };

  // Attempt to join the room.
  client.send('join', data, function (res, data) {
    // Something went wrong.
    if (!res) {
      alert(data);
      return false;
    }

    // Join the room.
    client.room = data.room;
    window.location.hash = ('#' + data.room);

    // Log to GA
    ga('send', 'event', 'Users', 'join', data.room);

    // Hide login form.
    $('#btn-login').value = '👍';

    setTimeout(function () {
      $('.welcome').classList.add('hide');
      $('#form-login').classList.add('hide');
      $('#form-controls').classList.remove('hide');

      // Set this global to true so saving can be triggered by keyCode
      me.logged_in = true;
    }, 500);
  });
};


//
// Listen for form submission and join room
//
$('#form-login').on('submit', function (ev) {
  me.join();
  ev.preventDefault();
});

//
// Auto-fill and login
//
// When hash is present (e.g. following a shared link) just login immediately
// and let them join the action. We shouldn't require them to take any action
// whatsoever in order to join an existing room.
//
if (window.location.hash !== '') {
  $('#room').value = window.location.hash.replace('#','');
  me.join();
}


// Announce when people join the room.
document.on('user-joined', userJoined, true);
document.on('user-left', userLeft, true);

/**
 * The server reports that a new person has connected.
 */
function userJoined(data) {
  var children = two.scene.children;
  var presets = $$('.proto');
  var shapes = [];
  var palette = [];

  // Loop through children and prep each shape.
  children.forEach(function (child) {
    // Assemble the object needed to create the shape in its current form and
    // add it to the payload.
    shapes.push({
      'id': child.id,
      'opacity': child._opacity,
      'x': child._matrix.elements[2],
      'y': child._matrix.elements[5],
      'scale': child._scale,
      'angle': Math.degrees(child._rotation),
      'color': child._fill,
      'class': child._renderer.elem.classList[child._renderer.elem.classList.length-1].split('--')[1], // barf
      'mixBlendMode': child._renderer.elem.style.mixBlendMode,
    });
  });

  // Send the payload of new shapes to the new user.
  client.send('sync-shapes', data.sid, shapes);

  // Assemble an array containing the current color palette.
  presets.forEach(function (proto) {
    palette.push(proto.dataset.color);
  });

  // Send our current color palette to new user.
  client.send('sync-controls', data.sid, { colors: palette });

  // Log to console.
  console.info('👥➡ %s just joined!', data.nick);
}

/**
 * The server reports that a person disconnected.
 */
function userLeft(data) {
  // One day we'll have an indicator that someone left. It would go here.

  // Log to console.
  console.info('👥⬅ %s just left :(', data.nick);
}
