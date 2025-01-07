import Adapt from 'core/js/adapt';
import device from 'core/js/device';
import logging from 'core/js/logging';
import Hinting from './hinting';
import isQuestionSupported from './is-question-supported';
let ItemsQuestionModel;

class AutoAnswer extends Backbone.Controller {

  initialize () {
    this.listenTo(Adapt, 'app:dataReady devtools:enable', this.onEnabled);
  }

  onEnabled() {
    if (!Adapt.devtools.get('_isEnabled')) return;
    this.mousedownHandlers = [];
    this.listenTo(Adapt, {
      'componentView:postRender': this.componentRendered,
      remove: this.onRemove
    });
  }

  componentRendered (view) {
    if (!isQuestionSupported(view.model)) return;
    if (!view.buttonsView && Adapt.devtools.get('_debug')) {
      logging.warn('adapt-devtools: could not find submit button on ' + view.model.get('_id'));
      return;
    }
    const handler = this.onQuestionMouseDown.bind(this, view);
    view.$el.on('mousedown', handler);
    this.mousedownHandlers.push({
      element: view.$el,
      handler
    });
  }

  onQuestionMouseDown (view, e) {
    // remove hinting if enabled
    if (Adapt.devtools.get('_hintingEnabled')) Hinting.setHinting(view.$el, view.model, false);
    if ((e.ctrlKey && !e.shiftKey) || (e.altKey && !e.shiftKey) || Adapt.devtools.get('_autoCorrectEnabled')) {
      this.answer(view);
    } else if ((e.ctrlKey && e.shiftKey) || (e.altKey && e.shiftKey)) {
      this.answer(view, true);
    }
  }

  isItemsQuestionModel (model) {
    if (ItemsQuestionModel) return model instanceof ItemsQuestionModel;
    if (ItemsQuestionModel === null) return false;
    const hasItemsQuestionModel = require.defined('core/js/models/' + 'itemsQuestionModel');
    if (hasItemsQuestionModel) {
      ItemsQuestionModel = require('core/js/models/' + 'itemsQuestionModel');
      return model instanceof ItemsQuestionModel;
    }
    ItemsQuestionModel = null;
    return false;
  }

  answer (view, incorrectly) {
    if (view.model.get('_isSubmitted')) return;
    if (Adapt.devtools.get('_debug')) {
      logging.debug('adapt-devtools: answer ' + view.model.get('_id') + (incorrectly === true ? ' incorrectly' : ''));
    }
    if (incorrectly === true) {
      switch (view.model.get('_component')) {
        case 'mcq':this.answerMultipleChoiceIncorrectly(view); break;
        case 'gmcq':this.answerMultipleChoiceIncorrectly(view, true); break;
        case 'matching':this.answerMatchingIncorrectly(view); break;
        case 'ppq':this.answerPpqIncorrectly(view); break;
        case 'slider':this.answerSliderIncorrectly(view); break;
        case 'textinput':this.answerTextInputIncorrectly(view); break;
        case 'questionStrip':this.answerQuestionStripIncorrectly(view); break;
        default:this.answerUnsupportedIncorrectly(view);
      }
    } else {
      switch (view.model.get('_component')) {
        case 'mcq':this.answerMultipleChoice(view); break;
        case 'gmcq':this.answerMultipleChoice(view, true); break;
        case 'matching':this.answerMatching(view); break;
        case 'ppq':this.answerPpq(view); break;
        case 'slider':this.answerSlider(view); break;
        case 'textinput':this.answerTextInput(view); break;
        case 'questionStrip':this.answerQuestionStrip(view); break;
        default:this.answerUnsupported(view);
      }
    }
    view.$('.js-btn-action').trigger('click');
  }

  answerMultipleChoice (view, isGraphical) {
    const items = this.isItemsQuestionModel(view.model) ? view.model.getChildren().toJSON() : view.model.get('_items');
    const noCorrectOptions = _.where(items, { _shouldBeSelected: true }).length === 0;
    if (this.isItemsQuestionModel(view.model)) {
      if (noCorrectOptions) {
        view.model.getItem(_.random(items.length - 1)).set('_isActive', true);
      } else {
        view.model.getChildren().forEach(item => {
          if ((item.get('_shouldBeSelected') && !item.get('_isActive')) || (!item.get('_shouldBeSelected') && item.get('_isActive'))) {
            item.toggleActive();
          }
        });
      }
      return;
    }
    if (noCorrectOptions) {
      if (_.where(items, { _isSelected: true }).length === 0) {
        view.$(isGraphical ? '.js-item-input' : '.js-item-input').eq(_.random(items.length - 1)).trigger('change');
      }
      return;
    }
    items.forEach((item, index) => {
      const isIncorrect = (item._shouldBeSelected && !item._isSelected) || (!item._shouldBeSelected && item._isSelected);
      if (!isIncorrect) return;
      view.$(isGraphical ? '.js-item-input' : '.js-item-input').eq(index).trigger('change');
    });
  }

