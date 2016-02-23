/*
* adapt-cheat
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Chris Steele <chris.steele@kineo.com>, Oliver Foster <oliver.foster@kineo.com>
*/

define([
	'coreJS/adapt',
	'./cheat-model',
	'./pass-half-fail',
	'./toggle-banking',
	'./auto-answer',
	'./dev-tools',
	'./end-trickle',
	'./hinting',
	'./toggle-feedback',
	'./unlock-menu'
], function(Adapt, CheatModel, PassHalfFail, ToggleBanking) {

	var CheatView = Backbone.View.extend({

		className:'cheat',

		events:{
			'click .end-trickle':'onEndTrickle',
			'change .hinting input':'onToggleHinting',
			'change .banking input':'onToggleBanking',
			'change .feedback input':'onToggleFeedback',
			'change .auto-correct input':'onToggleAutoCorrect',
			'click .menu-unlock':'onMenuUnlock',
			'click .pass':'onPassHalfFail',
			'click .half':'onPassHalfFail',
			'click .fail':'onPassHalfFail'
		},

		initialize:function() {
			this.render();

			this._checkMenuUnlockVisibility();
			this._checkTrickleEndVisibility();
			this._checkBankingVisibility();
			this._checkFeedbackVisibility();
			this._checkHintingVisibility();
			this._checkAutoCorrectVisibility();
			this._checkPassHalfFailVisibility();
		},

		render:function() {
			var data = Adapt.cheat.toJSON();
			var template = Handlebars.templates['cheat'];
            this.$el.html(template(data));
			return this;
		},

		/*************************************************/
		/********************** MENU *********************/
		/*************************************************/

		_checkMenuUnlockVisibility:function() {
			// check if function available and not already activated
			if (!Adapt.cheat.get('_unlockMenuAvailable') || Adapt.cheat.get('_menuUnlocked')) this.$('.menu-unlock').addClass('display-none');
			else this.$('.menu-unlock').toggleClass('display-none', Adapt.location._contentType != 'menu');
		},

		onMenuUnlock:function() {
			Adapt.cheat.set('_menuUnlocked', true);
			this._checkMenuUnlockVisibility();
		},

		/*************************************************/
		/******************** TRICKLE ********************/
		/*************************************************/

		_checkTrickleEndVisibility:function() {
			this.$('.end-trickle').toggleClass('display-none', !Adapt.cheat.get('_trickleEnabled'));
		},

		onEndTrickle:function() {
			Adapt.cheat.set('_trickleEnabled', false);
			this._checkTrickleEndVisibility();
		},

		/*************************************************/
		/*************** QUESTION BANKING ****************/
		/*************************************************/

		_checkBankingVisibility:function() {
			if (!Adapt.cheat.get('_toggleFeedbackAvailable')) {
				this.$('.banking').addClass('display-none');
				return;
			}

			var bankedAssessments = ToggleBanking.getBankedAssessmentsInCurrentPage();
			var isBankingEnabled = function(m) {return m.get('_assessment')._banks._isEnabled;};

			if (bankedAssessments.length > 0) {
				this.$('.banking').removeClass('display-none');
				this.$('.banking label').toggleClass('selected', bankedAssessments.some(isBankingEnabled));
			}
			else {
				this.$('.banking').addClass('display-none');
			}
		},

		onToggleBanking:function() {
			ToggleBanking.toggle();
			this._checkBankingVisibility();
		},

		/*************************************************/
		/*********** QUESTION FEEDBACK (TUTOR) ***********/
		/*************************************************/

		_checkFeedbackVisibility:function() {
			if (Adapt.cheat.get('_toggleFeedbackAvailable')) {
				this.$('.feedback').removeClass('display-none');
				this.$('.feedback label').toggleClass('selected', Adapt.cheat.get('_feedbackEnabled'));
			}
			else {
				this.$('.feedback').addClass('display-none');
			}
		},

		onToggleFeedback:function() {
			Adapt.cheat.toggleFeedback();
			this._checkFeedbackVisibility();
		},

		/*************************************************/
		/*************** QUESTION HINTING ****************/
		/*************************************************/

		_checkHintingVisibility:function() {
			if (Adapt.cheat.get('_hintingAvailable')) {
				this.$('.hinting').removeClass('display-none');
				this.$('.hinting label').toggleClass('selected', Adapt.cheat.get('_hintingEnabled'));
			}
			else {
				this.$('.hinting').addClass('display-none');
			}
		},

		onToggleHinting:function() {
			Adapt.cheat.toggleHinting();
			this._checkHintingVisibility();
		},

		/*************************************************/
		/***************** AUTO CORRECT ******************/
		/*************************************************/

		_checkAutoCorrectVisibility:function() {
			if (Adapt.cheat.get('_autoCorrectAvailable')) {
				this.$('.toggle.auto-correct').removeClass('display-none');
				this.$('.toggle.auto-correct label').toggleClass('selected', Adapt.cheat.get('_autoCorrectEnabled'));
				this.$('.tip.auto-correct').toggleClass('display-none', Adapt.cheat.get('_autoCorrectEnabled'));
			}
			else {
				this.$('.auto-correct').addClass('display-none');
			}
		},

		onToggleAutoCorrect:function() {
			Adapt.cheat.toggleAutoCorrect();
			this._checkAutoCorrectVisibility();
		},

		/************************************************************/
		/******* Similar to original adapt-cheat functionality ******/
		/************************************************************/

		_checkPassHalfFailVisibility:function() {
			var currentModel = Adapt.findById(Adapt.location._currentId);

			if (currentModel.get('_type') != 'page') return;

			var unanswered = currentModel.findDescendants('components').where({'_isQuestionType':true, '_isSubmitted':false});
			
			if (unanswered.length == 0)	this.$('.tip.pass-half-fail').html('');
			else this.$('.tip.pass-half-fail').html('With the '+unanswered.length+' unanswered question(s) in this page do the following (other components will be completed):');

			this.$('.pass, .half, .fail').toggleClass('display-none', unanswered.length == 0);

		},

		onPassHalfFail:function(e) {
			var command;

			Adapt.trigger("trickle:kill");

			// potentially large operation so show some feedback
			$('.loading').show();

			var tutorEnabled = Adapt.cheat.get('_feedbackEnabled');

			if (tutorEnabled) Adapt.cheat.set('_feedbackEnabled', false);

			if ($(e.currentTarget).hasClass('pass')) PassHalfFail.pass(_.bind(this.onPassHalfFailComplete, this, tutorEnabled));
			else if ($(e.currentTarget).hasClass('half')) PassHalfFail.half(_.bind(this.onPassHalfFailComplete, this, tutorEnabled));
			else PassHalfFail.fail(_.bind(this.onPassHalfFailComplete, this, tutorEnabled));

			Adapt.trigger('drawer:closeDrawer');
		},

		onPassHalfFailComplete:function(tutorEnabled) {
			console.log('onPassHalfFailComplete');

			if (tutorEnabled) Adapt.cheat.set('_feedbackEnabled', true);

			$('.loading').hide();
		}
	});

	var CheatNavigationView = Backbone.View.extend({

		initialize:function() {
			var template = Handlebars.templates.cheatNavigation;

			this.$el = $(template());

			$('html').addClass('cheat-enabled');

			if (this.$el.is('a') || this.$el.is('button')) this.$el.on('click', _.bind(this.onCheatClicked, this));
			else this.$el.find('a, button').on('click', _.bind(this.onCheatClicked, this));

			// keep drawer item to left of PLP, resources, close button etc
			this.listenTo(Adapt, 'pageView:postRender menuView:postRender', this.onContentRendered);
		},

		render:function() {
			console.log('CheatNavigationView::render');
			
	        $('.navigation-inner').append(this.$el);
			return this;
		},

		deferredRender:function() {
			_.defer(_.bind(this.render, this));
		},

		onContentRendered:function(view) {
			if (view.model.get('_id') == Adapt.location._currentId) {
				this.stopListening('change:_isReady');
				this.listenToOnce(view.model, 'change:_isReady', this.deferredRender);
			}
		},

		onCheatClicked:function(event) {
			if(event && event.preventDefault) event.preventDefault();
            Adapt.drawer.triggerCustomView(new CheatView().$el, false);
		}
	});

	Adapt.once('app:dataReady', function() {
		var exts = Adapt.config.get("_extensions");
		var config = (exts) ? exts._cheat : Adapt.config.get("_cheat");
		if (!config || !config._isEnabled) return;

		Adapt.cheat = new CheatModel();
	});

	Adapt.once('adapt:initialize', function() {
		var exts = Adapt.config.get("_extensions");
		var config = (exts) ? exts._cheat : Adapt.config.get("_cheat");
		if (!config || !config._isEnabled) return;
		
		new CheatNavigationView();
	});
});
