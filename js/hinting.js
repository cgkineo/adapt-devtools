define([], function(require) {

  const Adapt = require('coreJS/adapt');

  const Hinting = _.extend({

    initialize: function() {
      this.listenTo(Adapt.devtools, 'change:_hintingEnabled', this.toggleHints);
    },

    toggleHints: function() {
      const contentObject = Adapt.findById(Adapt.location._currentId);
      const components = contentObject.findDescendantModels('components');
      const renderedQuestions = _.filter(components, function(m) {
        return m.get('_isQuestionType') === true && m.get('_isReady') === true;
      });

      _.each(renderedQuestions, function(model) {
        this.setHinting($('.' + model.get('_id')), model, Adapt.devtools.get('_hintingEnabled'));
      }, this);

      if (Adapt.devtools.get('_hintingEnabled')) this.listenTo(Adapt, 'componentView:postRender', this.onComponentRendered);
      else this.stopListening(Adapt, 'componentView:postRender');
    },

    onComponentRendered: function(view, hintingEnabled) {
      if (view.model.get('_isQuestionType')) this.setHinting(view.$el, view.model);
    },

    setHinting: function($el, model, hintingEnabled) {
      switch (model.get('_component')) {
        case 'mcq':this.setMcqHinting($el, model, hintingEnabled !== false); break;
        case 'gmcq':this.setGmcqHinting($el, model, hintingEnabled !== false); break;
        case 'matching':this.setMatchingHinting($el, model, hintingEnabled !== false); break;
        case 'ppq':this.setPpqHinting($el, model, hintingEnabled !== false); break;
        case 'slider':this.setSliderHinting($el, model, hintingEnabled !== false); break;
        case 'textinput':this.setTextInputHinting($el, model, hintingEnabled !== false); break;
        case 'questionStrip':this.setQuestionStripHinting($el, model, hintingEnabled !== false); break;
      }
    },

    setMcqHinting: function($el, model, hintingEnabled) {
      if (hintingEnabled) {
        _.each(model.get('_items'), function(item, index) {
          $el.find('.js-mcq-item').eq(index).addClass(item._shouldBeSelected ? 'hint-is-correct' : 'hint-is-incorrect');
        });
      } else {
        $el.find('.js-mcq-item').removeClass('hint-is-correct hint-is-incorrect');
      }
    },

    setGmcqHinting: function($el, model, hintingEnabled) {
      if (hintingEnabled) {
        _.each(model.get('_items'), function(item, index) {
          $el.find('.js-mcq-item').eq(index).addClass(item._shouldBeSelected ? 'hint-is-correct' : 'hint-is-incorrect');
        });
      } else {
        $el.find('.js-mcq-item').removeClass('hint-is-correct hint-is-incorrect');
      }
    },

    setMatchingHinting: function($el, model, hintingEnabled) {
      if (hintingEnabled) {
        _.each(model.get('_items'), function(item, itemIndex) {
          const $item = $el.find('.item').eq(itemIndex);
          const $options = $item.find('.js-dropdown-list-item');
          _.each(item._options, function(option, optionIndex) {
            /* if (Modernizr.touch) { */
            if (option._isCorrect) $options.eq(optionIndex + 1).find('.js-dropdown-list-item-inner').append('<span class="hint"> (correct)</span>');
            /* }
            else {
              $options.eq(optionIndex+1).addClass(option._isCorrect ? 'hintCorrect' : 'hintIncorrect');
            } */
          });
        });
      } else {
        /* if (Modernizr.touch) */
        $el.find('.js-dropdown-list-item-inner .hint').remove();
        /* else $el.find('option').removeClass('hintCorrect hintIncorrect'); */
      }
    },

    setSliderHinting: function($el, model, hintingEnabled) {
      if (hintingEnabled) {
        const correctAnswer = model.get('_correctAnswer');
        if (correctAnswer) {
          $el.find('.js-slider-number').addClass('hint-is-incorrect');
          $el.find('.js-slider-number[data-id="' + correctAnswer + '"]').removeClass('hint-is-incorrect').addClass('hint-is-correct');
        } else {
          $el.find('.js-slider-number').addClass('hint-is-incorrect');
          const bottom = model.get('_correctRange')._bottom;
          const top = model.get('_correctRange')._top;
          for (let i = bottom; i <= top; i++) { $el.find('.js-slider-number[data-id="' + i + '"]').removeClass('hint-is-incorrect').addClass('hint-is-correct'); }
        }
      } else {
        $el.find('.js-slider-number').removeClass('hint-is-correct hint-is-incorrect');
      }
    },

    setTextInputHinting: function($el, model, hintingEnabled) {
      if (hintingEnabled) {
        _.each(model.get('_items'), function(item, index) {
          if (model.get('_answers')) {
            // generic answers
            $el.find('.js-textinput-item').eq(index).find('input').attr('placeholder', model.get('_answers')[index][0]);
          } else {
            // specific answers
            $el.find('.js-textinput-item').eq(index).find('input').attr('placeholder', item._answers[0]);
          }
        });
      } else {
        _.each(model.get('_items'), function(item, index) {
          if (model.get('_answers')) {
            $el.find('.js-textinput-item').eq(index).find('input').attr('placeholder', item.placeholder);
          }
        });
      }
    },

    // --------------------------------------------------
    // --------------------------------------------------
    // NEEDS UPDATING?
    // --------------------------------------------------
    // --------------------------------------------------
    setQuestionStripHinting: function($el, model, hintingEnabled) {
      if (hintingEnabled) {
        _.each(model.get('_items'), function(item, itemIndex) {
          const $item = $el.find('.component-item').eq(itemIndex);
          const $subItems = $item.find('.qs-strapline-header-inner:not(.qs-noop) .qs-strapline-title-inner');
          _.each(item._subItems, function(subItem, subItemIndex) {
            if (subItem._isCorrect) $subItems.eq(subItemIndex).append('<span class="hint"> (correct)</span>');
          });
        });
      } else {
        $el.find('.qs-strapline-title-inner .hint').remove();
      }
    },

    setPpqHinting: function($el, model, hintingEnabled) {
      console.log('setPpqHinting', hintingEnabled);
      if (!model.get('_developerMode')) {
        $el.find('.ppq-correct-zone').toggleClass('display-none', !hintingEnabled);
        $el.find('.ppq-pinboard').toggleClass('developer-mode', hintingEnabled);
      }
    }
    // --------------------------------------------------
    // --------------------------------------------------

  }, Backbone.Events);

  Adapt.once('adapt:initialize devtools:enable', function() {
    if (!Adapt.devtools.get('_isEnabled')) return;

    Hinting.initialize();
  });

  return Hinting;

});
