define(function(require) {

	var Adapt = require('coreJS/adapt');
	var Router = require('coreJS/router');

	var ToggleBanking = {

		initialize:function() {},

		getBankedAssessmentsInCurrentPage:function() {
			var pageModel = Adapt.findById(Adapt.location._currentId);
			var f = function(m) {
				if (m.has('_assessment') &&
					m.get('_assessment')._isEnabled &&
					m.get('_assessment')._banks._split.length > 1) return true;

				return false;
			};

			return pageModel.findDescendants('articles').filter(f);
		},

		toggle:function() {
			var bankedAssessments = this.getBankedAssessmentsInCurrentPage();
			var isBankingEnabled = function(m) {return m.get('_assessment')._banks._isEnabled;};
			var enable = !bankedAssessments.some(isBankingEnabled);

			_.each(bankedAssessments, function(articleModel) {
				articleModel.get('_assessment')._banks._isEnabled = enable;
				// set properties to trigger setup of assessment data
				articleModel.set({'_attemptInProgress':false, '_isPass':false});
			});

			// reload page
			Router.handleId(Adapt.location._currentId);
		}
	};

	Adapt.once('adapt:initialize', function() {
		var config = Adapt.config.get("_devtools");
		if (!config || !config._isEnabled) return;

		ToggleBanking.initialize();
	});

	return ToggleBanking;
});