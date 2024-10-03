import Adapt from 'core/js/adapt';
import data from 'core/js/data';
import drawer from 'core/js/drawer';
import wait from 'core/js/wait';
import logging from 'core/js/logging';
import location from 'core/js/location';
import AdaptModel from 'core/js/models/adaptModel';
import DevtoolsModel from './devtools-model';
import PassHalfFail from './pass-half-fail';
import ToggleBanking from './toggle-banking';
import CourseMap from './map';
import './auto-answer';
import './utils';
import './end-trickle';
import './hinting';
import './toggle-feedback';
import './toggle-alt-text';
import './unlock';
import './enable';
import './toggle-trace-focus';
import './toggle-completion';

let navigationView;

class DevtoolsView extends Backbone.View {

  className () {
    return 'devtools';
  }

  events () {
    return {
      'click .end-trickle': 'onEndTrickle',
      'change .hinting input': 'onToggleHinting',
      'change .banking input': 'onToggleBanking',
      'change .feedback input': 'onToggleFeedback',
      'change .auto-correct input': 'onToggleAutoCorrect',
      'change .alt-text input': 'onToggleAltText',
      'click .unlock': 'onUnlock',
      'click .unlock-menu': 'onUnlockMenu',
      'click .open-map': 'onOpenMap',
      'click .open-spoor-log': 'onOpenSpoorLog',
      'click .complete-page': 'onCompletePage',
      'click .complete-menu': 'onCompleteMenu',
      'click .pass': 'onPassHalfFail',
      'click .half': 'onPassHalfFail',
      'click .fail': 'onPassHalfFail',
      'change .trace-focus input': 'onToggleTraceFocus'
    };
  }

  initialize () {
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
  }

  render () {
    const data = Adapt.devtools.toJSON();
    const template = Handlebars.templates.devtools;
    this.$el.html(template(data));
    return this;
  }

  /*************************************************/
  /** ******************* UNLOCK *******************/
  /*************************************************/

  _checkUnlockVisibility () {
    // check if function available and not already activated
    if (!Adapt.devtools.get('_unlockAvailable')) {
      return this.$('.unlock, .unlock-menu').addClass('u-display-none');
    }

    if (Adapt.devtools.get('_unlocked')) this.$('.unlock').addClass('u-display-none');
    else this.$('.unlock').toggleClass('u-display-none', !this._checkForLocks());

    if (Adapt.devtools.get('_unlockedMenu')) this.$('.unlock-menu').addClass('u-display-none');
    else this.$('.unlock-menu').toggleClass('u-display-none', !this._checkForMenuLocks());
  }

  _checkForLocks () {
    const hasCheckLocking = (typeof AdaptModel.prototype.checkLocking !== 'function');
    if (hasCheckLocking) return location._contentType === 'menu';

    const hasLock = function(model) { return model.has('_lockType'); };

    if (hasLock(Adapt.course)) return true;
    if (Adapt.contentObjects.some(hasLock)) return true;
    if (Adapt.articles.some(hasLock)) return true;
    if (Adapt.blocks.some(hasLock)) return true;

    return false;
  }

  _checkForMenuLocks () {
    const hasCheckLocking = (typeof AdaptModel.prototype.checkLocking !== 'function');
    if (hasCheckLocking) return location._contentType === 'menu';

    const hasLock = function(model) { return model.has('_lockType'); };

    if (hasLock(Adapt.course)) return true;
    if (Adapt.contentObjects.some(hasLock)) return true;

    return false;
  }

  onUnlock () {
    Adapt.devtools.set('_unlocked', true);
    this._checkUnlockVisibility();
  }

  onUnlockMenu () {
    Adapt.devtools.set('_unlockedMenu', true);
    this._checkUnlockVisibility();
  }

  /*************************************************/
  /** ******************** MAP *********************/
  /*************************************************/

  onOpenMap () {
    CourseMap.open();
    Adapt.trigger('drawer:closeDrawer');
  }

  /*************************************************/
  /** ******************* SPOOR ********************/
  /*************************************************/

