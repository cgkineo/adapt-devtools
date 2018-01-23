define(function(require) {

	var Adapt = require('coreJS/adapt');

	var Hinting = _.extend({

		initialize:function() {
			this.listenTo(Adapt.devtools, 'change:_hintingEnabled', this.toggleHints);
		},

		toggleHints:function() {
			var contentObject = Adapt.findById(Adapt.location._currentId);
			var components = contentObject.findDescendantModels('components');
			var renderedQuestions = _.filter(components, function(m) {
				return m.get('_isQuestionType') === true && m.get('_isReady') === true;
			});

			_.each(renderedQuestions, function(model) {
				this.setHinting($('.'+model.get('_id')), model, Adapt.devtools.get('_hintingEnabled'));
			}, this);

			if (Adapt.devtools.get('_hintingEnabled')) this.listenTo(Adapt, 'componentView:postRender', this.onComponentRendered);
			else this.stopListening(Adapt, 'componentView:postRender');
		},

		onComponentRendered:function(view, hintingEnabled) {
			if (view.model.get('_isQuestionType')) this.setHinting(view.$el, view.model);
		},

		setHinting:function($el, model, hintingEnabled) {
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

		setMcqHinting:function($el, model, hintingEnabled) {
			if (hintingEnabled) {
				_.each(model.get('_items'), function(item, index) {
					$el.find('.mcq-item').eq(index).addClass(item._shouldBeSelected ? 'hintCorrect' : 'hintIncorrect');
				});
			}
			else {
				$el.find('.mcq-item').removeClass('hintCorrect hintIncorrect');
			}
		},

		setGmcqHinting:function($el, model, hintingEnabled) {
			if (hintingEnabled) {
				_.each(model.get('_items'), function(item, index) {
					$el.find('.gmcq-item').eq(index).addClass(item._shouldBeSelected ? 'hintCorrect' : 'hintIncorrect');
				});
			}
			else {
				$el.find('.gmcq-item').removeClass('hintCorrect hintIncorrect');
			}
		},

		setMatchingHinting:function($el, model, hintingEnabled) {
			if (hintingEnabled) {
				_.each(model.get('_items'), function(item, itemIndex) {
					var $select = $el.find('select').eq(itemIndex);
					var $options = $select.find('option');
					_.each(item._options, function(option, optionIndex) {
						/*if (Modernizr.touch) {*/
							if (option._isCorrect) $options.eq(optionIndex+1).append('<span class="hint"> (correct)</span>');
						/*}
						else {
							$options.eq(optionIndex+1).addClass(option._isCorrect ? 'hintCorrect' : 'hintIncorrect');
						}*/
					});
				});
			}
			else {
				/*if (Modernizr.touch) */$el.find('option .hint').remove();
				/*else $el.find('option').removeClass('hintCorrect hintIncorrect');*/
			}
		},

		setSliderHinting:function($el, model, hintingEnabled) {
			if (hintingEnabled) {
				var correctAnswer = model.get('_correctAnswer');
				if (correctAnswer) {
					$el.find('.slider-scale-number').addClass('hintIncorrect');
					$el.find('.slider-scale-number[data-id="'+correctAnswer+'"]').removeClass('hintIncorrect').addClass('hintCorrect');
				}
				else {
					$el.find('.slider-scale-number').addClass('hintIncorrect');
					var bottom = model.get('_correctRange')._bottom;
	        		var top = model.get('_correctRange')._top;
	        		for (var i = bottom; i <= top; i++)
	        			$el.find('.slider-scale-number[data-id="'+i+'"]').removeClass('hintIncorrect').addClass('hintCorrect');
				}
			}
			else {
				$el.find('.slider-scale-number').removeClass('hintCorrect hintIncorrect');
			}
		},

		setTextInputHinting:function($el, model, hintingEnabled) {
			if (hintingEnabled) {
				_.each(model.get('_items'), function(item, index) {
					if (model.get('_answers')) {
						// generic answers
						$el.find('.textinput-item').eq(index).find('input').attr('placeholder', model.get('_answers')[index][0]);
					}
					else {
						// specific answers
						$el.find('.textinput-item').eq(index).find('input').attr('placeholder', item._answers[0]);
					}
				});
			}
			else {
				_.each(model.get('_items'), function(item, index) {
					if (model.get('_answers')) {
						$el.find('.textinput-item').eq(index).find('input').attr('placeholder', item.placeholder);
					}
				});
			}
		},

		setQuestionStripHinting:function($el, model, hintingEnabled) {
			if (hintingEnabled) {
				_.each(model.get('_items'), function(item, itemIndex) {
					var $item = $el.find('.component-item').eq(itemIndex);
					var $subItems = $item.find('.qs-strapline-header-inner:not(.qs-noop) .qs-strapline-title-inner');
					_.each(item._subItems, function(subItem, subItemIndex) {
						if (subItem._isCorrect) $subItems.eq(subItemIndex).append('<span class="hint"> (correct)</span>');
					});
				});
			}
			else {
				$el.find('.qs-strapline-title-inner .hint').remove();
			}
		},

		setPpqHinting:function($el, model, hintingEnabled) {console.log('setPpqHinting', hintingEnabled);
			if (!model.get('_developerMode')) {
				$el.find('.ppq-correct-zone').toggleClass('display-none', !hintingEnabled);
				$el.find('.ppq-pinboard').toggleClass('developer-mode', hintingEnabled);
			}
		}
	}, Backbone.Events);

	Adapt.once('adapt:initialize devtools:enable', function() {
		if (!Adapt.devtools.get('_isEnabled')) return;

		Hinting.initialize();
	});

	return Hinting;
});
