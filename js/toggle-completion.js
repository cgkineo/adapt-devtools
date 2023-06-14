import Adapt from 'core/js/adapt';
import data from 'core/js/data';
import location from 'core/js/location';
import Utils from './utils';

let mouseTarget = null;

function init() {
  $(window).on('keypress', onKeypress);
  $(window).on('mousedown', onMouseDown);
  $(window).on('mouseup', onMouseUp);
}

function onKeypress(e) {
  const char = String.fromCharCode(e.which).toLowerCase();
  if (!mouseTarget) return;
  switch (char) {
    case 'c': return complete(mouseTarget);
    case 'r': return reset(mouseTarget);
  }
}

function complete(element) {
  const model = Utils.getModelForElement(element) || data.findById(location._currentId);
  if (!model) return;
  function doCompletion(component) {
    component.set('_isComplete', true);
  }
  const descendantComponents = model.findDescendantModels('components');
  if (!descendantComponents || descendantComponents.length === 0) {
    console.log('devtools: completing', model.get('_id'));
    doCompletion(model);
    return;
  }
  console.log('devtools: completing all components in', model.get('_id'));
  descendantComponents.forEach(model => doCompletion(model));
}

function reset(element) {
  const model = Utils.getModelForElement(element);
  if (!model) return;

  const descendantComponents = model.findDescendantModels('components');
  if (!descendantComponents || descendantComponents.length === 0) {
    console.log('devtools: resetting', model.get('_id'));
    model.reset(true, true);
    return;
  }
  console.log('devtools: resetting all components in', model.get('_id'));
  descendantComponents.forEach(model => {
    model.reset(true, true);
  });
}

function onMouseDown(e) {
  if (e.which === 1) mouseTarget = e.target;
}

function onMouseUp(e) {
  if (e.which === 1) mouseTarget = null;
}

Adapt.once('adapt:initialize devtools:enable', () => {
  if (!Adapt.devtools.get('_isEnabled')) return;
  init();
});
