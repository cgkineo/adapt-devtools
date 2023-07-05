import Adapt from 'core/js/adapt';
import Router from 'core/js/router';
import location from 'core/js/location';

function breakLocks(collection) {
  collection.each(model => {
    model.unset('_lockType');
    model.unset('_isLocked');
  });
}

function breakCoreMenuLocking() {
  Adapt.course.unset('_lockType');
  breakLocks(Adapt.contentObjects);
}

function breakCoreLocking() {
  breakCoreMenuLocking();
  breakLocks(Adapt.articles);
  breakLocks(Adapt.blocks);
}

function onUnlocked() {
  if (!Adapt.devtools.get('_unlocked')) return;
  breakCoreLocking();
  // reload the page/menu
  if (location._currentId === Adapt.course.get('_id')) Router.handleRoute ? Router.handleRoute() : Router.handleCourse();
  else Router.handleId(location._currentId);
}

function onUnlockedMenu() {
  if (!Adapt.devtools.get('_unlockedMenu')) return;
  breakCoreMenuLocking();
  // reload the page/menu
  if (location._currentId === Adapt.course.get('_id')) Router.handleRoute ? Router.handleRoute() : Router.handleCourse();
  else Router.handleId(location._currentId);
}

// menu unlock legacy (for courses authored prior to v2.0.9 or which otherwise do not use core locking)
function onMenuPreRender(view) {
  if (!Adapt.devtools.get('_unlocked')) return;
  if (location._currentId !== view.model.get('_id')) return;
  view.model.once('change:_isReady', onMenuReady.bind(view));
  view.model.getChildren().each(item => {
    // first pass: attempt to manipulate commonly employed locking mechanisms
    if (item.has('_lock')) item.set('_lock', item.get('_lock').length > -1 ? [] : false);
    if (item._lock) item._lock = item._lock.length > -1 ? [] : false;
    if (item._locked === true) item._locked = false;
    if (item._isLocked === true) item._isLocked = false;
  });
}

// menu unlock legacy (for courses authored prior to v2.0.9 or which otherwise do not use core locking)
function onMenuReady() {
  if (!Adapt.devtools.get('_unlocked')) return;
  // second pass: attempt to enable clickable elements
  this.$('a, button').prop('disabled', false).css('pointer-events', 'auto');
}

Adapt.once('adapt:initialize devtools:enable', () => {
  if (!Adapt.devtools.get('_isEnabled')) return;
  if (!Adapt.devtools.get('_unlockAvailable')) return;
  Adapt.devtools.on('change:_unlocked', onUnlocked);
  Adapt.devtools.on('change:_unlockedMenu', onUnlockedMenu);
  Adapt.on('menuView:preRender', onMenuPreRender);
});
