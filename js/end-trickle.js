import Adapt from 'core/js/adapt';
import logging from 'core/js/logging';

function onTrickleBegun() {
  if (!Adapt.devtools.get('_trickleEnabled')) {
    logging.debug('Trickle started');
    Adapt.devtools.set('_trickleEnabled', true);
    // listen for user request to end trickle
    Adapt.devtools.once('change:_trickleEnabled', onTrickleChange);
  }
}

function onTrickleEnded() {
  logging.debug('Trickle ended');
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

Adapt.once('adapt:initialize devtools:enable', () => {
  if (!Adapt.devtools.get('_isEnabled')) return;

  Adapt.on('trickle:interactionInitialize trickle:started', onTrickleBegun);
  Adapt.on('trickle:kill trickle:finished', onTrickleEnded);
  Adapt.on('remove', remove);
});
