'use strict';

// If touch events are detected, use a different UI.
if (Modernizr.touchevents) {
  // Hide all labels
  $('.controls label').addClass('hidden');

  // Hide all the standard controls. They aren't deleted because these same
  // elements are still used to transmit the data to the other clients.
  $('#add, #opacity, #color, #size').addClass('hidden');

  // Add visual shapes
  var shapes = [
    '<span class="proto" id="square"></span>',
    '<span class="proto" id="circle"></span>'
  ];
  $('.controls').append(shapes.join(''));


  var square = new Hammer.Manager(document.getElementById('square'));
  var circle = new Hammer.Manager(document.getElementById('circle'));

  square.add(new Hammer.Pan({ threshold: 0, pointers: 0 }));
  square.on("panstart panmove", onPan);

  var square_new;
  var circle_new;
  var ticking = false;
  var initAngle = 0;
  var initScale = 1;
  var transform = {
    x: 0,
    y: 0,
    z: 0,
    scale: initScale,
    angle: initAngle,
    rx: 0,
    ry: 0,
    rz: 0
  };

  function onPan(ev) {
    var el;

    if (ev.type === 'panstart') {
      el = $(ev.target).clone();
    }

    if (ev.type === 'panmove') {
      transform.x = 100 + parseInt(ev.deltaX, 10);
      transform.y = 600 + parseInt(ev.deltaY, 10);
    }

    if (!ticking) {
      reqAnimationFrame(updateElementTransform.apply(el));
      ticking = true;
    }
  }

  /**
   * rAF callback which paints to the screen and emits the movement to others.
   */
  function updateElementTransform(el) {
    var value = [
      'translate3d(' + transform.x + 'px, ' + transform.y + 'px, ' + transform.z + 'px)',
      'scale(' + transform.scale + ', ' + transform.scale + ')',
      'rotate3d('+ transform.rx +','+ transform.ry +','+ transform.rz +','+  transform.angle + 'deg)'
    ];

    value = value.join(' ');
    el.style.webkitTransform = value;
    el.style.mozTransform = value;
    el.style.transform = value;
    ticking = false;
  }
}

// When no touch events are detected we still set up some special behavior.
else {

}