  _checkSpoorLogVisibility () {
    const spoorInstalled = require.defined('extensions/adapt-contrib-spoor/js/adapt-contrib-spoor');
    if (spoorInstalled) return;
    this.$('.open-spoor-log').addClass('is-disabled').attr('disabled', 'disabled');
  }

  onOpenSpoorLog () {
    Adapt.trigger('drawer:closeDrawer');
    if (Adapt.spoor) {
      Adapt.spoor.scorm.showDebugWindow();
      return;
    }
    require('extensions/adapt-contrib-spoor/js/scorm')?.showDebugWindow();
  }

  /*************************************************/
  /** ****************** TRICKLE *******************/
  /*************************************************/

  _checkTrickleEndVisibility () {
    this.$('.end-trickle').toggleClass('u-display-none', !Adapt.devtools.get('_trickleEnabled'));
  }

  onEndTrickle () {
    Adapt.devtools.set('_trickleEnabled', false);
    this._checkTrickleEndVisibility();
  }

  /*************************************************/
  /** ************* QUESTION BANKING ***************/
  /*************************************************/

  _checkBankingVisibility () {
    if (!Adapt.devtools.get('_toggleFeedbackAvailable')) {
      this.$('.banking').addClass('u-display-none');
      return;
    }

    const bankedAssessments = ToggleBanking.getBankedAssessmentsInCurrentPage();
    const isBankingEnabled = m => m.get('_assessment')._banks._isEnabled;

    const hasBankedAssessments = (bankedAssessments.length > 0);
    if (hasBankedAssessments) {
      this.$('.banking').removeClass('u-display-none');
      this.$('.banking label').toggleClass('is-selected', bankedAssessments.some(isBankingEnabled));
      return;
    }
    this.$('.banking').addClass('u-display-none');
  }

  onToggleBanking () {
    ToggleBanking.toggle();
    this._checkBankingVisibility();
  }

  /*************************************************/
  /** ********* QUESTION FEEDBACK (TUTOR) **********/
  /*************************************************/

  _checkFeedbackVisibility () {
    if (Adapt.devtools.get('_toggleFeedbackAvailable')) {
      this.$('.feedback').removeClass('u-display-none');
      this.$('.feedback label').toggleClass('is-selected', Adapt.devtools.get('_feedbackEnabled'));
      return;
    }
    this.$('.feedback').addClass('u-display-none');
  }

  onToggleFeedback () {
    Adapt.devtools.toggleFeedback();
    this._checkFeedbackVisibility();
  }

  /*************************************************/
  /** ************* QUESTION HINTING ***************/
  /*************************************************/

  _checkHintingVisibility () {
    if (Adapt.devtools.get('_hintingAvailable')) {
      this.$('.hinting').removeClass('u-display-none');
      this.$('.hinting label').toggleClass('is-selected', Adapt.devtools.get('_hintingEnabled'));
      return;
    }
    this.$('.hinting').addClass('u-display-none');
  }

  onToggleHinting () {
    Adapt.devtools.toggleHinting();
    this._checkHintingVisibility();
  }

  /*************************************************/
  /** *************** AUTO CORRECT *****************/
  /*************************************************/

  _checkAutoCorrectVisibility () {
    if (Adapt.devtools.get('_autoCorrectAvailable')) {
      this.$('.is-toggle.auto-correct').removeClass('u-display-none');
      this.$('.is-toggle.auto-correct label').toggleClass('is-selected', Adapt.devtools.get('_autoCorrectEnabled'));
      this.$('.is-tip.auto-correct').toggleClass('u-display-none', Adapt.devtools.get('_autoCorrectEnabled'));
      return;
    }
    this.$('.auto-correct').addClass('u-display-none');
  }

  onToggleAutoCorrect () {
    Adapt.devtools.toggleAutoCorrect();
    this._checkAutoCorrectVisibility();
  }

  /*************************************************/
  /** ***************** ALT TEXT *******************/
  /*************************************************/

