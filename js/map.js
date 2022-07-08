define([
  'core/js/adapt',
  'core/js/router'
], function(Adapt, Router) {

  const MapView = Backbone.View.extend({

    events: {
      'click a': 'onLinkClicked'
    },

    initialize: function() {
      this.$('html').addClass('has-devtools-map');
      this._renderIntervalId = setInterval(this._checkRenderInterval.bind(this), 500);
      this.listenTo(Adapt.components, 'change:_isComplete', this.onModelCompletionChanged);
      this.listenTo(Adapt.blocks, 'change:_isComplete', this.onModelCompletionChanged);
      this.listenTo(Adapt.articles, 'change:_isComplete', this.onModelCompletionChanged);
      this.listenTo(Adapt.contentObjects, 'change:_isComplete', this.onModelCompletionChanged);
      this.render();
    },

    render: function() {
      const data = this.model;
      // var startTime = new Date().getTime();

      const template = Handlebars.templates.devtoolsMap;
      this.$('body').html(template(data));

      // console.log('adapt-devtools: map rendered in ' + ((new Date().getTime())-startTime) + ' ms');
    },

    remove: function() {
      clearInterval(this._renderIntervalId);
      this.$('body').html('Course closed!');
      this.stopListening();
      return this;
    },

    _checkRenderInterval: function() {
      if (this._invalid) {
        this._invalid = false;
        this.render();
      }
    },

    _getConfig: function(pageModel) {
      if (!pageModel.has('_devtools')) pageModel.set('_devtools', {});
      return pageModel.get('_devtools');
    },

    _disablePageIncompletePrompt: function(pageModel) {
      const config = this._getConfig(pageModel);

      if (pageModel.has('_pageIncompletePrompt')) {
        config._pageIncompletePromptExists = true;
        if (pageModel.get('_pageIncompletePrompt').hasOwnProperty('_isEnabled')) {
          config._pageIncompletePromptEnabled = pageModel.get('_pageIncompletePrompt')._isEnabled;
        }
      } else {
        config._pageIncompletePromptExists = false;
        pageModel.set('_pageIncompletePrompt', {});
      }

      pageModel.get('_pageIncompletePrompt')._isEnabled = false;
    },

    _restorePageIncompletePrompt: function(pageModel) {
      const config = this._getConfig(pageModel);

      if (config._pageIncompletePromptExists) {
        if (config.hasOwnProperty('_pageIncompletePromptEnabled')) pageModel.get('_pageIncompletePrompt')._isEnabled = config._pageIncompletePromptEnabled;
        else delete pageModel.get('_pageIncompletePrompt')._isEnabled;
      } else {
        pageModel.unset('_pageIncompletePrompt');
      }
      delete config._pageIncompletePromptExists;
      delete config._pageIncompletePromptEnabled;
    },

    onModelCompletionChanged: function() {
      this.invalidate();
    },

    onLinkClicked: function(e) {
      const $target = $(e.currentTarget);
      let id = $target.attr('href').slice(1);
      const model = Adapt.findById(id);

      e.preventDefault();

      if (e.ctrlKey && this.el.defaultView) {
        id = id.replace(/-/g, '');
        this.el.defaultView[id] = model;
        this.el.defaultView.console.log('devtools: add property window.' + id + ':');
        this.el.defaultView.console.log(model);
      } else if (e.shiftKey) {
        this.navigateAndDisableTrickle(id);
      } else {
        this.navigateAndDisableTrickleUpTo(id);
      }
    },

    invalidate: function() {
      this._invalid = true;
    },

    /**
    * Navigate to the element with the given id (or as closely to it as possible). Disable trickle up to the given id.
    * N.B. because trickle cannot be reliably manipulated in situ we must reload the page. Trickle remains disabled on
    * affected article(s)|block(s).
    */
    navigateAndDisableTrickleUpTo: function(id) {
      const model = Adapt.findById(id);
      const pageModel = Adapt.findById(Adapt.location._currentId);

      // first ensure page incomplete prompt won't activate
      this._disablePageIncompletePrompt(pageModel);

      // now navigate

      if (model._siblings === 'contentObjects') {
        Backbone.history.navigate('#/id/' + id, { trigger: true });
      } else {
        const level = model.get('_type') === 'component' ? model.getParent() : model;
        const siblings = level.getParent().getChildren(); let sibling = null;
        // disable trickle on all preceeding article(s)|block(s)
        for (let i = 0, count = siblings.indexOf(level); i < count; i++) {
          sibling = siblings.at(i);
          console.log('disabling trickle on ' + sibling.get('_id'));
          if (sibling.has('_trickle')) {
            sibling.get('_trickle')._isEnabled = false;
          } else {
            sibling.set('_trickle', { _isEnabled: false });
          }
        }
        // check if already on page
        if (Adapt.location._currentId === model.findAncestor('contentObjects').get('_id')) {
          this.listenToOnce(Adapt, 'pageView:ready', function(view) {
            _.defer(function() {
              Adapt.scrollTo($('.' + id));
              this.checkVisibility(id);
            }.bind(this));
          });
          if (Adapt.location._currentId === Adapt.course.get('_id')) Router.handleRoute ? Router.handleRoute() : Router.handleCourse();
          else Router.handleId(Adapt.location._currentId);
        } else {
          this.listenToOnce(Adapt, 'pageView:ready', function() {
            _.defer(function() {
              this.checkVisibility(id);
            }.bind(this));
          });
          Backbone.history.navigate('#/id/' + id, { trigger: true });
        }
      }

      // restore pageIncompletePrompt config
      this._restorePageIncompletePrompt(pageModel);

      this.invalidate();
    },

    /**
    * Navigate to the element with the given id (or as closely to it as possible). Disable trickle on containing
    * page temporarily.
    */
    navigateAndDisableTrickle: function(id) {
      const model = Adapt.findById(id);
      const pageModel = Adapt.findById(Adapt.location._currentId);

      // first ensure page incomplete prompt won't activate
      this._disablePageIncompletePrompt(pageModel);

      if (model._siblings === 'contentObjects') {
        Backbone.history.navigate('#/id/' + id, { trigger: true });
      } else {
        // if already on page ensure trickle is disabled
        if (Adapt.location._currentId === model.findAncestor('contentObjects').get('_id')) {
          Adapt.devtools.set('_trickleEnabled', false);
          Adapt.scrollTo($('.' + id));
          this.checkVisibility(id);
        } else {
          // pick target model to determine trickle config according to trickle version (2.1 or 2.0.x)
          const targetModel = Adapt.trickle ? model.findAncestor('contentObjects') : Adapt.course;

          // if necessary disable trickle (until page is ready)
          if (!targetModel.has('_trickle')) {
            targetModel.set('_trickle', { _isEnabled: false });
            this.listenToOnce(Adapt, 'pageView:ready', function() {
              _.defer(function() {
                targetModel.get('_trickle')._isEnabled = true;
                this.checkVisibility(id);
              }.bind(this));
            });
          } else if (targetModel.get('_trickle')._isEnabled) {
            targetModel.get('_trickle')._isEnabled = false;
            this.listenToOnce(Adapt, 'pageView:ready', function() {
              _.defer(function() {
                targetModel.get('_trickle')._isEnabled = true;
                this.checkVisibility(id);
              }.bind(this));
            });
          }

          Backbone.history.navigate('#/id/' + id, { trigger: true });
        }
      }

      // restore pageIncompletePrompt config
      this._restorePageIncompletePrompt(pageModel);

      this.invalidate();
    },

    checkVisibility: function(id) {
      let model = Adapt.findById(id);
      if ($('.' + id).is(':visible') || model === Adapt.course) return;

      while (!$('.' + id).is(':visible') && model !== Adapt.course) {
        model = model.getParent();
        id = model.get('_id');
      }
      console.log('adapt-devtools::checkVisibility scrolling to ancestor ' + id);
      Adapt.scrollTo($('.' + id));
    }
  });

  const CourseMap = _.extend({
    initialize: function() {
      const courseId = Adapt.course.get('_id');
      // a long alphanumeric identifier is likely to be Authoring Tool
      this.truncateIds = courseId.length >= 6 && /[a-z]+[0-9]+|[0-9]+[a-z]+/.test(courseId);
      this.listenTo(Adapt, 'devtools:mapLoaded', this.onMapLoaded);
      $(window).on('unload', this.onCourseClosed.bind(this));

      function isMenu(options) {
        if (this.get('_type') !== 'page') {
          return options.fn(this);
        }
        return options.inverse(this);
      }

      function eachChild(options) {
        let ret = '';
        const children = this.getChildren().models;

        for (let i = 0, j = children.length; i < j; i++) {
          ret = ret + options.fn(children[i], { data: { index: i, first: i === 0, last: i === j - 1 } });
        }

        return ret;
      }

      function getId(options) {
        const val = this.get('_id') || '';
        return CourseMap.truncateIds ? '...' + val.slice(-4) : val;
      }

      function getProp(prop, options) {
        return this.get(prop);
      }

      function isStringEmpty(str) {
        return !str || (str.trim && str.trim().length === 0) || ($.trim(str).length === 0);
      }

      function getTitle(options) {
        let t = this.get('displayTitle');
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
        let trickleConfig = this.get('_trickle');
        let trickled = false;
        const isBlock = this.get('_type') === 'block';

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
      Handlebars.registerHelper('getId', getId);
      Handlebars.registerHelper('getProp', getProp);
      Handlebars.registerHelper('getTitle', getTitle);
      Handlebars.registerHelper('when', when);
      Handlebars.registerHelper('isTrickled', isTrickled);
    },

    open: function() {
      if (!this.mapWindow) {
        this.mapWindow = window.open('assets/map.html', 'Map');
      } else {
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
      this.mapView = new MapView({ model: Adapt, el: this.mapWindow.document });
      $(this.mapWindow).on('unload', this.onMapClosed.bind(this));
    },

    onCourseClosed: function() {
      if (this.mapView) {
        this.mapView.remove();
        // this.mapWindow.close();
      }
    }
  }, Backbone.Events);

  Adapt.once('adapt:initialize devtools:enable', function() {
    if (!Adapt.devtools.get('_isEnabled')) return;

    CourseMap.initialize();
  });

  return CourseMap;

});
