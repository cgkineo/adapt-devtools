define(function(require) {

	var Adapt = require('coreJS/adapt');
	var AdaptModel = require('coreModels/adaptModel');
	var QuestionView = require('coreViews/questionView');
	
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
					id = model.get('_id').replace(/-/g, '');
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

	function getAdaptCoreVersion() {
		try {
			if (typeof AdaptModel.prototype.setCompletionStatus == 'function') return ">=v2.0.10";
			if (typeof AdaptModel.prototype.checkLocking == 'function') return "v2.0.9";
			if (typeof Adapt.checkingCompletion == 'function') return "v2.0.8";
			if (typeof AdaptModel.prototype.getParents == 'function') return "v2.0.7";
			if ($.a11y && $.a11y.options.hasOwnProperty('isIOSFixesEnabled')) return "v2.0.5-v2.0.6";
			if (Adapt instanceof Backbone.Model) return "v2.0.4";
			if (typeof QuestionView.prototype.recordInteraction == 'function') return "v2.0.2-v2.0.3";
			if (typeof Adapt.findById == 'function') return "v2.0.0-v2.0.1";
			return "v1.x";
		}
		catch (e) {
			return 'unknown version';
		}
	}

	Adapt.once('adapt:initialize', function() {
		var str = 'Version of Adapt core detected: '+getAdaptCoreVersion();
		var horz = getHorzLine();

		console.log(horz+'\nVersion of Adapt core detected: '+getAdaptCoreVersion()+'\n'+horz);

		function getHorzLine() {
			for (var s='', i=0, c=str.length; i<c; i++) s+='*';
			return s;
		}
	});

	Adapt.once('adapt:initialize devtools:enable', function() {
		if (!Adapt.devtools.get('_isEnabled')) return;

		$(document).on('click', onDocumentClicked);

		// useful for command-line debugging
		if (!window.a) window.a = Adapt;
	});
});
