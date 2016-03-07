define(function(require) {

	var Adapt = require('coreJS/adapt');
	var Hinting = require('./hinting');
	var isQuestionSupported = require('./is-question-supported');

	var AutoAnswer = _.extend({

		initialize:function() {
			this.listenTo(Adapt, 'componentView:postRender', this.componentRendered);
		},

		componentRendered:function(view) {
			if (isQuestionSupported(view.model)) {
				if (view.buttonsView) {
					view.$('.buttons-action').on('mousedown', _.bind(this.onSubmitClicked, this, view));
				}
				else if (Adapt.devtools.get('_debug')) {
					console.warn('adapt-devtools: could not find submit button on '+view.model.get('_id'));
				}
			}
		},

		onSubmitClicked:function(view, e) {
			// remove hinting if enabled
			if (Adapt.devtools.get('_hintingEnabled')) Hinting.setHinting(view.$el, view.model, false);

			if ((e.ctrlKey && !e.shiftKey) || Adapt.devtools.get('_autoCorrectEnabled')) {
				this.answer(view);
			}
			else if (e.ctrlKey && e.shiftKey) {
				this.answer(view, true);
			}
		},

		answer:function(view, incorrectly) {
			if (view.model.get('_isSubmitted')) return;

			if (Adapt.devtools.get('_debug')) {
				console.log('adapt-devtools: answer '+view.model.get('_id')+(incorrectly === true ? ' incorrectly' : ''));
			}

			if (incorrectly === true) {
				switch (view.model.get('_component')) {
					case 'mcq':this.answerMultipleChoiceIncorrectly(view); break;
					case 'gmcq':this.answerMultipleChoiceIncorrectly(view, true); break;
					case 'matching':this.answerMatchingIncorrectly(view); break;
					case 'slider':this.answerSliderIncorrectly(view); break;
					case 'textinput':this.answerTextInputIncorrectly(view); break;
					case 'questionStrip':this.answerQuestionStripIncorrectly(view); break;
					default:this.answerUnsupportedIncorrectly(view);
				}
			}
			else {
				switch (view.model.get('_component')) {
					case 'mcq':this.answerMultipleChoice(view); break;
					case 'gmcq':this.answerMultipleChoice(view, true); break;
					case 'matching':this.answerMatching(view); break;
					case 'slider':this.answerSlider(view); break;
					case 'textinput':this.answerTextInput(view); break;
					case 'questionStrip':this.answerQuestionStrip(view); break;
					default:this.answerUnsupported(view);
				}
			}
		},

		answerMultipleChoice:function(view, isGraphical) {
			_.each(view.model.get('_items'), function(item, index) {
				if (item._shouldBeSelected && !item._isSelected || !item._shouldBeSelected && item._isSelected) {
					view.$(isGraphical ? '.gmcq-item input' : '.mcq-item input').eq(index).trigger('change');
				}
			});
		},

		answerMultipleChoiceIncorrectly:function(view, isGraphical) {
			var model = view.model, items = model.get('_items'), itemCount = items.length;
			var selectionStates = _.times(itemCount, function() {return false;});
			// number of items that should be selected
			var nShould = _.where(items, {_shouldBeSelected:true}).length;
			// and number that should not
			var nShouldNot = itemCount - nShould;
			// decide how many items to select
			var nSelect = model.get('_selectable');
			// decide how many of these should be incorrect
			var nIncorrect = nShouldNot == 0 ? 0 : _.random(nShould == 1 ? 1 : 0, Math.min(nShouldNot, nSelect));
			// and how many should be correct
			var nCorrect = nIncorrect == 0 ? _.random(1, Math.min(nShould - 1, nSelect)) : _.random(0, Math.min(nShould, nSelect - nIncorrect));

			if (itemCount == 1 || nSelect == 0) {
				console.warn('adapt-devtools: not possible to answer '+model.get('_id')+' incorrectly');
				return;
			}

			for (var j = 0; j < nIncorrect; j++) {
				// start at a random position in items to avoid bias (err is contingency for bad data)
				for (var k=_.random(itemCount), err=itemCount, found=false; !found && err>=0; k++, err--) {
					var index = k%itemCount;
					if (selectionStates[index] === false) {
						if (!items[index]._shouldBeSelected) selectionStates[index] = found = true;
					}
				}
			}
			for (var j = 0; j < nCorrect; j++) {
				// start at a random position in items to avoid bias (err is contingency for bad data)
				for (var k=_.random(itemCount), err=itemCount, found=false; !found && err>=0; k++, err--) {
					var index = k%itemCount;
					if (selectionStates[index] === false) {
						if (items[index]._shouldBeSelected) selectionStates[index] = found = true;
					}
				}
			}

			_.each(items, function(item, index) {
				if (selectionStates[index] && !item._isSelected || !selectionStates[index] && item._isSelected) {
					view.$(isGraphical ? '.gmcq-item input' : '.mcq-item input').eq(index).trigger('change');
				}
			});
		},

		answerMatching:function(view) {
			_.each(view.model.get('_items'), function(item, itemIndex) {
				var $select = view.$('select').eq(itemIndex);
				var $options = $select.find('option');
				_.each(item._options, function(option, optionIndex) {
					if (option._isCorrect) $options.eq(optionIndex+1).prop('selected', true);
				});
			});
		},

		answerMatchingIncorrectly:function(view) {
			var items = view.model.get('_items'), itemCount = items.length, nIncorrect = _.random(1, itemCount);
			// decide which items to answer incorrectly (minimum one)
			var selectionStates = _.shuffle(_.times(itemCount, function(i) {return i<nIncorrect;}));

			_.each(items, function(item, itemIndex) {
				var $select = view.$('select').eq(itemIndex);
				var $options = $select.find('option');
				// check if this item is to be answered incorrectly
				if (selectionStates[itemIndex]) {
					// start at a random position in options to avoid bias (err is contingency for bad data)
					for (var count=item._options.length, i=_.random(count), err=count; err>=0; i++, err--)
						if (!item._options[i%count]._isCorrect) {
							$options.eq((i%count)+1).prop('selected', true);
							return;
						}
				}
				else {
					_.each(item._options, function(option, optionIndex) {
						if (option._isCorrect) $options.eq(optionIndex+1).prop('selected', true);
					});
				}
			});
		},

		answerSlider:function(view) {
			var correctAnswer = view.model.get('_correctAnswer');
			if (correctAnswer) {
				view.$('.slider-scale-number[data-id="'+correctAnswer+'"]').trigger('click');
			}
			else {
				var bottom = view.model.get('_correctRange')._bottom;
        		var top = view.model.get('_correctRange')._top;
        		var d = top - bottom;
        		// select from range at random
        		view.$('.slider-scale-number[data-id="'+(bottom+Math.floor(Math.random()*(d+1)))+'"]').trigger('click');
			}
		},

		answerSliderIncorrectly:function(view) {
			var correctAnswer = view.model.get('_correctAnswer');
			var start = view.model.get('_scaleStart'), end = view.model.get('_scaleEnd');
			var incorrect = _.times(end-start+1, function(i) {return start+i;});
			if (correctAnswer) {
				incorrect.splice(correctAnswer-start, 1);
			}
			else {
				var bottom = view.model.get('_correctRange')._bottom;
        		var top = view.model.get('_correctRange')._top;
        		incorrect.splice(bottom-start, top-bottom+1);
			}
			view.$('.slider-scale-number[data-id="'+_.shuffle(incorrect)[0]+'"]').trigger('click');
		},

		answerTextInput:function(view) {
			var answers = view.model.get('_answers');
			_.each(view.model.get('_items'), function(item, index) {
				if (answers) view.$('.textinput-item input').eq(index).val(answers[index][0]); // generic answers
				else view.$('.textinput-item input').eq(index).val(item._answers[0]); // specific answers
			});
		},

		answerTextInputIncorrectly:function(view) {
			var items = view.model.get('_items'), itemCount = items.length, nIncorrect = _.random(1, itemCount);
			// decide which items to answer incorrectly (minimum one)
			var selectionStates = _.shuffle(_.times(itemCount, function(i) {return i<nIncorrect;}));
			var answers = view.model.get('_answers');
			_.each(items, function(item, index) {
				if (selectionStates[index]) {
					view.$('.textinput-item input').eq(index).val('***4n 1nc0rr3ct 4nsw3r***'); // probably
				}
				else {
					if (answers) view.$('.textinput-item input').eq(index).val(answers[index][0]);
					else view.$('.textinput-item input').eq(index).val(item._answers[0]);
				}
			});
		},

		answerQuestionStrip:function(view) {
			_.each(view.model.get('_items'), function(item, itemIndex) {
				_.each(item._subItems, function(subItem, subItemIndex) {
					if (subItem._isCorrect) view.setStage(itemIndex, subItemIndex, true);
				});
			});
		},

		answerQuestionStripIncorrectly:function(view) {
			var items = view.model.get('_items'), itemCount = items.length, nIncorrect = _.random(1, itemCount);
			// decide which items to answer incorrectly (minimum one)
			var selectionStates = _.shuffle(_.times(itemCount, function(i) {return i<nIncorrect;}));

			_.each(items, function(item, itemIndex) {
				// check if this item is to be answered incorrectly
				if (selectionStates[itemIndex]) {
					// start at a random position in subitems to avoid bias (err is contingency for bad data)
					for (var count=item._subItems.length, i=_.random(count), err=count; err>=0; i++, err--)
						if (!item._subItems[i%count]._isCorrect) {
							view.setStage(itemIndex, i%count, true);
							return;
						}
				}
				else {
					_.each(item._subItems, function(subItem, subItemIndex) {
						if (subItem._isCorrect) view.setStage(itemIndex, subItemIndex, true);
					});
				}
			});
		},

		answerUnsupported:function(view) {
			var model = view.model;

			model.set({"_isComplete":true, "_isInteractionComplete":true, "_isCorrect":true, "_isSubmitted":true, "_score":1});
			model.set("_attemptsLeft", model.get("_attempts") - 1);
			model.set("_attempts", 1);
			model.set("_interactions", model.get("_interactions") ? model.get("_interactions") + 1 : 1);
		},

		answerUnsupportedIncorrectly:function(view) {
			var model = view.model;
			
			model.set({"_isComplete":true, "_isInteractionComplete":true, "_isCorrect":false, "_isSubmitted":true, "_score":0});
			model.set("_attemptsLeft", model.get("_attempts") - 1);
			model.set("_attempts", 1);
			model.set("_interactions", model.get("_interactions") ? model.get("_interactions") + 1 : 1);
		}
	}, Backbone.Events);
	
	Adapt.on('app:dataReady', function() {
		var config = Adapt.config.get("_devtools");
		if (!config || !config._isEnabled) return;

		AutoAnswer.initialize();
	});

	return AutoAnswer;
});
