define(function(require) {

	var Adapt = require('coreJS/adapt');

	var MapView = Backbone.View.extend({
		events: {
			'click a':'onLinkClicked'
		},

		initialize: function() {
			this.$('html').addClass('devtools-map');
			this._renderIntervalId = setInterval(_.bind(this._checkRenderInterval, this), 500);
			this.listenTo(Adapt.components, 'change:_isComplete', this.onModelCompletionChanged);
			this.listenTo(Adapt.blocks, 'change:_isComplete', this.onModelCompletionChanged);
			this.listenTo(Adapt.articles, 'change:_isComplete', this.onModelCompletionChanged);
			this.listenTo(Adapt.contentObjects, 'change:_isComplete', this.onModelCompletionChanged);
			this.render();
		},

		render: function() {
			var config = Adapt.devtools;
            var data = this.model;
            var startTime = new Date().getTime();

            var template = Handlebars.templates['devtoolsMap'];
            this.$('body').addClass(config.has('_theme') ? config.get('_theme') : 'theme-light');
            this.$('body').html(template(data));

            //console.log('adapt-devtools: map rendered in ' + ((new Date().getTime())-startTime) + ' ms');
		},

		remove: function() {
			clearInterval(this._renderIntervalId);
            this.$('body').html('Course closed!');
            this.stopListening();
            return this;
        },

		_checkRenderInterval:function() {
			if (this._invalid) {
				this._invalid = false;
				this.render();
			}
		},

		onModelCompletionChanged:function() {
			this._invalid = true;
		},

		onLinkClicked:function(e) {
			var $target = $(e.currentTarget);
			var id = $target.attr("href").slice(1);
			var model = Adapt.findById(id);

			e.preventDefault();
			
			if (e.ctrlKey && this.el.defaultView) {
				id = id.replace(/-/g, '');
				this.el.defaultView[id] = model;
				this.el.defaultView.console.log('devtools: add property window.'+id+':');
				this.el.defaultView.console.log(model);
			}
			else {
				if (model._siblings == 'contentObjects') {
					Backbone.history.navigate("#/id/"+id, {trigger:true});
				}
				else {
					// if already on page ensure trickle is disabled
					if (Adapt.location._currentId == model.findAncestor('contentObjects').get('_id')) {
						Adapt.devtools.set('_trickleEnabled', false);
						Adapt.scrollTo($('.'+id));
						checkVisibility();
					}
					else {
						// pick target model to determine trickle config according to trickle version (2.1 or 2.0.x)
						var targetModel = Adapt.trickle ? model.findAncestor('contentObjects') : Adapt.course;
						
						// if necessary disable trickle (until page is ready)
						if (!targetModel.has('_trickle')) {
							targetModel.set('_trickle', {_isEnabled:false});
							this.listenToOnce(Adapt, 'pageView:ready', function() {
								_.defer(function() {
									targetModel.get('_trickle')._isEnabled = true;
									checkVisibility();
								});
							});
						}
						else if (targetModel.get('_trickle')._isEnabled) {
							targetModel.get('_trickle')._isEnabled = false;
							this.listenToOnce(Adapt, 'pageView:ready', function() {
								_.defer(function() {
									targetModel.get('_trickle')._isEnabled = true;
									checkVisibility();
								});
							});
						}

						Backbone.history.navigate("#/id/"+id, {trigger:true});
					}
				}
			}

			function checkVisibility() {
				if ($('.'+id).is(':visible') || model == Adapt.course) return;

				while (!$('.'+id).is(':visible') && model != Adapt.course) {
					model = model.getParent();
					id = model.get('_id');
				}
				console.log('adapt-devtools::checkVisibility scrolling to ancestor '+id);
				Adapt.scrollTo($('.'+id));
			}
		}
	});

	var Map = _.extend({
		initialize: function() {
			this.listenTo(Adapt, 'devtools:mapLoaded', this.onMapLoaded);
			$(window).on('unload', _.bind(this.onCourseClosed, this));

			function isMenu(options) {
				if (this.get('_type') !== 'page') {
                    return options.fn(this);
                } else {
                    return options.inverse(this);
                }
			}

			function eachChild(options) {
			    var ret = "";
			    var children = this.get('_children').models;
			    
			    for (var i = 0, j = children.length; i < j; i++) {
			        ret = ret + options.fn(children[i], {data:{index:i,first:i==0,last:i===j-1}});
			    }

			    return ret;
			}

			function getProp(prop, options) {
				return this.get(prop);
			}

			function isStringEmpty(str) {
				return !str || (str.trim && str.trim().length == 0) || ($.trim(str).length == 0)
			}

			function getTitle(options) {
				var t = this.get('displayTitle');
				if (isStringEmpty(t)) t = this.get('title');
				if (isStringEmpty(t)) t = this.get('_id');
				return t;
			}

			function when(prop, options) {
				if (this.get(prop)) {
                    return options.fn(this);
                } else {
                    return options.inverse(this);
                }
			}

			function isTrickled(options) {
				var trickleConfig = this.get('_trickle');
				var trickled = false;
				var isBlock = this.get('_type') == 'block';

				if (trickleConfig) trickled = (isBlock || trickleConfig._onChildren !== true) && trickleConfig._isEnabled;
				else if (isBlock) {
					trickleConfig = this.getParent().get('_trickle');
					if (trickleConfig) trickled = trickleConfig._onChildren && trickleConfig._isEnabled;
				}

				if (trickled) {
                    return options.fn(this);
                } else {
                    return options.inverse(this);
                }
			}

			Handlebars.registerHelper('isMenu', isMenu);
			Handlebars.registerHelper('eachChild', eachChild);
			Handlebars.registerHelper('getProp', getProp);
			Handlebars.registerHelper('getTitle', getTitle);
			Handlebars.registerHelper('when', when);
			Handlebars.registerHelper('isTrickled', isTrickled);
		},

		open:function() {
			if (!this.mapWindow) {
				this.mapWindow = window.open('assets/map.html', 'Map');
			}
			else {
				this.mapWindow.focus();
			}
		},

		onMapClosed: function() {
			console.log('onMapClosed');
			this.mapWindow = null;
		},

		onMapLoaded: function(mapWindow) {
			console.log('onMapLoaded');
			this.mapWindow = mapWindow;
			this.mapWindow.focus();
			$('html', this.mapWindow.document).addClass($('html', window.document).attr('class'));
			this.mapView = new MapView({model:Adapt, el:this.mapWindow.document});
			$(this.mapWindow).on('unload', _.bind(this.onMapClosed, this));
        },

        onCourseClosed:function() {
        	if (this.mapView) {
        		this.mapView.remove();
        		//this.mapWindow.close();
        	}
        }
	}, Backbone.Events);

	Adapt.once('adapt:initialize devtools:enable', function() {
		if (!Adapt.devtools.get('_isEnabled')) return;

		Map.initialize();
	});

	return Map;
});
