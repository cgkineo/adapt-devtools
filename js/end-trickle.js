define(function(require) {

	var Adapt = require('coreJS/adapt');

	function onTrickleBegun() {
		if (!Adapt.cheat.get('_trickleEnabled')) {
			console.log('Trickle started');
			Adapt.cheat.set('_trickleEnabled', true);
			// listen for user request to end trickle
			Adapt.cheat.once('change:_trickleEnabled', onTrickleChange);
		}
	}

	function onTrickleEnded() {
		console.log('Trickle ended');
		Adapt.cheat.off('change:_trickleEnabled', onTrickleChange);
		Adapt.cheat.set('_trickleEnabled', false);
	}

	function onTrickleChange() {
		if (!Adapt.cheat.get('_trickleEnabled')) {
			// user triggered
			Adapt.trigger('trickle:kill');
		}
	}

	function remove() {
		if (Adapt.cheat.get('_trickleEnabled')) {
			onTrickleEnded();
		}
	}

	Adapt.once('adapt:initialize', function() {
		var config = Adapt.config.get("_cheat");
		if (!config || !config._isEnabled) return;

		Adapt.on('trickle:interactionInitialize', onTrickleBegun);
		Adapt.on('trickle:kill', onTrickleEnded);
		Adapt.on('remove', remove);
	});
});