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
  $('#room').value = window.location.hash.replace('#','');
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
    if (!res) { alert(data); return false; }

    // Join the room.
    client.room = data.room;
    window.location.hash = ('#' + data.room);

    // Hide login form.
    $('#btn-login').value = '👍';

    setTimeout(function () {
      $('.welcome').classList.add('hide');
      $('#form-login').classList.add('hide');
      $('#form-controls').classList.remove('hide');
      blurAll();

      // Set this global to true so saving can be triggered by keyCode
      window.logged_in = true;
    }, 1000);
  });
}

// Announce when people join the room.
document.on('user-joined', userJoined, true);
document.on('user-left', userLeft, true);

/**
 * The server reports that a new person has connected.
 */
function userJoined(data) {
  // One day we'll have an indicator that someone joined. It would go here.

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
