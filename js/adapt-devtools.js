/*
* adapt-devtools
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Chris Steele <chris.steele@kineo.com>, Oliver Foster <oliver.foster@kineo.com>
*/

define([
	'core/js/adapt',
	'core/js/models/adaptModel',
	'./devtools-model',
	'./pass-half-fail',
	'./toggle-banking',
	'./map',
	'./auto-answer',
	'./utils',
	'./end-trickle',
	'./hinting',
	'./toggle-feedback',
	'./toggle-alt-text',
	'./unlock',
	'./enable',
	'./toggle-trace-focus',
	'./toggle-completion'
], function(Adapt, AdaptModel, DevtoolsModel, PassHalfFail, ToggleBanking, Map) {

	var navigationView;

	var DevtoolsView = Backbone.View.extend({

		className:'devtools',

		events:{
			'click .end-trickle':'onEndTrickle',
			'change .hinting input':'onToggleHinting',
			'change .banking input':'onToggleBanking',
			'change .feedback input':'onToggleFeedback',
			'change .auto-correct input':'onToggleAutoCorrect',
			'change .alt-text input':'onToggleAltText',
			'click .unlock':'onUnlock',
			'click .open-map':'onOpenMap',
			'click .open-spoor-log':'onOpenSpoorLog',
			'click .complete-page':'onCompletePage',
			'click .complete-menu':'onCompleteMenu',
			'click .pass':'onPassHalfFail',
			'click .half':'onPassHalfFail',
			'click .fail':'onPassHalfFail',
			'change .trace-focus input':'onToggleTraceFocus'
		},

		initialize: function() {
			this.render();

			this._checkUnlockVisibility();
			this._checkSpoorLogVisibility();
			this._checkTrickleEndVisibility();
			this._checkBankingVisibility();
			this._checkFeedbackVisibility();
			this._checkHintingVisibility();
			this._checkAutoCorrectVisibility();
			this._checkAltTextVisibility();
			this._checkPassHalfFailVisibility();
			this._checkCompletePageVisibility();
			this._checkCompleteMenuVisibility();
			this._checkTraceFocusVisibility();
		},

		render: function() {
			var data = Adapt.devtools.toJSON();
			var template = Handlebars.templates['devtools'];
            this.$el.html(template(data));
			return this;
		},

		/*************************************************/
		/********************* UNLOCK ********************/
		/*************************************************/

		_checkUnlockVisibility: function() {
			// check if function available and not already activated
			if (!Adapt.devtools.get('_unlockAvailable') || Adapt.devtools.get('_unlocked')) this.$('.unlock').addClass('display-none');
			else this.$('.unlock').toggleClass('display-none', !this._checkForLocks());
		},

		_checkForLocks: function() {
			if (typeof AdaptModel.prototype.checkLocking != 'function') return Adapt.location._contentType == 'menu';

			var hasLock = function(model) {return model.has('_lockType');};

			if (hasLock(Adapt.course)) return true;
			if (Adapt.contentObjects.some(hasLock)) return true;
			if (Adapt.articles.some(hasLock)) return true;
			if (Adapt.blocks.some(hasLock)) return true;

			return false;
		},

		onUnlock: function() {
			Adapt.devtools.set('_unlocked', true);
			this._checkUnlockVisibility();
		},

		/*************************************************/
		/********************** MAP **********************/
		/*************************************************/

		onOpenMap: function() {
			Map.open();
			Adapt.trigger('drawer:closeDrawer');
		},

		/*************************************************/
		/********************* SPOOR *********************/
		/*************************************************/

		_checkSpoorLogVisibility: function() {
			this.$('.open-spoor-log').prop('disabled', !require.defined('extensions/adapt-contrib-spoor/js/scorm'));
		},

		onOpenSpoorLog: function() {
			require('extensions/adapt-contrib-spoor/js/scorm').showDebugWindow();
			Adapt.trigger('drawer:closeDrawer');
		},

		/*************************************************/
		/******************** TRICKLE ********************/
		/*************************************************/

		_checkTrickleEndVisibility: function() {
			this.$('.end-trickle').toggleClass('display-none', !Adapt.devtools.get('_trickleEnabled'));
		},

		onEndTrickle: function() {
			Adapt.devtools.set('_trickleEnabled', false);
			this._checkTrickleEndVisibility();
		},

		/*************************************************/
		/*************** QUESTION BANKING ****************/
		/*************************************************/

		_checkBankingVisibility: function() {
			if (!Adapt.devtools.get('_toggleFeedbackAvailable')) {
				this.$('.banking').addClass('display-none');
				return;
			}

			var bankedAssessments = ToggleBanking.getBankedAssessmentsInCurrentPage();
			var isBankingEnabled = function(m) {return m.get('_assessment')._banks._isEnabled;};

			if (bankedAssessments.length > 0) {
				this.$('.banking').removeClass('display-none');
				this.$('.banking label').toggleClass('selected', _.some(bankedAssessments, isBankingEnabled));
			}
			else {
				this.$('.banking').addClass('display-none');
			}
		},

		onToggleBanking: function() {
			ToggleBanking.toggle();
			this._checkBankingVisibility();
		},

		/*************************************************/
		/*********** QUESTION FEEDBACK (TUTOR) ***********/
		/*************************************************/

		_checkFeedbackVisibility: function() {
			if (Adapt.devtools.get('_toggleFeedbackAvailable')) {
				this.$('.feedback').removeClass('display-none');
				this.$('.feedback label').toggleClass('selected', Adapt.devtools.get('_feedbackEnabled'));
			}
			else {
				this.$('.feedback').addClass('display-none');
			}
		},

		onToggleFeedback: function() {
			Adapt.devtools.toggleFeedback();
			this._checkFeedbackVisibility();
		},

		/*************************************************/
		/*************** QUESTION HINTING ****************/
		/*************************************************/

		_checkHintingVisibility: function() {
			if (Adapt.devtools.get('_hintingAvailable')) {
				this.$('.hinting').removeClass('display-none');
				this.$('.hinting label').toggleClass('selected', Adapt.devtools.get('_hintingEnabled'));
			}
			else {
				this.$('.hinting').addClass('display-none');
			}
		},

		onToggleHinting: function() {
			Adapt.devtools.toggleHinting();
			this._checkHintingVisibility();
		},

		/*************************************************/
		/***************** AUTO CORRECT ******************/
		/*************************************************/

		_checkAutoCorrectVisibility: function() {
			if (Adapt.devtools.get('_autoCorrectAvailable')) {
				this.$('.toggle.auto-correct').removeClass('display-none');
				this.$('.toggle.auto-correct label').toggleClass('selected', Adapt.devtools.get('_autoCorrectEnabled'));
				this.$('.tip.auto-correct').toggleClass('display-none', Adapt.devtools.get('_autoCorrectEnabled'));
			}
			else {
				this.$('.auto-correct').addClass('display-none');
			}
		},

		onToggleAutoCorrect: function() {
			Adapt.devtools.toggleAutoCorrect();
			this._checkAutoCorrectVisibility();
		},

		/*************************************************/
		/******************* ALT TEXT ********************/
		/*************************************************/

		_checkAltTextVisibility: function() {
			if (Adapt.devtools.get('_altTextAvailable')) {
				this.$('.toggle.alt-text').removeClass('display-none');
				this.$('.toggle.alt-text label').toggleClass('selected', Adapt.devtools.get('_altTextEnabled'));
				this.$('.tip.alt-text').toggleClass('display-none', Adapt.devtools.get('_altTextEnabled'));
			}
			else {
				this.$('.alt-text').addClass('display-none');
			}
		},

		onToggleAltText: function() {
			Adapt.devtools.toggleAltText();
			this._checkAltTextVisibility();
		},

		/*************************************************/
		/***************** COMPLETE PAGE *****************/
		/*************************************************/

		_checkCompletePageVisibility: function() {
			var currentModel = Adapt.findById(Adapt.location._currentId);

			if (currentModel.get('_type') != 'page') {
				this.$('.complete-page').addClass('display-none');
				return;
			}

			var incomplete = _.filter(currentModel.findDescendantModels('components'), function(m) {
				return m.get('_isInteractionComplete') === false;
			});

			this.$('.complete-page').toggleClass('display-none', incomplete.length == 0);

		},

		onCompletePage: function(e) {
			var currentModel = Adapt.findById(Adapt.location._currentId);

			if (Adapt.devtools.get('_trickleEnabled')) Adapt.trigger("trickle:kill");

			var incomplete = _.filter(currentModel.findDescendantModels('components'), function(m) {
				return m.get('_isInteractionComplete') === false;
			});

			_.each(incomplete, function(component) {
				if (component.get('_isQuestionType')) {
					component.set("_isCorrect", true);
					component.set("_isSubmitted", true);
					component.set("_score", 1);
					component.set("_attemptsLeft", Math.max(0, component.set("_attempts") - 1));
				}
				
				component.set("_isComplete", true);
				component.set(currentModel.has('_isInteractionsComplete') ? '_isInteractionsComplete' : '_isInteractionComplete', true);
			});

			Adapt.trigger('drawer:closeDrawer');
		},

		/*************************************************/
		/***************** COMPLETE MENU *****************/
		/*************************************************/

		_checkCompleteMenuVisibility: function() {
			var currentModel = Adapt.findById(Adapt.location._currentId);

			if (currentModel.get('_type') != 'menu' && currentModel.get('_type') !== "course" ) {
				this.$('.complete-menu').addClass('display-none');
				return;
			}

			var incomplete = _.filter(currentModel.findDescendantModels('components'), function(model) {
				return !model.get('_isComplete');
			});

			this.$('.complete-menu').toggleClass('display-none', incomplete.length == 0);

		},

		onCompleteMenu: function(e) {
			var currentModel = Adapt.findById(Adapt.location._currentId);

			if (Adapt.devtools.get('_trickleEnabled')) Adapt.trigger("trickle:kill");

			var incomplete = _.filter(currentModel.findDescendantModels('components'), function(model) {
				return !model.get('_isComplete');
			});

			_.each(incomplete, function(component) {
				component.set("_isComplete", true);
			});

			Adapt.trigger('drawer:closeDrawer');
		},

		/************************************************************/
		/******* Similar to original adapt-cheat functionality ******/
		/************************************************************/

		_checkPassHalfFailVisibility: function() {
			var currentModel = Adapt.findById(Adapt.location._currentId);

			if (currentModel.get('_type') != 'page') {
				this.$('.pass, .half, .fail').addClass('display-none');
				return;
			}

			var unanswered = _.filter(currentModel.findDescendantModels('components'), function(m) {
				return m.get('_isQuestionType') === true && m.get('_isSubmitted') === false;
			});
			
			if (unanswered.length == 0)	this.$('.tip.pass-half-fail').html('');
			else this.$('.tip.pass-half-fail').html('With the '+unanswered.length+' unanswered question(s) in this page do the following:');

			this.$('.pass, .half, .fail').toggleClass('display-none', unanswered.length == 0);

		},

		onPassHalfFail: function(e) {
			if (Adapt.devtools.get('_trickleEnabled')) Adapt.trigger("trickle:kill");

			// potentially large operation so show some feedback
			$('.loading').show();

			var tutorEnabled = Adapt.devtools.get('_feedbackEnabled');

			if (tutorEnabled) Adapt.devtools.set('_feedbackEnabled', false);

			if ($(e.currentTarget).hasClass('pass')) PassHalfFail.pass(_.bind(this.onPassHalfFailComplete, this, tutorEnabled));
			else if ($(e.currentTarget).hasClass('half')) PassHalfFail.half(_.bind(this.onPassHalfFailComplete, this, tutorEnabled));
			else PassHalfFail.fail(_.bind(this.onPassHalfFailComplete, this, tutorEnabled));

			Adapt.trigger('drawer:closeDrawer');
		},

		onPassHalfFailComplete: function(tutorEnabled) {
			console.log('onPassHalfFailComplete');

			if (tutorEnabled) Adapt.devtools.set('_feedbackEnabled', true);

			$('.loading').hide();
		},

		/*************************************************/
		/******************* EXTENDED ********************/
		/*************************************************/

		_checkTraceFocusVisibility: function() {
			if (Adapt.devtools.get('_traceFocusAvailable')) {
				this.$('.toggle.trace-focus').removeClass('display-none');
				this.$('.toggle.trace-focus label').toggleClass('selected', Adapt.devtools.get('_traceFocusEnabled'));
			}
			else {
				this.$('.trace-focus').addClass('display-none');
			}
		},

		onToggleTraceFocus: function() {
			Adapt.devtools.toggleTraceFocus();
			this._checkTraceFocusVisibility();
		},
	});

	var DevtoolsNavigationView = Backbone.View.extend({

		initialize: function() {
			var template = Handlebars.templates.devtoolsNavigation;

			this.$el = $(template());

			$('html').addClass('devtools-enabled');
			$('html').toggleClass('devtools-extended', Adapt.devtools.get('_extended'));

			if (this.$el.is('a') || this.$el.is('button')) this.$el.on('click', _.bind(this.onDevtoolsClicked, this));
			else this.$el.find('a, button').on('click', _.bind(this.onDevtoolsClicked, this));

			// keep drawer item to left of PLP, resources, close button etc
			this.listenTo(Adapt, 'pageView:postRender menuView:postRender', this.onContentRendered);
			// ensure render occurs at least once (_isReady will not change to true on menus that exclude content objects)
			this.listenToOnce(Adapt, 'pageView:postRender menuView:postRender', this.render);
		},

		render: function() {
	        $('.navigation-inner').append(this.$el);
			return this;
		},

		remove: function() {
			this.$el.remove();
			this.stopListening();
			return this;
		},

		deferredRender: function() {
			_.defer(_.bind(this.render, this));
		},

		onContentRendered: function(view) {
			if (view.model.get('_id') == Adapt.location._currentId) {
				this.stopListening(view.model, 'change:_isReady', this.deferredRender);
				this.listenToOnce(view.model, 'change:_isReady', this.deferredRender);
			}
		},

		onDevtoolsClicked: function(event) {
			if(event && event.preventDefault) event.preventDefault();
            Adapt.drawer.triggerCustomView(new DevtoolsView().$el, false);
		}
	});

	Adapt.once('courseModel:dataLoaded', function() {
		Adapt.devtools = new DevtoolsModel();
	});

	Adapt.once('adapt:initialize devtools:enable languagePicker:languageChange', function() {
		if (!Adapt.devtools.get('_isEnabled')) return;

		if (navigationView) navigationView.remove();
		
		navigationView = new DevtoolsNavigationView();
	});
});
