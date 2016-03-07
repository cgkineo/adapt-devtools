define(function(require) {

	var Adapt = require('coreJS/adapt');

	var DevtoolsModel = Backbone.Model.extend({

		initialize:function() {
			this.set(_.extend({
				'_trickleEnabled':false,
				'_hintingAvailable':true,
				'_hintingEnabled':false,
				'_toggleFeedbackAvailable':true,
				'_feedbackEnabled':true,
				'_autoCorrectAvailable':true,
				'_autoCorrectEnabled':false,
				'_tutorListener':null,
				'_unlockMenuAvailable':true,
				'_menuUnlocked':false,
				'_toggleBankingAvailable':true
			}, Adapt.config.get("_devtools")));
		},

		toggleFeedback:function() {
			this.set('_feedbackEnabled', !this.get('_feedbackEnabled'));
		},

		toggleHinting:function() {
			this.set('_hintingEnabled', !this.get('_hintingEnabled'));
		},

		toggleAutoCorrect:function() {
			this.set('_autoCorrectEnabled', !this.get('_autoCorrectEnabled'));
		}
	});

	return DevtoolsModel;
});
