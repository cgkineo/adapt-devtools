define([], function(require) {

  const Adapt = require('coreJS/adapt');

  function onTrickleBegun() {
    if (!Adapt.devtools.get('_trickleEnabled')) {
      console.log('Trickle started');
      Adapt.devtools.set('_trickleEnabled', true);
      // listen for user request to end trickle
      Adapt.devtools.once('change:_trickleEnabled', onTrickleChange);
    }
  }

  function onTrickleEnded() {
    console.log('Trickle ended');
    Adapt.devtools.off('change:_trickleEnabled', onTrickleChange);
    Adapt.devtools.set('_trickleEnabled', false);
  }

  function onTrickleChange() {
    if (!Adapt.devtools.get('_trickleEnabled')) {
      // user triggered
      Adapt.trigger('trickle:kill');
    }
  }

  function remove() {
    if (Adapt.devtools.get('_trickleEnabled')) {
      onTrickleEnded();
    }
  }

  Adapt.once('adapt:initialize devtools:enable', function() {
    if (!Adapt.devtools.get('_isEnabled')) return;

    Adapt.on('trickle:interactionInitialize trickle:started', onTrickleBegun);
    Adapt.on('trickle:kill trickle:finished', onTrickleEnded);
    Adapt.on('remove', remove);
  });

});
