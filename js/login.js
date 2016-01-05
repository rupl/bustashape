/**
 * Log a user in
 */
function join() {
  me.nick = $('#nick').value;
  me.room = $('#room').value || false;

  var data = {
    'nick': me.nick,
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
    }, 1000);
  });
}

// Listen for form submission.
$('#form-login').on('submit', function (ev) {
  join();
  ev.preventDefault();
});

// Auto-fill room name when hash is present
if (window.location.hash !== '') {
  $('#room').value = window.location.hash;
}

// Someone joined the room.
document.on('user-join', userJoin, true);

// Someone left the room.
document.on('user-quit', userQuit, true);

/**
 * The server reports that a new person has connected.
 */
function userJoin(data) {
  // One day we'll have an indicator that someone joined. It would go here.
  // For now, log to console.
  console.info('Heads up, %s just joined!', data.nick);
}

/**
 * The server reports that a person has disconnected.
 */
function userQuit(data) {
  // One day we'll have an indicator that someone left. It would go here.
  // For now, log to console.
  console.info('Aw shucks, %s just left..', data.nick);
}
