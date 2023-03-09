import Adapt from 'core/js/adapt';
import AutoAnswer from './auto-answer';

class PassHalfFail extends Backbone.Controller {

  initialize () {
    Adapt.on('app:dataReady devtools:enable', this.onEnabled);
  }

  onEnabled() {
    if (!Adapt.devtools.get('_isEnabled')) return;
    this.syncIterations = 1;
    this.mouseTarget = null;
    _.bindAll(this, 'onMouseDown', 'onMouseUp', 'onKeypress', 'onPassHalfFailComplete');
    this._questionViews = [];
    this._currentPageId = null;
    this.listenTo(Adapt, 'pageView:preRender', this.onPagePreRender);
    this.listenTo(Adapt, 'remove', this.onRemove);
    $(window).off('keypress', this.onKeypress);
    $(window).off('mousedown', this.onMouseDown);
    $(window).off('mouseup', this.onMouseUp);
    $(window).on('keypress', this.onKeypress);
    $(window).on('mousedown', this.onMouseDown);
    $(window).on('mouseup', this.onMouseUp);
  }

  _completeNonQuestions () {
    const currentModel = Adapt.findById(Adapt.location._currentId);
    const nonQuestions = _.filter(currentModel.findDescendantModels('components'), function(m) { return m.get('_isQuestionType') !== true; });

    _.each(nonQuestions, function(item) {
      item.set('_isComplete', true);
      item.set('_isInteractionComplete', true);
    });
  }

  pass (callback) {
    let i = 0; const qs = this._questionViews; const len = qs.length;

    // this._completeNonQuestions();

    // async to avoid locking up the interface
    function step() {
      for (let j = 0, count = Math.min(PassHalfFail.syncIterations, len - i); j < count; i++, j++) {
        AutoAnswer.answer(qs[i]);
        if (!qs[i].model.get('_isSubmitted')) qs[i].$('.js-btn-action').trigger('click');
      }
      i === len ? callback() : setTimeout(step);
    }

    step();
  }

  half (callback) {
    const notSubmitted = function(view) { return !view.model.get('_isSubmitted'); };
    const qs = _.shuffle(_.filter(this._questionViews, notSubmitted));
    let i = 0; const len = qs.length;

    // this._completeNonQuestions();

    // async to avoid locking up the interface
    function step() {
      for (let j = 0, count = Math.min(PassHalfFail.syncIterations, len - i); j < count; i++, j++) {
        AutoAnswer.answer(qs[i], i % 2 === 0);
        if (!qs[i].model.get('_isSubmitted')) qs[i].$('.js-btn-action').trigger('click');
      }
      i === len ? callback() : setTimeout(step);
    }

    step();
  }

  fail (callback) {
    let i = 0; const qs = this._questionViews; const len = qs.length;

    // this._completeNonQuestions();

    // async to avoid locking up the interface
    function step() {
      for (let j = 0, count = Math.min(PassHalfFail.syncIterations, len - i); j < count; i++, j++) {
        AutoAnswer.answer(qs[i], true);
        if (!qs[i].model.get('_isSubmitted')) qs[i].$('.js-btn-action').trigger('click');
      }
      i === len ? callback() : setTimeout(step);
    }

    step();
  }

  onPagePreRender (view) {
    this._currentPageId = view.model.get('_id');
    this.listenTo(Adapt, 'componentView:postRender', this.onComponentRendered);
  }

  onRemove () {
    this.stopListening(Adapt, 'componentView:postRender', this.onComponentRendered);
    this._questionViews = [];
  }

  onComponentRendered (view) {
    // check component is part of current page
    if (view.model.has('_parentId') && view.model.findAncestor('contentObjects').get('_id') === this._currentPageId) {
      if (view.model.get('_isQuestionType')) {
        this._questionViews.push(view);
      }
    }
  }

  onMouseDown (e) {
    if (e.which === 1) this.mouseTarget = e.target;
  }

  onMouseUp (e) {
    if (e.which === 1) this.mouseTarget = null;
  }

  onKeypress (e) {
    const char = String.fromCharCode(e.which).toLowerCase();

    const perform = function(type) {
      if (Adapt.devtools.get('_trickleEnabled')) Adapt.trigger('trickle:kill');

      const tutorEnabled = Adapt.devtools.get('_feedbackEnabled');

      if (tutorEnabled) Adapt.devtools.set('_feedbackEnabled', false);

      if (type === 'pass') this.pass(_.partial(this.onPassHalfFailComplete, tutorEnabled));
      else if (type === 'half') this.half(_.partial(this.onPassHalfFailComplete, tutorEnabled));
      else this.fail(_.partial(this.onPassHalfFailComplete, tutorEnabled));

      Adapt.trigger('drawer:closeDrawer');
    }.bind(this);

    if (this.mouseTarget) {
      switch (char) {
        case 'p': return perform('pass');
        case 'h': return perform('half');
        case 'f': return perform('fail');
      }
    } else if ($('.drawer .devtools').is(':visible')) {
      switch (char) {
        case 'p': return perform('pass');
        case 'h': return perform('half');
        case 'f': return perform('fail');
      }
    }
  }

  onPassHalfFailComplete (tutorEnabled) {
    console.log('onPassHalfFailComplete');

    if (tutorEnabled) Adapt.devtools.set('_feedbackEnabled', true);
  }
}

export default new PassHalfFail();
