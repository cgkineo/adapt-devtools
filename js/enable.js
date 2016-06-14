define(function(require) {

	var Adapt = require('coreJS/adapt');
	var Router = require('coreJS/router');

	var buffer = '';
	var isMouseDown = false;

	function onKeypress(e) {
		var c = String.fromCharCode(e.which).toLowerCase();
		buffer += c;
		if (isMouseDown && c == '5' && !Adapt.devtools.get('_isEnabled')) enable();
		else processBuffer();
	}

	function onMouseDown() {
		isMouseDown = true;
	}

	function onMouseUp() {
		isMouseDown = false;
	}
	
	function processBuffer() {
		var blen = buffer.length;
		if (blen > 100) buffer = buffer.substr(1,100);
		blen = buffer.length;

		if (buffer.substr( blen - ("kcheat").length, ("kcheat").length  ) == "kcheat") {
			if (!Adapt.devtools.get('_isEnabled')) enable();
		}
	}

	function enable() {
		removeHooks();
		Adapt.devtools.set('_isEnabled', true);
		Adapt.trigger('devtools:enable');

		// reload the menu/page
		if (Adapt.location._currentId == Adapt.course.get('_id')) Router.handleRoute ? Router.handleRoute() : Router.handleCourse();
		else Router.handleId(Adapt.location._currentId);
	}

	function addHooks() {
		$(window).on("keypress", onKeypress);
		$(window).on("mousedown", onMouseDown);
		$(window).on("mouseup", onMouseUp);

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
		$(window).off("mousedown", onMouseDown);
		$(window).off("mouseup", onMouseUp);
		window.kcheat = undefined;
	}

	Adapt.once('adapt:initialize', function() {
		if (Adapt.devtools.get('_isEnabled')) return;

		// some plugins (e.g. bookmarking) will manipulate the router so defer the call
		_.defer(function () {addHooks();});
	});
});
