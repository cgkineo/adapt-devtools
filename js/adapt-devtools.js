/*
* adapt-devtools
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Chris Steele <chris.steele@kineo.com>, Oliver Foster <oliver.foster@kineo.com>
*/

define([
  'core/js/adapt',
  'core/js/data',
  'core/js/wait',
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
], function(Adapt, data, wait, AdaptModel, DevtoolsModel, PassHalfFail, ToggleBanking, CourseMap) {

  let navigationView;

  const DevtoolsView = Backbone.View.extend({

    className: 'devtools',

    events: {
      'click .end-trickle': 'onEndTrickle',
      'change .hinting input': 'onToggleHinting',
      'change .banking input': 'onToggleBanking',
      'change .feedback input': 'onToggleFeedback',
      'change .auto-correct input': 'onToggleAutoCorrect',
      'change .alt-text input': 'onToggleAltText',
      'click .unlock': 'onUnlock',
      'click .open-map': 'onOpenMap',
      'click .open-spoor-log': 'onOpenSpoorLog',
      'click .complete-page': 'onCompletePage',
      'click .complete-menu': 'onCompleteMenu',
      'click .pass': 'onPassHalfFail',
      'click .half': 'onPassHalfFail',
      'click .fail': 'onPassHalfFail',
      'change .trace-focus input': 'onToggleTraceFocus'
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
      const data = Adapt.devtools.toJSON();
      const template = Handlebars.templates.devtools;
      this.$el.html(template(data));
      return this;
    },

    /*************************************************/
    /** ******************* UNLOCK *******************/
    /*************************************************/

    _checkUnlockVisibility: function() {
      // check if function available and not already activated
      if (!Adapt.devtools.get('_unlockAvailable') || Adapt.devtools.get('_unlocked')) this.$('.unlock').addClass('u-display-none');
      else this.$('.unlock').toggleClass('u-display-none', !this._checkForLocks());
    },

    _checkForLocks: function() {
      if (typeof AdaptModel.prototype.checkLocking !== 'function') return Adapt.location._contentType === 'menu';

      const hasLock = function(model) { return model.has('_lockType'); };

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
    /** ******************** MAP *********************/
    /*************************************************/

    onOpenMap: function() {
      CourseMap.open();
      Adapt.trigger('drawer:closeDrawer');
    },

    /*************************************************/
    /** ******************* SPOOR ********************/
    /*************************************************/

    _checkSpoorLogVisibility: function() {
      const spoorInstalled = require.defined('extensions/adapt-contrib-spoor/js/adapt-contrib-spoor');
      if (spoorInstalled) return;
      this.$('.open-spoor-log').addClass('is-disabled').attr('disabled', 'disabled');
    },

    onOpenSpoorLog: function() {
      Adapt.trigger('drawer:closeDrawer');
      if (Adapt.spoor) {
        Adapt.spoor.scorm.showDebugWindow();
        return;
      }
      require('extensions/adapt-contrib-spoor/js/scorm').showDebugWindow();
    },

    /*************************************************/
    /** ****************** TRICKLE *******************/
    /*************************************************/

    _checkTrickleEndVisibility: function() {
      this.$('.end-trickle').toggleClass('u-display-none', !Adapt.devtools.get('_trickleEnabled'));
    },

    onEndTrickle: function() {
      Adapt.devtools.set('_trickleEnabled', false);
      this._checkTrickleEndVisibility();
    },

    /*************************************************/
    /** ************* QUESTION BANKING ***************/
    /*************************************************/

    _checkBankingVisibility: function() {
      if (!Adapt.devtools.get('_toggleFeedbackAvailable')) {
        this.$('.banking').addClass('u-display-none');
        return;
      }

      const bankedAssessments = ToggleBanking.getBankedAssessmentsInCurrentPage();
      const isBankingEnabled = function(m) { return m.get('_assessment')._banks._isEnabled; };

      if (bankedAssessments.length > 0) {
        this.$('.banking').removeClass('u-display-none');
        this.$('.banking label').toggleClass('is-selected', _.some(bankedAssessments, isBankingEnabled));
        return;
      }
      this.$('.banking').addClass('u-display-none');
    },

    onToggleBanking: function() {
      ToggleBanking.toggle();
      this._checkBankingVisibility();
    },

    /*************************************************/
    /** ********* QUESTION FEEDBACK (TUTOR) **********/
    /*************************************************/

    _checkFeedbackVisibility: function() {
      if (Adapt.devtools.get('_toggleFeedbackAvailable')) {
        this.$('.feedback').removeClass('u-display-none');
        this.$('.feedback label').toggleClass('is-selected', Adapt.devtools.get('_feedbackEnabled'));
        return;
      }
      this.$('.feedback').addClass('u-display-none');
    },

    onToggleFeedback: function() {
      Adapt.devtools.toggleFeedback();
      this._checkFeedbackVisibility();
    },

    /*************************************************/
    /** ************* QUESTION HINTING ***************/
    /*************************************************/

    _checkHintingVisibility: function() {
      if (Adapt.devtools.get('_hintingAvailable')) {
        this.$('.hinting').removeClass('u-display-none');
        this.$('.hinting label').toggleClass('is-selected', Adapt.devtools.get('_hintingEnabled'));
        return;
      }
      this.$('.hinting').addClass('u-display-none');
    },

    onToggleHinting: function() {
      Adapt.devtools.toggleHinting();
      this._checkHintingVisibility();
    },

    /*************************************************/
    /** *************** AUTO CORRECT *****************/
    /*************************************************/

    _checkAutoCorrectVisibility: function() {
      if (Adapt.devtools.get('_autoCorrectAvailable')) {
        this.$('.is-toggle.auto-correct').removeClass('u-display-none');
        this.$('.is-toggle.auto-correct label').toggleClass('is-selected', Adapt.devtools.get('_autoCorrectEnabled'));
        this.$('.is-tip.auto-correct').toggleClass('u-display-none', Adapt.devtools.get('_autoCorrectEnabled'));
        return;
      }
      this.$('.auto-correct').addClass('u-display-none');
    },

    onToggleAutoCorrect: function() {
      Adapt.devtools.toggleAutoCorrect();
      this._checkAutoCorrectVisibility();
    },

    /*************************************************/
    /** ***************** ALT TEXT *******************/
    /*************************************************/

    _checkAltTextVisibility: function() {
      if (Adapt.devtools.get('_altTextAvailable')) {
        this.$('.is-toggle.alt-text').removeClass('u-display-none');
        this.$('.is-toggle.alt-text label').toggleClass('is-selected', Adapt.devtools.get('_altTextEnabled'));
        this.$('.is-tip.alt-text').toggleClass('u-display-none', Adapt.devtools.get('_altTextEnabled'));
        return;
      }
      this.$('.alt-text').addClass('u-display-none');
    },

    onToggleAltText: function() {
      Adapt.devtools.toggleAltText();
      this._checkAltTextVisibility();
    },

    /*************************************************/
    /** *************** COMPLETE PAGE ****************/
    /*************************************************/

    _checkCompletePageVisibility: function() {
      const currentModel = Adapt.findById(Adapt.location._currentId);

      if (currentModel.get('_type') !== 'page') {
        this.$('.complete-page').addClass('u-display-none');
        return;
      }

      const incomplete = currentModel.findDescendantModels('components', { where: { _isInteractionComplete: false } });

      this.$('.complete-page').toggleClass('u-display-none', incomplete.length === 0);

    },

    onCompletePage: function(e) {
      const currentModel = Adapt.findById(Adapt.location._currentId);

      if (Adapt.devtools.get('_trickleEnabled')) Adapt.trigger('trickle:kill');

      const incomplete = currentModel.findDescendantModels('components', { where: { _isInteractionComplete: false } });

      incomplete.forEach(function(component) {
        if (component.get('_isQuestionType')) {
          component.set({
            _isCorrect: true,
            _isSubmitted: true,
            _score: 1
          });
          component.set('_attemptsLeft', Math.max(0, component.set('_attempts') - 1));
        }

        component.set('_isComplete', true);
        component.set(currentModel.has('_isInteractionsComplete') ? '_isInteractionsComplete' : '_isInteractionComplete', true);
      });

      Adapt.trigger('drawer:closeDrawer');
    },

    /*************************************************/
    /** *************** COMPLETE MENU ****************/
    /*************************************************/

    _checkCompleteMenuVisibility: function() {
      const currentModel = Adapt.findById(Adapt.location._currentId);

      if (currentModel.get('_type') !== 'menu' && currentModel.get('_type') !== 'course') {
        this.$('.complete-menu').addClass('u-display-none');
        return;
      }

      const incomplete = currentModel.findDescendantModels('components', { where: { _isComplete: false } });

      this.$('.complete-menu').toggleClass('u-display-none', incomplete.length === 0);

    },

    onCompleteMenu: function(e) {
      const currentModel = Adapt.findById(Adapt.location._currentId);

      if (Adapt.devtools.get('_trickleEnabled')) Adapt.trigger('trickle:kill');

      const incomplete = currentModel.findDescendantModels('components', { where: { _isComplete: false } });
      _.invoke(incomplete, 'set', '_isComplete', true);

      Adapt.trigger('drawer:closeDrawer');
    },

    /************************************************************/
    /** ***** Similar to original adapt-cheat functionality *****/
    /************************************************************/

    _checkPassHalfFailVisibility: function() {
      const currentModel = Adapt.findById(Adapt.location._currentId);

      if (currentModel.get('_type') !== 'page') {
        this.$('.pass, .half, .fail').addClass('u-display-none');
        return;
      }

      const unanswered = currentModel.findDescendantModels('components', { where: { _isQuestionType: true, _isSubmitted: false } });

      if (unanswered.length === 0) this.$('.tip.pass-half-fail').html('');
      else this.$('.is-tip.pass-half-fail').html('With the ' + unanswered.length + ' unanswered question(s) in this page do the following:');

      this.$('.pass, .half, .fail').toggleClass('u-display-none', unanswered.length === 0);

    },

    onPassHalfFail: function(e) {
      if (Adapt.devtools.get('_trickleEnabled')) Adapt.trigger('trickle:kill');

      // potentially large operation so show some feedback
      $('.js-loading').show();

      const tutorEnabled = Adapt.devtools.get('_feedbackEnabled');

      if (tutorEnabled) Adapt.devtools.set('_feedbackEnabled', false);

      if ($(e.currentTarget).hasClass('pass')) PassHalfFail.pass(this.onPassHalfFailComplete.bind(this, tutorEnabled));
      else if ($(e.currentTarget).hasClass('half')) PassHalfFail.half(this.onPassHalfFailComplete.bind(this, tutorEnabled));
      else PassHalfFail.fail(this.onPassHalfFailComplete.bind(this, tutorEnabled));

      Adapt.trigger('drawer:closeDrawer');
    },

    onPassHalfFailComplete: function(tutorEnabled) {
      console.log('onPassHalfFailComplete');

      if (tutorEnabled) Adapt.devtools.set('_feedbackEnabled', true);

      $('.js-loading').hide();
    },

    /*************************************************/
    /** ***************** EXTENDED *******************/
    /*************************************************/

    _checkTraceFocusVisibility: function() {
      if (Adapt.devtools.get('_traceFocusAvailable')) {
        this.$('.is-toggle.trace-focus').removeClass('u-display-none');
        this.$('.is-toggle.trace-focus label').toggleClass('is-selected', Adapt.devtools.get('_traceFocusEnabled'));
        return;
      }
      this.$('.trace-focus').addClass('u-display-none');
    },

    onToggleTraceFocus: function() {
      Adapt.devtools.toggleTraceFocus();
      this._checkTraceFocusVisibility();
    }
  });

  const DevtoolsNavigationView = Backbone.View.extend({

    initialize: function() {
      const template = Handlebars.templates.devtoolsNavigation;

      this.$el = $(template());

      $('html').addClass('devtools-enabled').toggleClass('devtools-extended', Adapt.devtools.get('_extended'));

      if (this.$el.is('a') || this.$el.is('button')) this.$el.on('click', this.onDevtoolsClicked.bind(this));
      else this.$el.find('a, button').on('click', this.onDevtoolsClicked.bind(this));

      // keep drawer item to left of PLP, resources, close button etc
      this.listenTo(Adapt, 'pageView:postRender menuView:postRender', this.onContentRendered);
      // ensure render occurs at least once (_isReady will not change to true on menus that exclude content objects)
      this.listenToOnce(Adapt, 'pageView:postRender menuView:postRender', this.render);
    },

    render: function() {
      $('.nav__inner').append(this.$el);
      return this;
    },

    remove: function() {
      this.$el.remove();
      this.stopListening();
      return this;
    },

    deferredRender: function() {
      _.defer(this.render.bind(this));
    },

    onContentRendered: function(view) {
      if (view.model.get('_id') === Adapt.location._currentId) {
        this.stopListening(view.model, 'change:_isReady', this.deferredRender);
        this.listenToOnce(view.model, 'change:_isReady', this.deferredRender);
      }
    },

    onDevtoolsClicked: function(event) {
      if (event && event.preventDefault) event.preventDefault();
      Adapt.drawer.triggerCustomView(new DevtoolsView().$el, false);
    }

  });

  Adapt.once('courseModel:dataLoaded', function() {
    Adapt.devtools = new DevtoolsModel();
  });

  function initNavigationView() {
    if (!Adapt.devtools.get('_isEnabled')) return;

    if (navigationView) navigationView.remove();

    navigationView = new DevtoolsNavigationView();
  }

  Adapt.once('adapt:initialize devtools:enable', function() {
    initNavigationView();
    Adapt.on('app:languageChanged', initNavigationView);
  });

  data.on('loaded', async () => {
    const isDescendant = (model, ancestor) => {
      let parent;
      while (parent = data._byAdaptID[model.get('_parentId')]) {
        if (parent === ancestor) {
          return true;
        }
        model = parent;
      }
      return false;
    }

    const removeDescendants = (ancestor) => {
      const prunable = [];
      for (const id in data._byAdaptID) {
        const model = data._byAdaptID[id];
        if (isDescendant(model, ancestor)) {
          prunable.push(model)
        }
      }
      prunable.forEach(model => data.remove(model));
    }

    const removeModel = (id) => {
      const model = data._byAdaptID[id];
      removeDescendants(model);
      data.remove(model);
    }

    const processConfig = (cfg) => {
      if (!cfg || cfg._isEnabled === false) return;

      if (Array.isArray(cfg._modelsToRemove)) {
        cfg._modelsToRemove.forEach(id => removeModel(id));

        // things like AdaptSubsetCollection instances need to update
        data.trigger('reset');
      }
    }

    wait.begin();

    try {
      const devConfig = await data.getJSON('dev.json');
      processConfig(devConfig);
    } catch (err) {
    } finally {
      wait.end();
    }
  })

});
