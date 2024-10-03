import Adapt from 'core/js/adapt';
import data from 'core/js/data';
import drawer from 'core/js/drawer';
import logging from 'core/js/logging';

let mouseTarget = null;

function onMouseDown(e) {
  if (e.which === 1) mouseTarget = e.target;
}

function onMouseUp(e) {
  if (e.which === 1) mouseTarget = null;
}

function onKeypress(e) {
  const char = String.fromCharCode(e.which).toLowerCase();
  if (!mouseTarget) return;
  if (char !== 'm') return;
  const model = Utils.getModelForElement(mouseTarget);
  if (!model) return;
  const id = model.get('_id').replace(/-/g, '');
  window[id] = model;
  logging.debug('devtools: add property window.' + id + ':');
  logging.debug(model.attributes);
}

function onDrawerOpened() {
  if (drawer?._drawerView?._customView?.get(0).className !== 'devtools') return;

  // Useful for browser console debugging
  if (!window.Adapt) { window.Adapt = Adapt; }
}

function getAdaptCoreVersion() {
  return Adapt.build?.get?.('package')?.version ?? 'unknown version';
}

const Utils = {
  getModelForElement: element => {
    const $target = $(element);
    if ($target.length === 0) return false;
    const id = $target.parents('[data-adapt-id]').data('adapt-id');
    return !id ? false : data.findById(id);
  }
};

Adapt.once('adapt:initialize', () => {
  const str = 'Version of Adapt core detected: ' + getAdaptCoreVersion();
  const horz = getHorzLine();
  logging.debug('\n' + horz + '\nVersion of Adapt core detected: ' + getAdaptCoreVersion() + '\n' + horz);
  function getHorzLine() {
    let s;
    let i;
    let c;
    for (s = '', i = 0, c = str.length; i < c; i++) s += '*';
    return s;
  }
});

Adapt.once('adapt:initialize devtools:enable', () => {
  if (!Adapt.devtools.get('_isEnabled')) return;
  $(window).on('keypress', onKeypress);
  $(window).on('mousedown', onMouseDown);
  $(window).on('mouseup', onMouseUp);
  Adapt.on({
    'drawer:opened': onDrawerOpened
  });
});

export default Utils;