  answerMultipleChoiceIncorrectly (view, isGraphical) {
    const model = view.model;
    const items = this.isItemsQuestionModel(model) ? model.getChildren().toJSON() : model.get('_items');
    const itemCount = items.length;
    const selectionStates = _.times(itemCount, () => false);
    // number of items that should be selected
    const nShould = _.where(items, { _shouldBeSelected: true }).length;
    // and number that should not
    const nShouldNot = itemCount - nShould;
    // decide how many items to select
    const nSelect = model.get('_selectable');
    // decide how many of these should be incorrect
    const nIncorrect = nShouldNot === 0 ? 0 : _.random(nShould === 1 ? 1 : 0, Math.min(nShouldNot, nSelect));
    // and how many should be correct
    const nCorrect = nIncorrect === 0 ? _.random(1, Math.min(nShould - 1, nSelect)) : _.random(0, Math.min(nShould, nSelect - nIncorrect));
    if (itemCount === 1 || nSelect === 0) {
      logging.warn('adapt-devtools: not possible to answer ' + model.get('_id') + ' incorrectly');
      return;
    }
    for (let j = 0; j < nIncorrect; j++) {
      // start at a random position in items to avoid bias (err is contingency for bad data)
      for (let k = _.random(itemCount), err = itemCount, found = false; !found && err >= 0; k++, err--) {
        const index = k % itemCount;
        if (selectionStates[index] === false) {
          if (!items[index]._shouldBeSelected) selectionStates[index] = (found = true);
        }
      }
    }
    for (let j = 0; j < nCorrect; j++) {
      // start at a random position in items to avoid bias (err is contingency for bad data)
      for (let k = _.random(itemCount), err = itemCount, found = false; !found && err >= 0; k++, err--) {
        const index = k % itemCount;
        if (selectionStates[index] === false) {
          if (items[index]._shouldBeSelected) selectionStates[index] = (found = true);
        }
      }
    }
    if (this.isItemsQuestionModel(view.model)) {
      view.model.getChildren().forEach((item, index) => {
        if ((selectionStates[index] && !item.get('_isActive')) || (!selectionStates[index] && item.get('_isActive'))) {
          item.toggleActive();
        }
      });
      return;
    }
    items.forEach((item, index) => {
      const hasChanged = (selectionStates[index] && !item._isSelected) || (!selectionStates[index] && item._isSelected);
      if (!hasChanged) return;
      view.$(isGraphical ? '.js-item-input' : '.js-item-input').eq(index).trigger('change');
    });
  }

  answerMatching (view) {
    view.model.get('_items').forEach((item, itemIndex) => {
      const noCorrectOptions = _.where(item._options, { _isCorrect: true }).length === 0;
      if (noCorrectOptions) {
        if (!view.dropdowns[itemIndex].getFirstSelectedItem()) {
          const i = _.random(item._options.length - 1);
          if (view.model.setActiveOption) {
            view.model.setActiveOption(item._options[i]._index);
          } else {
            view.selectValue(itemIndex, i);
          }
        }
        return;
      }
      item._options.forEach((option) => {
        if (!option._isCorrect) return;
        if (view.model.setActiveOption) {
          view.model.setActiveOption(option._index);
          return;
        }
        view.selectValue(itemIndex, option._index);
      });
    });
  }

  answerMatchingIncorrectly (view) {
    const items = view.model.get('_items'); const itemCount = items.length; const nIncorrect = _.random(1, itemCount);
    // decide which items to answer incorrectly (minimum one)
    const selectionStates = _.shuffle(_.times(itemCount, i => i < nIncorrect));

    items.forEach((item, itemIndex) => {
      const $select = view.$('select').eq(itemIndex);
      const $options = $select.find('option');
      // check if this item is to be answered incorrectly
      if (selectionStates[itemIndex]) {
        // start at a random position in options to avoid bias (err is contingency for bad data)
        for (let count = item._options.length, i = _.random(count), err = count; err >= 0; i++, err--) {
          if (!item._options[i % count]._isCorrect) {
            const option = item._options[i % count];
            if (view.model.setActiveOption) {
              view.model.setActiveOption(option._index);
              continue;
            }
            if (view.selectValue) {
              view.selectValue(itemIndex, option._index);
              continue;
            }
            if (view.model.setOptionSelected) {
              $select.val(option.text);
              $select.trigger('change');
              view.model.setOptionSelected(itemIndex, i % count, true);
              continue;
            }
            $options.eq((i % count) + 1).prop('selected', true);
          }
        }
        return;
      }
      item._options.forEach((option, optionIndex) => {
        if (!option._isCorrect) return;
        if (view.model.setActiveOption) {
          view.model.setActiveOption(option._index);
          return;
        }
        if (view.selectValue) {
          view.selectValue(itemIndex, option._index);
          return;
        }
        if (view.model.setOptionSelected) {
          $select.val(option.text);
          $select.trigger('change');
          view.model.setOptionSelected(itemIndex, optionIndex, true);
          return;
        }
        $options.eq(optionIndex + 1).prop('selected', true);
      });
    });
  }

