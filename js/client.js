var socket = io();

$('#add').click(function(e){
  socket.emit('add', {
    id: 'shape-' + Math.floor(Math.random() * 1000000000),
    opacity: $('#opacity').val(),
    backgroundColor: $('#color').val(),
    width: $('#size').val() + 'px',
    height: $('#size').val() + 'px'
  });
  e.preventDefault();
});

socket.on('add', function(props) {
  $('#canvas').append($('<div>')
    .addClass('shape')
    .attr('id', props.id)
    .css(props)
    .draggable()
    .on('dragstart', function( event, ui ) {
      $(this).addClass('grabbing');
    })
    .on('drag', function ( event, ui ) {
      socket.emit('move', {
        me: socket.id,
        id: $(this).attr('id'),
        left: $(this).css('left'),
        top: $(this).css('top')
      });
    })
    .on('dragstop', function( event, ui ) {
      $(this).removeClass('grabbing');

      // On dragstop we don't send the "me" ID because it should end up in the
      // same place regardless of who moved it.
      socket.emit('move', {
        id: $(this).attr('id'),
        left: $(this).css('left'),
        top: $(this).css('top')
      });
    })
  );
});

socket.on('move', function(props) {
  if (props.me !== socket.id) {
    $('#' + props.id).css({
      left: props.left,
      top: props.top
    });
  }
});
