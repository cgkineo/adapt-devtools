define([
  'core/js/adapt',
  './utils'
], function(Adapt, Utils) {

  var mouseTarget = null;

  function init() {
    $(window).on('keypress', onKeypress);
    $(window).on('mousedown', onMouseDown);
    $(window).on('mouseup', onMouseUp);
  }

  function onKeypress(e) {
    var char = String.fromCharCode(e.which).toLowerCase();

    if (mouseTarget) {
      switch (char) {
        case 'c': return complete(mouseTarget);
        case 'r': return reset(mouseTarget);
      }
    }
  }

  function complete(element) {
    var model = Utils.getModelForElement(element);
    if (!model) return;

    function doCompletion(component) {
      component.set('_isComplete', true);
    }

    var descendantComponents = model.findDescendantModels('components');
    if (!descendantComponents || descendantComponents.length === 0) {
      console.log('devtools: completing', model.get('_id'));
      doCompletion(model);
      return;
    }

    console.log('devtools: completing all components in', model.get('_id'));
    _.each(descendantComponents, function(model) {
      doCompletion(model);
    });
  }

  function reset(element) {
    var model = Utils.getModelForElement(element);
    if (!model) return;

    var descendantComponents = model.findDescendantModels('components');
    if (!descendantComponents || descendantComponents.length === 0) {
      console.log('devtools: resetting', model.get('_id'));
      model.reset(true, true);
      return;
    }
    console.log('devtools: resetting all components in', model.get('_id'));
    _.each(descendantComponents, function(model) {
      model.reset(true, true);
    });
  }

  function onMouseDown(e) {
    if (e.which === 1) mouseTarget = e.target;
  }

  function onMouseUp(e) {
    if (e.which === 1) mouseTarget = null;
  }

  Adapt.once('adapt:initialize devtools:enable', function() {
    if (!Adapt.devtools.get('_isEnabled')) return;

    init();
  });

});
