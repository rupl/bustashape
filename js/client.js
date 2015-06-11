var socket = io();

$('#add').click(function(e){
  socket.emit('add', {
    id: 'shape-' + Math.floor(Math.random() * 1000000000),
    opacity: $('#opacity').val(),
    backgroundColor: $('#color').val(),
    width: $('#size').val() + 'px',
    height: $('#size').val() + 'px',
    mixBlendMode: $('#mix-blend').val(),
    position: 'absolute'
  });
  e.preventDefault();
});

socket.on('add', function(props) {
  $('#canvas').append($('<div>')
    .addClass('shape')
    .attr('id', props.id)
    .css(props)
  );

  var reqAnimationFrame = (function () {
    return window[Hammer.prefixed(window, 'requestAnimationFrame')] || function (callback) {
      window.setTimeout(callback, 1000 / 60);
    };
  })();

  var log = document.querySelector("#log");
  var el = document.querySelector('#' + props.id);

  var timer;
  var ticking = false;
  var transform = {
    translate: { x: 0, y: 0 },
    scale: 1,
    angle: 0,
    rx: 0,
    ry: 0,
    rz: 0
  };

  var mc = new Hammer.Manager(el);

  mc.add(new Hammer.Pan({ threshold: 0, pointers: 0 }));

  mc.add(new Hammer.Swipe()).recognizeWith(mc.get('pan'));
  mc.add(new Hammer.Rotate({ threshold: 0 })).recognizeWith(mc.get('pan'));
  mc.add(new Hammer.Pinch({ threshold: 0 })).recognizeWith([mc.get('pan'), mc.get('rotate')]);

  mc.add(new Hammer.Tap({ event: 'doubletap', taps: 2 }));
  mc.add(new Hammer.Tap());

  mc.on("panstart panmove", onPan);
  mc.on("rotatestart rotatemove", onRotate);
  mc.on("pinchstart pinchmove", onPinch);
  mc.on("swipe", onSwipe);
  mc.on("tap", onTap);
  mc.on("doubletap", onDoubleTap);

  mc.on("hammer.input", function(ev) {
    if(ev.isFinal) {
      syncElement();
    }
  });


  function syncElement() {
    requestElementUpdate();
  }

  function updateElementTransform() {
    var value = [
      'translate3d(' + transform.translate.x + 'px, ' + transform.translate.y + 'px, 0px)',
      'scale(' + transform.scale + ', ' + transform.scale + ')',
      'rotate3d('+ transform.rx +','+ transform.ry +','+ transform.rz +','+  transform.angle + 'deg)'
    ];

    value = value.join(' ');
    el.style.webkitTransform = value;
    el.style.mozTransform = value;
    el.style.transform = value;
    ticking = false;

    socket.emit('move', {
      me: socket.id,
      id: props.id,
      transform: value
    });
  }

  function requestElementUpdate() {
    if(!ticking) {
      reqAnimationFrame(updateElementTransform);
      ticking = true;
    }
  }

  function logEvent(str) {
    //log.insertBefore(document.createTextNode(str +"\n"), log.firstChild);
  }

  function onPan(ev) {
    transform.translate = {
      x: ev.deltaX,
      y: ev.deltaY
    };

    requestElementUpdate();
    logEvent(ev.type);
  }

  var initScale = 1;
  function onPinch(ev) {
      if(ev.type == 'pinchstart') {
          initScale = transform.scale || 1;
      }

      el.className = '';
      transform.scale = initScale * ev.scale;

      requestElementUpdate();
      logEvent(ev.type);
  }

  var initAngle = 0;
  function onRotate(ev) {
      if(ev.type == 'rotatestart') {
          initAngle = transform.angle || 0;
      }

      el.className = '';
      transform.rz = 1;
      transform.angle = initAngle + ev.rotation;
      requestElementUpdate();
      logEvent(ev.type);
  }

  function onSwipe(ev) {
      var angle = 50;
      transform.ry = (ev.direction & Hammer.DIRECTION_HORIZONTAL) ? 1 : 0;
      transform.rx = (ev.direction & Hammer.DIRECTION_VERTICAL) ? 1 : 0;
      transform.angle = (ev.direction & (Hammer.DIRECTION_RIGHT | Hammer.DIRECTION_UP)) ? angle : -angle;

      clearTimeout(timer);
      timer = setTimeout(function () {
          syncElement();
      }, 300);
      requestElementUpdate();
      logEvent(ev.type);
  }

  function onTap(ev) {
      transform.rx = 1;
      transform.angle = 25;

      clearTimeout(timer);
      timer = setTimeout(function () {
          syncElement();
      }, 200);
      requestElementUpdate();
      logEvent(ev.type);
  }

  function onDoubleTap(ev) {
      transform.rx = 1;
      transform.angle = 80;

      clearTimeout(timer);
      timer = setTimeout(function () {
          syncElement();
      }, 500);
      requestElementUpdate();
      logEvent(ev.type);
  }


  socket.on('move', function(props) {
    if (props.me !== socket.id) {
      $('#' + props.id).css({
        transform: props.transform
      });
    }
  });


      // .draggable()
      // .on('dragstart', function( event, ui ) {
      //   $(this).addClass('grabbing');
      // })
      // .on('drag', function ( event, ui ) {
      //   socket.emit('move', {
      //     me: socket.id,
      //     id: $(this).attr('id'),
      //     left: $(this).css('left'),
      //     top: $(this).css('top')
      //   });
      // })
      // .on('dragstop', function( event, ui ) {
      //   $(this).removeClass('grabbing');

      //   // On dragstop we don't send the "me" ID because it should end up in the
      //   // same place regardless of who moved it.
      //   socket.emit('move', {
      //     id: $(this).attr('id'),
      //     left: $(this).css('left'),
      //     top: $(this).css('top')
      //   });
      // })
});
