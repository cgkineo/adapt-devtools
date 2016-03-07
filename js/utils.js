define(function(require) {

	var Adapt = require('coreJS/adapt');
	
	// control-click to access Adapt model
	function onDocumentClicked(e) {
		if (e.ctrlKey) {
			var $target = $(e.target);

			function getModel($el, t) {
				if ($el.length == 0) return false; 
				var re = new RegExp('[\\s]+('+t+'\\-[^\\s]+)');
				var id = re.exec($el.attr('class'))[1];
				var model = id.slice(t.length+1) == Adapt.course.get('_id') ? Adapt.course : Adapt.findById(id);
				if (model) {
					id = model.get('_id').replace('-', '');
					window[id] = model;
					console.log('devtools: add property window.'+id+':');
					console.log(model);
				}
				return true;
			}
			
			if (getModel($target.parents('.component'), 'c')) return;
			if (getModel($target.parents('.block'), 'b')) return;
			if (getModel($target.parents('.article'), 'a')) return;
			if (getModel($target.parents('.page'), 'co')) return;
			if (getModel($target.parents('.menu'), 'menu')) return;
		}
	}

	Adapt.once('adapt:initialize devtools:enable', function() {
		var config = Adapt.config.get("_devtools");
		if (!config || !config._isEnabled) return;

		$(document).on('click', onDocumentClicked);

		// useful for command-line debugging
		if (!window.a) window.a = Adapt;
	});
});
