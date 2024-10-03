import Adapt from 'core/js/adapt';
import data from 'core/js/data';
import location from 'core/js/location';
import logging from 'core/js/logging';

class Hinting extends Backbone.Controller {

  initialize () {
    this.listenToOnce(Adapt, 'adapt:initialize devtools:enable', this.onEnabled);
  }

  onEnabled() {
    if (!Adapt.devtools.get('_isEnabled')) return;
    this.listenTo(Adapt.devtools, 'change:_hintingEnabled', this.toggleHints);
  }

  toggleHints () {
    const contentObject = data.findById(location._currentId);
    const components = contentObject.findDescendantModels('components');
    const renderedQuestions = components.filter(m => {
      return m.get('_isQuestionType') === true && m.get('_isReady') === true;
    });

    renderedQuestions.forEach((model) => {
      this.setHinting($('.' + model.get('_id')), model, Adapt.devtools.get('_hintingEnabled'));
    }, this);

    if (Adapt.devtools.get('_hintingEnabled')) this.listenTo(Adapt, 'componentView:postRender', this.onComponentRendered);
    else this.stopListening(Adapt, 'componentView:postRender');
  }

  onComponentRendered (view, hintingEnabled) {
    if (view.model.get('_isQuestionType')) this.setHinting(view.$el, view.model);
  }

  setHinting ($el, model, hintingEnabled) {
    switch (model.get('_component')) {
      case 'mcq':this.setMcqHinting($el, model, hintingEnabled !== false); break;
      case 'gmcq':this.setGmcqHinting($el, model, hintingEnabled !== false); break;
      case 'matching':this.setMatchingHinting($el, model, hintingEnabled !== false); break;
      case 'ppq':this.setPpqHinting($el, model, hintingEnabled !== false); break;
      case 'slider':this.setSliderHinting($el, model, hintingEnabled !== false); break;
      case 'textinput':this.setTextInputHinting($el, model, hintingEnabled !== false); break;
      case 'questionStrip':this.setQuestionStripHinting($el, model, hintingEnabled !== false); break;
    }
  }

  setMcqHinting ($el, model, hintingEnabled) {
    if (hintingEnabled) {
      model.get('_items').forEach((item, index) => {
        $el.find('.js-mcq-item').eq(index).addClass(item._shouldBeSelected ? 'hint-is-correct' : 'hint-is-incorrect');
      });
      return;
    }
    $el.find('.js-mcq-item').removeClass('hint-is-correct hint-is-incorrect');
  }

  setGmcqHinting ($el, model, hintingEnabled) {
    if (hintingEnabled) {
      model.get('_items').forEach((item, index) => {
        $el.find('.js-mcq-item').eq(index).addClass(item._shouldBeSelected ? 'hint-is-correct' : 'hint-is-incorrect');
      });
      return;
    }
    $el.find('.js-mcq-item').removeClass('hint-is-correct hint-is-incorrect');
  }

  setMatchingHinting ($el, model, hintingEnabled) {
    if (!hintingEnabled) {
      model.get('_items').forEach((item, itemIndex) => {
        const $item = $el.find('.item').eq(itemIndex);
        const $options = $item.find('.js-dropdown-list-item');
        item._options.forEach((option, optionIndex) => {
          /* if (Modernizr.touch) { */
          if (option._isCorrect) $options.eq(optionIndex + 1).find('.js-dropdown-list-item-inner').append('<span class="hint"> (correct)</span>');
          /* }
          else {
            $options.eq(optionIndex+1).addClass(option._isCorrect ? 'hintCorrect' : 'hintIncorrect');
          } */
        });
      });
      return;
    }
    /* if (Modernizr.touch) */
    $el.find('.js-dropdown-list-item-inner .hint').remove();
    /* else $el.find('option').removeClass('hintCorrect hintIncorrect'); */
  }

  setSliderHinting ($el, model, hintingEnabled) {
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
      return;
    }
    $el.find('.js-slider-number').removeClass('hint-is-correct hint-is-incorrect');
  }

  setTextInputHinting ($el, model, hintingEnabled) {
    if (hintingEnabled) {
      model.get('_items').forEach((item, index) => {
        if (model.get('_answers')) {
          // generic answers
          $el.find('.js-textinput-item').eq(index).find('input').attr('placeholder', model.get('_answers')[index][0]);
        } else {
          // specific answers
          $el.find('.js-textinput-item').eq(index).find('input').attr('placeholder', item._answers[0]);
        }
      });
      return;
    }
    model.get('_items').forEach((item, index) => {
      if (model.get('_answers')) {
        $el.find('.js-textinput-item').eq(index).find('input').attr('placeholder', item.placeholder);
      }
    });
  }

  // --------------------------------------------------
  // --------------------------------------------------
  // NEEDS UPDATING?
  // --------------------------------------------------
  // --------------------------------------------------
  setQuestionStripHinting ($el, model, hintingEnabled) {
    if (hintingEnabled) {
      model.get('_items').forEach((item, itemIndex) => {
        const $item = $el.find('.component-item').eq(itemIndex);
        const $subItems = $item.find('.qs-strapline-header-inner:not(.qs-noop) .qs-strapline-title-inner');
        item._subItems.forEach((subItem, subItemIndex) => {
          if (subItem._isCorrect) $subItems.eq(subItemIndex).append('<span class="hint"> (correct)</span>');
        });
      });
      return;
    }
    $el.find('.qs-strapline-title-inner .hint').remove();
  }

  setPpqHinting ($el, model, hintingEnabled) {
    logging.debug('setPpqHinting', hintingEnabled);
    if (model.get('_developerMode')) return;
    $el.find('.ppq-correct-zone').toggleClass('display-none', !hintingEnabled);
    $el.find('.ppq-pinboard').toggleClass('developer-mode', hintingEnabled);
  }
  // --------------------------------------------------
  // --------------------------------------------------

}

export default new Hinting();
