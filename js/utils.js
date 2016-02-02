//
// bling.js but using qS and qSA
//
window.$ = document.querySelector.bind(document);
window.$$ = document.querySelectorAll.bind(document);

Node.prototype.on = window.on = function (name, fn) {
  this.addEventListener(name, fn);
}

NodeList.prototype.__proto__ = Array.prototype;

NodeList.prototype.on = NodeList.prototype.addEventListener = function (name, fn) {
  this.forEach(function (elem, i) {
    elem.on(name, fn);
  });
}

//
// requestAnimationFrame polyfill
//
var reqAnimationFrame = (function () {
  return window[Hammer.prefixed(window, 'requestAnimationFrame')] || function (callback) {
    window.setTimeout(callback, 1000 / 60);
  };
})();

//
// Blur all form fields
//
// @see http://stackoverflow.com/a/29237391/175551
//
function blurAll(){
  var tmp = document.createElement("input");
  document.body.appendChild(tmp);
  tmp.focus();
  document.body.removeChild(tmp);
}

//
// Return base10 number.
//
function n(x) {
  return parseInt(x, 10);
}
