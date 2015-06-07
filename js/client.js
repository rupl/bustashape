var socket = io();

$('#add').click(function(e){
  socket.emit('add', {
    id: 'shape-' + Math.floor(Math.random() * 10000000),
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
    .on('dragstop', function( event, ui ) {
      $(this).removeClass('grabbing');

      socket.emit('move', {
        id: $(this).attr('id'),
        left: $(this).css('left'),
        top: $(this).css('top')
      });
    })
  );
});

socket.on('move', function(props) {
  $('#' + props.id).css({
    left: props.left,
    top: props.top
  });
});
