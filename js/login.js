/**
 * Log a user in
 */

// Listen for form submission.
$('#form-login').on('submit', function (ev) {
  join();
  ev.preventDefault();
});

// Auto-fill room name when hash is present
if (window.location.hash !== '') {
  $('#room').value = window.location.hash;
  join();
}


//
// Connects to a specific room.
//
function join() {
  // me.nick = $('#nick').value;
  me.room = $('#room').value || false;

  var data = {
    // 'nick': me.nick,
    'room': me.room
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
      blurAll();

      // Set this global to true so saving can be triggered by keyCode
      window.logged_in = true;
    }, 500);
  });
}

// Announce when people join the room.
document.on('user-joined', userJoined, true);
document.on('user-left', userLeft, true);

/**
 * The server reports that a new person has connected.
 */
function userJoined(data) {
  var children = two.scene.children;
  var shapes = [];

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
      'mixBlendMode': '' // not yet.
    });
  });

  // Send the payload of new shapes to the new user.
  client.send('sync', data.sid, shapes);

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
