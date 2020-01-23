define(function(require) {

  var Adapt = require('coreJS/adapt');
  var AutoAnswer = require('./auto-answer');

  var PassHalfFail = _.extend({
    syncIterations:1,

    initialize:function() {
      this._questionViews = [];
      this._currentPageId = null;
      this.listenTo(Adapt, 'pageView:preRender', this.onPagePreRender);
      this.listenTo(Adapt, 'remove', this.onRemove);
    },

    _completeNonQuestions:function() {
      var currentModel = Adapt.findById(Adapt.location._currentId);
      var nonQuestions = _.filter(currentModel.findDescendantModels("components"), function(m) {return m.get('_isQuestionType') !== true;});

      _.each(nonQuestions, function(item) {
        item.set("_isComplete", true);
        item.set("_isInteractionComplete", true);
      });
    },

    pass:function(callback) {
      var i = 0, qs = this._questionViews, len = qs.length;

      //this._completeNonQuestions();

      // async to avoid locking up the interface
      function step() {
        for (var j=0, count=Math.min(PassHalfFail.syncIterations, len-i); j < count; i++, j++) {
          AutoAnswer.answer(qs[i]);
          if (!qs[i].model.get('_isSubmitted')) qs[i].$('.js-btn-action').trigger('click');
        }
        i == len ? callback() : setTimeout(step);
      }

      step();
    },

    half:function(callback) {
      var notSubmitted = function(view) {return !view.model.get('_isSubmitted')};
      var qs = _.shuffle(_.filter(this._questionViews, notSubmitted));
      var i = 0, len = qs.length;

      //this._completeNonQuestions();

      // async to avoid locking up the interface
      function step() {
        for (var j=0, count=Math.min(PassHalfFail.syncIterations, len-i); j < count; i++, j++) {
          AutoAnswer.answer(qs[i], i % 2 == 0);
          if (!qs[i].model.get('_isSubmitted')) qs[i].$('.js-btn-action').trigger('click');
        }
        i == len ? callback() : setTimeout(step);
      }

      step();
    },

    fail:function(callback) {
      var i = 0, qs = this._questionViews, len = qs.length;

      //this._completeNonQuestions();

      // async to avoid locking up the interface
      function step() {
        for (var j=0, count=Math.min(PassHalfFail.syncIterations, len-i); j < count; i++, j++) {
          AutoAnswer.answer(qs[i], true);
          if (!qs[i].model.get('_isSubmitted')) qs[i].$('.js-btn-action').trigger('click');
        }
        i == len ? callback() : setTimeout(step);
      }

      step();
    },

    onPagePreRender:function(view) {
      this._currentPageId = view.model.get('_id');
      this.listenTo(Adapt, 'componentView:postRender', this.onComponentRendered);
    },

    onRemove:function() {
      this.stopListening(Adapt, 'componentView:postRender', this.onComponentRendered);
      this._questionViews = [];
    },

    onComponentRendered:function(view) {
      // check component is part of current page
      if (view.model.has('_parentId') && view.model.findAncestor('contentObjects').get('_id') == this._currentPageId) {
        if (view.model.get('_isQuestionType')) {
          this._questionViews.push(view);
        }
      }
    }
  }, Backbone.Events);

  Adapt.on('app:dataReady devtools:enable', function() {
    if (!Adapt.devtools.get('_isEnabled')) return;

    PassHalfFail.initialize();
  });

  return PassHalfFail;

});