  // --------------------------------------------------
  // --------------------------------------------------

  answerSlider (view) {
    const correctAnswer = view.model.get('_correctAnswer');
    if (correctAnswer) {
      view.$('.js-slider-number[data-id="' + correctAnswer + '"]').trigger('click');
      return;
    }
    const bottom = view.model.get('_correctRange')._bottom;
    const top = view.model.get('_correctRange')._top;
    const d = top - bottom;
    // select from range at random
    view.$('.js-slider-number[data-id="' + (bottom + Math.floor(Math.random() * (d + 1))) + '"]').trigger('click');
  }

  answerSliderIncorrectly (view) {
    const correctAnswer = view.model.get('_correctAnswer');
    const start = view.model.get('_scaleStart'); const end = view.model.get('_scaleEnd');
    const incorrect = _.times(end - start + 1, i => start + i);
    if (correctAnswer) {
      incorrect.splice(correctAnswer - start, 1);
      view.$('.js-slider-number[data-id="' + _.shuffle(incorrect)[0] + '"]').trigger('click');
      return;
    }
    const bottom = view.model.get('_correctRange')._bottom;
    const top = view.model.get('_correctRange')._top;
    incorrect.splice(bottom - start, top - bottom + 1);
    view.$('.js-slider-number[data-id="' + _.shuffle(incorrect)[0] + '"]').trigger('click');
  }

  answerTextInput (view) {
    const answers = view.model.get('_answers');
    view.model.get('_items').forEach((item, index) => {
      if (answers) view.$('.js-textinput-textbox').eq(index).val(answers[index][0]).trigger('change'); // generic answers
      else view.$('.js-textinput-textbox').eq(index).val(item._answers[0]).trigger('change'); // specific answers
    });
  }

  answerTextInputIncorrectly (view) {
    const items = view.model.get('_items'); const itemCount = items.length; const nIncorrect = _.random(1, itemCount);
    // decide which items to answer incorrectly (minimum one)
    const selectionStates = _.shuffle(_.times(itemCount, i => i < nIncorrect));
    const answers = view.model.get('_answers');
    items.forEach((item, index) => {
      if (selectionStates[index]) {
        view.$('.js-textinput-textbox').eq(index).val('***4n 1nc0rr3ct 4nsw3r***').trigger('change'); // probably
        return;
      }
      if (answers) view.$('.js-textinput-textbox').eq(index).val(answers[index][0]).trigger('change');
      else view.$('.js-textinput-textbox').eq(index).val(item._answers[0]).trigger('change');
    });
  }

  // --------------------------------------------------
  // --------------------------------------------------
  // NEEDS UPDATING?
  // --------------------------------------------------
  // --------------------------------------------------
  answerQuestionStrip (view) {
    view.model.get('_items').forEach((item, itemIndex) => {
      item._subItems.forEach((subItem, subItemIndex) => {
        if (!subItem._isCorrect) return;
        view.setStage(itemIndex, subItemIndex, true);
      });
    });
  }

  answerQuestionStripIncorrectly (view) {
    const items = view.model.get('_items'); const itemCount = items.length; const nIncorrect = _.random(1, itemCount);
    // decide which items to answer incorrectly (minimum one)
    const selectionStates = _.shuffle(_.times(itemCount, i => i < nIncorrect));

    items.forEach((item, itemIndex) => {
      // check if this item is to be answered incorrectly
      if (selectionStates[itemIndex]) {
        // start at a random position in subitems to avoid bias (err is contingency for bad data)
        for (let count = item._subItems.length, i = _.random(count), err = count; err >= 0; i++, err--) {
          if (!item._subItems[i % count]._isCorrect) {
            view.setStage(itemIndex, i % count, true);
            return;
          }
        }
        return;
      }
      item._subItems.forEach((subItem, subItemIndex) => {
        if (!subItem._isCorrect) return;
        view.setStage(itemIndex, subItemIndex, true);
      });
    });
  }

