/* eslint no-unused-vars: 1 */

//
// bling.js but using qS and qSA
//
window.$ = document.querySelector.bind(document);
window.$$ = document.querySelectorAll.bind(document);

Node.prototype.on = window.on = function (name, fn) {
  this.addEventListener(name, fn);
};

NodeList.prototype.__proto__ = Array.prototype;

NodeList.prototype.on = NodeList.prototype.addEventListener = function (name, fn) {
  this.forEach(function (elem) {
    elem.on(name, fn);
  });
};


//
// Math stuff
//
Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};
Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};

// Coerce strings to numbers
Math.n = function(x) {
  return Number(x);
};


////////////////////////////////////////////////////////////////////////////////
// Bustashape debugging
//
// Check whether we're in debug mode and offer some debugging tools.
////////////////////////////////////////////////////////////////////////////////
busta.debug = {
  //
  // Flag to toggle debug statements
  //
  enabled: (typeof debug_busta !== 'undefined'),

  //
  // Output some debug stats for the canvas
  //
  canvas: function(scene_transform) {
    var debug_data = 't:' + scene_transform.x +','+ scene_transform.y +' s:'+ scene_transform.scale;
    $('.debug--canvas').innerText = debug_data;
  },

  //
  // Output debug stats for the shape the user is interacting with. If two or
  // more shapes are being dragged it will show whatever data called it last.
  //
  shape: function(shape) {
    var debug_data = 't:' + shape.translation +' s:'+ shape.scale +' r:'+ shape.rotation;
    $('.debug--shape').innerText = debug_data;
  },
};


////////////////////////////////////////////////////////////////////////////////
// Bustashape utilities
//
// These things could all have a better home, but until I have that home they
// are at least not bleeding all over global scope like they used to.
////////////////////////////////////////////////////////////////////////////////
busta.utils = {
  //
  // Blur all form fields
  // @see http://stackoverflow.com/a/29237391/175551
  //
  blurAll: function() {
    var tmp = document.createElement("input");
    document.body.appendChild(tmp);
    tmp.focus();
    document.body.removeChild(tmp);
  },
};
