define(function(require) {

	var Adapt = require('coreJS/adapt');

	var DevtoolsModel = Backbone.Model.extend({

		initialize:function() {
			var config = Adapt.config.has('_devtools') ? Adapt.config.get('_devtools') : this.getDefaultConfig();
			this.set(_.extend({
				'_trickleEnabled':false,
				'_hintingAvailable':true,
				'_hintingEnabled':false,
				'_toggleFeedbackAvailable':true,
				'_feedbackEnabled':true,
				'_autoCorrectAvailable':true,
				'_autoCorrectEnabled':false,
				'_tutorListener':null,
				'_unlockAvailable':true,
				'_unlocked':false,
				'_toggleBankingAvailable':true
			}, config));
		},

		getDefaultConfig:function() {
			return {
				'_isEnabled':false,
				'_theme':'theme-dark'
			};
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
