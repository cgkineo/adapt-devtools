import Adapt from 'core/js/adapt';
import AdaptModel from 'core/js/models/adaptModel';
import QuestionView from 'core/js/views/questionView';

let mouseTarget = null;

function onMouseDown(e) {
  if (e.which === 1) mouseTarget = e.target;
}

function onMouseUp(e) {
  if (e.which === 1) mouseTarget = null;
}

function onKeypress(e) {
  const char = String.fromCharCode(e.which).toLowerCase();

  if (mouseTarget) {
    if (char === 'm') {
      const model = Utils.getModelForElement(mouseTarget);

      if (model) {
        const id = model.get('_id').replace(/-/g, '');
        window[id] = model;
        console.log('devtools: add property window.' + id + ':');
        console.log(model.attributes);
      }
    }
  }
}

function getAdaptCoreVersion() {
  try {
    if (Adapt.build && Adapt.build.has('package')) return Adapt.build.get('package').version || '>=v3.0.0';
    // v2.2.4-v2.2.5 not possible to distinguish
    if (typeof AdaptModel.prototype.checkCompletionStatusFor === 'function') return '>=v2.2.3';
    if (typeof AdaptModel.prototype.setCompletionStatus === 'function') return '>=v2.0.10';
    if (typeof AdaptModel.prototype.checkLocking === 'function') return 'v2.0.9';
    if (typeof Adapt.checkingCompletion === 'function') return 'v2.0.8';
    if (typeof AdaptModel.prototype.getParents === 'function') return 'v2.0.7';
    if ($.a11y && Object.prototype.hasOwnProperty.call($.a11y.options, 'isIOSFixesEnabled')) return 'v2.0.5-v2.0.6';
    if (Adapt instanceof Backbone.Model) return 'v2.0.4';
    if (typeof QuestionView.prototype.recordInteraction === 'function') return 'v2.0.2-v2.0.3';
    if (typeof Adapt.findById === 'function') return 'v2.0.0-v2.0.1';
    return 'v1.x';
  } catch (e) {
    return 'unknown version';
  }
}

const Utils = {
  getModelForElement: function(element) {
    const $target = $(element);

    if ($target.length === 0) return false;

    const id = $target.parents('[data-adapt-id]').data('adapt-id');

    return !id ? false : Adapt.findById(id);
  }
};

Adapt.once('adapt:initialize', function() {
  const str = 'Version of Adapt core detected: ' + getAdaptCoreVersion();
  const horz = getHorzLine();

  console.log(horz + '\nVersion of Adapt core detected: ' + getAdaptCoreVersion() + '\n' + horz);

  function getHorzLine() {
    let s;
    let i;
    let c;
    for (s = '', i = 0, c = str.length; i < c; i++) s += '*';
    return s;
  }
});

Adapt.once('adapt:initialize devtools:enable', function() {
  if (!Adapt.devtools.get('_isEnabled')) return;

  $(window).on('keypress', onKeypress);
  $(window).on('mousedown', onMouseDown);
  $(window).on('mouseup', onMouseUp);

  // useful for command-line debugging
  if (!window.Adapt) window.Adapt = Adapt;
});

export default Utils;
