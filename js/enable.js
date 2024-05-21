import Adapt from 'core/js/adapt';
import Router from 'core/js/router';
import location from 'core/js/location';

let buffer = '';
let isMouseDown = false;
const hitArea = 100;
const coords = {};
let topLeftTapHold = false;
let topRightTapHold = false;
let listenType = 0;
let timeoutId;
const focusableElements = 'a,button,input,select,textarea,[tabindex],label';

function onKeypress(e) {
  const c = String.fromCharCode(e.which).toLowerCase();
  buffer += c;
  if (isMouseDown && c === '5' && !Adapt.devtools.get('_isEnabled')) enable();
  else processBuffer();
}

function onMouseDown() {
  isMouseDown = true;
}

function onMouseUp() {
  isMouseDown = false;
}

function processBuffer() {
  let blen = buffer.length;
  if (blen > 100) buffer = buffer.substr(1, 100);
  blen = buffer.length;

  if (buffer.substr(blen - ('kcheat').length, ('kcheat').length) === 'kcheat') {
    if (!Adapt.devtools.get('_isEnabled')) enable();
  }
}

function enable() {
  removeHooks();
  Adapt.devtools.set('_isEnabled', true);
  Adapt.trigger('devtools:enable');

  // reload the menu/page
  if (location._currentId === Adapt.course.get('_id')) Router.handleRoute ? Router.handleRoute() : Router.handleCourse();
  else Router.handleId(location._currentId);
}

function addHooks() {
  $(window).on('keypress', onKeypress);
  $(window).on('mousedown', onMouseDown);
  $(window).on('mouseup', onMouseUp);

  window.kcheat = () => {
    buffer = 'kcheat';
    processBuffer();
  };

  Router.route('kcheat', 'kcheat', () => {
    if (window.kcheat) window.kcheat();
  });

  if (Modernizr.touch) addTouchHook();
}

function removeHooks() {
  $(window).off('keypress', onKeypress);
  $(window).off('mousedown', onMouseDown);
  $(window).off('mouseup', onMouseUp);
  window.kcheat = undefined;
  if (Modernizr.touch) removeTouchHook();
}

function addTouchHook() {
  $('body').on('touchstart', onTouchStart);
  $('body').on('touchend', onTouchEnd);

  // a11y will stop propagation of event on focusable elements so we need to listen specifically to these
  $('body').on('touchstart', focusableElements, onTouchStart);
}

function removeTouchHook() {
  clearTimeout(timeoutId);

  $('body').off('touchstart', onTouchStart);
  $('body').off('touchend', onTouchEnd);
  $('body').off('touchstart', focusableElements, onTouchStart);
}

function onTouchStart(event) {
  const touches = event.originalEvent.touches;
  if (touches.length !== 1) return;
  coords.x = touches[0].pageX;
  coords.y = touches[0].pageY;
  if (coords.x >= 0 && coords.x < hitArea && coords.y >= 0 && coords.y < hitArea) {
    listenType = 1;
  } else if (coords.x >= $(window).width() - hitArea && coords.x < $(window).width() && coords.y >= 0 && coords.y < hitArea) {
    listenType = 2;
  } else {
    listenType = topLeftTapHold = topRightTapHold = false;
  }
  if (!listenType) return;
  timeoutId = setTimeout(() => {
    // if finger still held
    if (!listenType) return;
    if (listenType === 1) topLeftTapHold = true;
    else if (listenType === 2) topRightTapHold = true;

    if (topLeftTapHold && topRightTapHold) {
      if (window.kcheat) window.kcheat();
    }
  }, 200);
}

function onTouchEnd(event) {
  listenType = false;
  clearTimeout(timeoutId);
}

Adapt.once('adapt:initialize', () => {
  if (Adapt.devtools.get('_isEnabled')) return;
  // some plugins (e.g. bookmarking) will manipulate the router so defer the call
  _.defer(() => addHooks());
});