  _checkAltTextVisibility () {
    if (Adapt.devtools.get('_altTextAvailable')) {
      this.$('.is-toggle.alt-text').removeClass('u-display-none');
      this.$('.is-toggle.alt-text label').toggleClass('is-selected', Adapt.devtools.get('_altTextEnabled'));
      this.$('.is-tip.alt-text').toggleClass('u-display-none', Adapt.devtools.get('_altTextEnabled'));
      return;
    }
    this.$('.alt-text').addClass('u-display-none');
  }

  onToggleAltText () {
    Adapt.devtools.toggleAltText();
    this._checkAltTextVisibility();
  }

  /*************************************************/
  /** *************** COMPLETE PAGE ****************/
  /*************************************************/

  _checkCompletePageVisibility () {
    const currentModel = data.findById(location._currentId);
    if (currentModel.get('_type') !== 'page') {
      this.$('.complete-page').addClass('u-display-none');
      return;
    }
    const incomplete = currentModel.findDescendantModels('components', { where: { _isInteractionComplete: false } });
    this.$('.complete-page').toggleClass('u-display-none', incomplete.length === 0);
  }

  onCompletePage (e) {
    const currentModel = data.findById(location._currentId);
    if (Adapt.devtools.get('_trickleEnabled')) Adapt.trigger('trickle:kill');
    const incomplete = currentModel.findDescendantModels('components', { where: { _isInteractionComplete: false } });
    incomplete.forEach(component => {
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
  }

  /*************************************************/
  /** *************** COMPLETE MENU ****************/
  /*************************************************/

  _checkCompleteMenuVisibility () {
    const currentModel = data.findById(location._currentId);
    if (currentModel.get('_type') !== 'menu' && currentModel.get('_type') !== 'course') {
      this.$('.complete-menu').addClass('u-display-none');
      return;
    }
    const incomplete = currentModel.findDescendantModels('components', { where: { _isComplete: false } });
    this.$('.complete-menu').toggleClass('u-display-none', incomplete.length === 0);
  }

  onCompleteMenu (e) {
    const currentModel = data.findById(location._currentId);
    if (Adapt.devtools.get('_trickleEnabled')) Adapt.trigger('trickle:kill');
    const incomplete = currentModel.findDescendantModels('components', { where: { _isComplete: false } });
    _.invoke(incomplete, 'set', '_isComplete', true);
    Adapt.trigger('drawer:closeDrawer');
  }

  /************************************************************/
  /** ***** Similar to original adapt-cheat functionality *****/
  /************************************************************/

  _checkPassHalfFailVisibility () {
    const currentModel = data.findById(location._currentId);
    if (currentModel.get('_type') !== 'page') {
      this.$('.pass, .half, .fail').addClass('u-display-none');
      return;
    }
    const unanswered = currentModel.findDescendantModels('components', { where: { _isQuestionType: true, _isSubmitted: false } });
    if (unanswered.length === 0) this.$('.tip.pass-half-fail').html('');
    else this.$('.is-tip.pass-half-fail').html('With the ' + unanswered.length + ' unanswered question(s) in this page do the following:');
    this.$('.pass, .half, .fail').toggleClass('u-display-none', unanswered.length === 0);

  }

  onPassHalfFail (e) {
    if (Adapt.devtools.get('_trickleEnabled')) Adapt.trigger('trickle:kill');
    // potentially large operation so show some feedback
    $('.js-loading').show();
    const tutorEnabled = Adapt.devtools.get('_feedbackEnabled');
    if (tutorEnabled) Adapt.devtools.set('_feedbackEnabled', false);
    if ($(e.currentTarget).hasClass('pass')) PassHalfFail.pass(this.onPassHalfFailComplete.bind(this, tutorEnabled));
    else if ($(e.currentTarget).hasClass('half')) PassHalfFail.half(this.onPassHalfFailComplete.bind(this, tutorEnabled));
    else PassHalfFail.fail(this.onPassHalfFailComplete.bind(this, tutorEnabled));
    Adapt.trigger('drawer:closeDrawer');
  }

  onPassHalfFailComplete (tutorEnabled) {
    logging.debug('onPassHalfFailComplete');
    if (tutorEnabled) Adapt.devtools.set('_feedbackEnabled', true);
    $('.js-loading').hide();
  }

  /*************************************************/
  /** ***************** EXTENDED *******************/
  /*************************************************/

  _checkTraceFocusVisibility () {
    if (Adapt.devtools.get('_traceFocusAvailable')) {
      this.$('.is-toggle.trace-focus').removeClass('u-display-none');
      this.$('.is-toggle.trace-focus label').toggleClass('is-selected', Adapt.devtools.get('_traceFocusEnabled'));
      return;
    }
    this.$('.trace-focus').addClass('u-display-none');
  }

  onToggleTraceFocus () {
    Adapt.devtools.toggleTraceFocus();
    this._checkTraceFocusVisibility();
  }
}

class DevtoolsNavigationView extends Backbone.View {

  initialize () {
    this.render = this.render.bind(this);
    const template = Handlebars.templates.devtoolsNavigation;
    this.$el = $(template());
    $('html').addClass('devtools-enabled').toggleClass('devtools-extended', Adapt.devtools.get('_extended'));
    if (this.$el.is('a') || this.$el.is('button')) this.$el.on('click', this.onDevtoolsClicked.bind(this));
    else this.$el.find('a, button').on('click', this.onDevtoolsClicked.bind(this));
    this.listenTo(Adapt, 'pageView:postRender menuView:postRender', this.onContentRendered);
    // ensure render occurs at least once (_isReady will not change to true on menus that exclude content objects)
    this.listenToOnce(Adapt, 'pageView:postRender menuView:postRender', this.render);
  }

  render () {
    $('.nav__inner').append(this.$el);
    return this;
  }

  remove () {
    this.$el.remove();
    this.stopListening();
    return this;
  }

  deferredRender () {
    _.defer(this.render);
  }

  onContentRendered (view) {
    if (view.model.get('_id') === location._currentId) {
      this.stopListening(view.model, 'change:_isReady', this.deferredRender);
      this.listenToOnce(view.model, 'change:_isReady', this.deferredRender);
    }
  }

  onDevtoolsClicked (event) {
    if (event && event.preventDefault) event.preventDefault();
    drawer.openCustomView(new DevtoolsView().$el, false);
  }

}

Adapt.once('courseModel:dataLoaded', () => {
  Adapt.devtools = new DevtoolsModel();
});

function initNavigationView() {
  if (!Adapt.devtools.get('_isEnabled')) return;
  if (navigationView) navigationView.remove();
  navigationView = new DevtoolsNavigationView();
}

Adapt.once('adapt:initialize devtools:enable', () => {
  initNavigationView();
  Adapt.on('app:languageChanged', initNavigationView);
});

data.on('loaded', async () => {
  if (!Adapt.devtools.get('_debugFile')) return;

  const isDescendant = (model, ancestor) => {
    let parent;
    while ((parent = data._byAdaptID[model.get('_parentId')])) {
      if (parent === ancestor) return true;
      model = parent;
    }
    return false;
  };

  const removeDescendants = (ancestor) => {
    const prunable = [];
    for (const id in data._byAdaptID) {
      const model = data._byAdaptID[id];
      if (!isDescendant(model, ancestor)) continue;
      prunable.push(model);
    }
    prunable.forEach(model => data.remove(model));
  };

  const removeModel = (id) => {
    const model = data._byAdaptID[id];
    removeDescendants(model);
    data.remove(model);
  };

  const processConfig = (cfg) => {
    if (!cfg || cfg._isEnabled === false) return;
    if (Array.isArray(cfg._modelsToRemove)) {
      cfg._modelsToRemove.forEach(id => removeModel(id));
      // things like AdaptSubsetCollection instances need to update
      data.trigger('reset');
    }
  };

  wait.begin();

  try {
    const debugFile = Adapt.devtools.get('_debugFile');
    const devConfig = await data.getJSON(debugFile);
    processConfig(devConfig);
  } catch (err) {
    logging.warn(`Dev Tools error loading '_debugFile'. ${err}`);
  } finally {
    wait.end();
  }
});
