define(function(require) {

	var Adapt = require('coreJS/adapt');
	var Router = require('coreJS/router');

	var buffer = '';

	function onKeypress(e) {
		buffer += String.fromCharCode(e.which).toLowerCase();
		processBuffer();
	}
	
	function processBuffer() {
		var blen = buffer.length;
		if (blen > 100) buffer = buffer.substr(1,100);
		blen = buffer.length;

		if (buffer.substr( blen - ("kcheat").length, ("kcheat").length  ) == "kcheat") {
			if (!Adapt.devtools.get('_isEnabled')) {
				removeHooks();
				Adapt.devtools.set('_isEnabled', true);
				Adapt.trigger('devtools:enable');

				// reload the menu/page
				if (Adapt.location._currentId == Adapt.course.get('_id')) Router.handleRoute();
				else Router.handleId(Adapt.location._currentId);
			}
		}
	}

	function addHooks() {
		$(window).on("keypress", onKeypress);

		window.kcheat = function() {
			buffer = "kcheat";
			processBuffer();
		};

		Router.route('kcheat', 'kcheat', function() {
			if (window.kcheat) window.kcheat();
		});
	}

	function removeHooks() {
		$(window).off("keypress", onKeypress);
		window.kcheat = undefined;
	}

	Adapt.once('adapt:initialize', function() {
		if (Adapt.devtools.get('_isEnabled')) return;

		// some plugins (e.g. bookmarking) will manipulate the router so defer the call
		_.defer(function () {addHooks();});
	});
});