  answerPpq (view) {
    const model = view.model;
    let items = model.get('_items');
    const itemCount = items.length;
    // determine screen size
    const isDesktop = device.screenSize !== 'small';
    // select appropriate pinboard
    items = _.pluck(model.get('_items'), isDesktop ? 'desktop' : 'mobile');
    const $pinboard = view.$('.ppq-pinboard');
    const boardw = $pinboard.width();
    const boardh = $pinboard.height();
    for (let i = 0; i < itemCount; i++) {
      const zone = items[i];
      const pin = view.getNextUnusedPin();
      const x = zone.left + zone.width / 2;
      const y = zone.top + zone.height / 2;
      logging.debug('using correct position', x + ',' + y);
      pin.setPosition(x, y);
      pin.$el.css({
        left: boardw * x / 100 - pin.$el.width() / 2,
        top: boardh * y / 100 - pin.$el.height()
      });
    }
  }

  answerPpqIncorrectly (view) {
    const model = view.model;
    /** @type {Array} */
    let items = model.get('_items'); const itemCount = items.length;
    // determine screen size
    const isDesktop = device.screenSize !== 'small';
    // select appropriate pinboard
    items = _.pluck(model.get('_items'), isDesktop ? 'desktop' : 'mobile');
    // decide how many items to select
    const nSelect = _.random(model.get('_minSelection'), model.get('_maxSelection'));
    // decide how many of these should be incorrect
    const nIncorrect = _.random(1, nSelect);
    // and how many should be correct
    const nCorrect = nSelect - nIncorrect;
    const $pinboard = view.$('.ppq-pinboard');
    const boardw = $pinboard.width();
    const boardh = $pinboard.height();
    logging.debug('nIncorrect=', nIncorrect, 'nCorrect=', nCorrect);
    const maxSize = zone => zone.left < 1 && zone.top < 1 && zone.width > 9999 && zone.height > 9999;
    // work with integers for accuracy and simplicity
    items = items.map(item => ({
      left: Math.round(item.left * 100),
      top: Math.round(item.top * 100),
      width: Math.round(item.width * 100),
      height: Math.round(item.height * 100)
    }));
    if (items.some(maxSize) || nSelect === 0) {
      logging.warn('adapt-devtools: not possible to answer ' + model.get('_id') + ' incorrectly');
      return;
    }
    view.resetPins();
    // simplified approach for readability; statistically probable that finding pin positions will be extremely quick
    for (let i = 0; i < nIncorrect; i++) {
      let ok = false;
      let x;
      let y;
      // find a suitable x-coordinate
      while (!ok) {
        x = _.random(1, 10000);
        ok = !items.some(zone => {
          return x >= zone.left && x < zone.left + zone.width && zone.top < 1 && zone.height > 9999;
        });
      }
      ok = false;
      // find a suitable y-coordinate
      while (!ok) {
        y = _.random(1, 10000);
        ok = !items.some(zone => {
          return x >= zone.left && x < zone.left + zone.width && y >= zone.top && y < zone.top + zone.height;
        });
      }
      x = x / 100;
      y = y / 100;
      logging.debug('using incorrect position', x + ',' + y);
      const pin = view.getNextUnusedPin();
      pin.setPosition(x, y);
      pin.$el.css({
        left: boardw * x / 100 - pin.$el.width() / 2,
        top: boardh * y / 100 - pin.$el.height()
      });
    }
    // decide in which zones to place a pin
    const correct = _.shuffle(_.times(itemCount, i => i));
    for (let i = 0; i < nCorrect; i++) {
      const zone = items[correct[i]];
      const pin = view.getNextUnusedPin();
      let x = zone.left + zone.width / 2;
      let y = zone.top + zone.height / 2;
      x = x / 100;
      y = y / 100;
      logging.debug('using correct position', x + ',' + y);
      pin.setPosition(x, y);
      pin.$el.css({
        left: boardw * x / 100 - pin.$el.width() / 2,
        top: boardh * y / 100 - pin.$el.height()
      });
    }
  }

  // --------------------------------------------------
  // --------------------------------------------------

  answerUnsupported (view) {
    const model = view.model;

    model.set({ _isComplete: true, _isInteractionComplete: true, _isCorrect: true, _isSubmitted: true, _score: 1 });
    model.set('_attemptsLeft', Math.max(0, model.get('_attempts') - 1));
  }

  answerUnsupportedIncorrectly (view) {
    const model = view.model;
    model.set({ _isComplete: true, _isInteractionComplete: true, _isCorrect: false, _isSubmitted: true, _score: 0 });
    model.set('_attemptsLeft', Math.max(0, model.get('_attempts') - 1));
  }

  onRemove () {
    this.mousedownHandlers.forEach(tuple => {
      tuple.element.off('mousedown', tuple.handler);
    });
  }
}

export default new AutoAnswer();
