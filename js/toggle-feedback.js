define(function(require) {

	var Adapt = require('coreJS/adapt');

	function onShowFeedback() {
		// trickle waits for tutor to close so pretend that this happens
		//Adapt.trigger('tutor:opened'); trickle-tutorPlugin doesn't actually listen to this(!)
		Adapt.trigger('tutor:closed');
	}

	function hushTutor() {
		Adapt.cheat.set('_tutorListener', Adapt._events['questionView:showFeedback'].pop());
		Adapt.on('questionView:showFeedback', onShowFeedback);
	}

	function reinstateTutor() {
		Adapt.off('questionView:showFeedback', onShowFeedback);

		if (!Adapt._events.hasOwnProperty('questionView:showFeedback')) {
			Adapt._events['questionView:showFeedback'] = [];
		}

		Adapt._events['questionView:showFeedback'].push(Adapt.cheat.get('_tutorListener'));
	}

	function onFeedbackToggled() {
		if (Adapt.cheat.get('_feedbackEnabled')) {
			reinstateTutor();
			$(document).off('mouseup', '.buttons-feedback');
		}
		else {
			hushTutor();
			$(document).on('mouseup', '.buttons-feedback', onFeedbackButtonClicked);
		}
	}

	function onFeedbackButtonClicked(e) {
		var classes = $(e.currentTarget).parents('.component').attr('class');
		var componentId = /[\s]+(c\-[^\s]+)/.exec(classes)[1];
		
		if (componentId) {
			// bring tutor back temporarily
			reinstateTutor();
			// tutor expects a view, but it's not actually needed
			Adapt.trigger('questionView:showFeedback', {model:Adapt.findById(componentId)});
			// and hush it again
			hushTutor();
		}
		else console.error('cheat:onFeedbackButtonClicked: malformed component class name');
	}
	
	Adapt.once('adapt:initialize', function() {
		var config = Adapt.config.get("_cheat");
		if (!config || !config._isEnabled) return;

		if (Adapt.cheat.get('_toggleFeedbackAvailable')) {
			// assume single registrant is adapt-contrib-tutor
			if (Adapt._events['questionView:showFeedback'].length == 1) {
				Adapt.cheat.on('change:_feedbackEnabled', onFeedbackToggled);
			}
			else {
				console.warn('cheat: no tutor or multiple registrants of questionView:showFeedback so disabling ability to toggle feedback.');
				Adapt.cheat.set('_toggleFeedbackAvailable', false);
			}
		}
	});
});
