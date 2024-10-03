import Backbone from 'backbone';
import Adapt from 'core/js/adapt';
import data from 'core/js/data';
import location from 'core/js/location';
import logging from 'core/js/logging';
import Router from 'core/js/router';

class MapView extends Backbone.View {

  events() {
    return {
      'click a': 'onLinkClicked'
    };
  }

  initialize () {
    if (!Adapt.devtools.get('_isEnabled')) return;
    this.$('html').addClass('has-devtools-map');
    this._renderIntervalId = setInterval(this._checkRenderInterval.bind(this), 500);
    this.listenTo(Adapt.components, 'change:_isComplete', this.onModelCompletionChanged);
    this.listenTo(Adapt.blocks, 'change:_isComplete', this.onModelCompletionChanged);
    this.listenTo(Adapt.articles, 'change:_isComplete', this.onModelCompletionChanged);
    this.listenTo(Adapt.contentObjects, 'change:_isComplete', this.onModelCompletionChanged);
    this.render();
  }

  render () {
    const data = this.model;
    // var startTime = new Date().getTime();
    const template = Handlebars.templates.devtoolsMap;
    this.$('body').html(template(data));
    // logging.debug('adapt-devtools: map rendered in ' + ((new Date().getTime())-startTime) + ' ms');
  }

  remove () {
    clearInterval(this._renderIntervalId);
    this.$('body').html('Course closed!');
    this.stopListening();
    return this;
  }

  _checkRenderInterval () {
    if (!this._invalid) return;
    this._invalid = false;
    this.render();
  }

  _getConfig (pageModel) {
    if (!pageModel.has('_devtools')) pageModel.set('_devtools', {});
    return pageModel.get('_devtools');
  }

  _disablePageIncompletePrompt (pageModel) {
    const config = this._getConfig(pageModel);
    if (pageModel.has('_pageIncompletePrompt')) {
      config._pageIncompletePromptExists = true;
      if (Object.prototype.hasOwnProperty.call(pageModel.get('_pageIncompletePrompt', '_isEnabled'))) {
        config._pageIncompletePromptEnabled = pageModel.get('_pageIncompletePrompt')._isEnabled;
      }
    } else {
      config._pageIncompletePromptExists = false;
      pageModel.set('_pageIncompletePrompt', {});
    }
    pageModel.get('_pageIncompletePrompt')._isEnabled = false;
  }

  _restorePageIncompletePrompt (pageModel) {
    const config = this._getConfig(pageModel);
    if (config._pageIncompletePromptExists) {
      if (Object.prototype.hasOwnProperty.call(config, '_pageIncompletePromptEnabled')) pageModel.get('_pageIncompletePrompt')._isEnabled = config._pageIncompletePromptEnabled;
      else delete pageModel.get('_pageIncompletePrompt')._isEnabled;
    } else {
      pageModel.unset('_pageIncompletePrompt');
    }
    delete config._pageIncompletePromptExists;
    delete config._pageIncompletePromptEnabled;
  }

  onModelCompletionChanged () {
    this.invalidate();
  }

  onLinkClicked (e) {
    const $target = $(e.currentTarget);
    let id = $target.attr('href').slice(1);
    const model = data.findById(id);
    e.preventDefault();
    if ((e.ctrlKey || e.altKey) && this.el.defaultView) {
      id = id.replace(/-/g, '');
      this.el.defaultView[id] = model;
      this.el.defaultView.logging.debug('devtools: add property window.' + id + ':');
      this.el.defaultView.logging.debug(model);
    } else if (e.shiftKey) {
      this.navigateAndDisableTrickle(id);
    } else {
      this.navigateAndDisableTrickleUpTo(id);
    }
  }

  invalidate () {
    this._invalid = true;
  }

  /**
  * Navigate to the element with the given id (or as closely to it as possible). Disable trickle up to the given id.
  * N.B. because trickle cannot be reliably manipulated in situ we must reload the page. Trickle remains disabled on
  * affected article(s)|block(s).
  */
  navigateAndDisableTrickleUpTo (id) {
    const model = data.findById(id);
    const pageModel = data.findById(location._currentId);
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
        logging.debug('disabling trickle on ' + sibling.get('_id'));
        if (sibling.has('_trickle')) {
          sibling.get('_trickle')._isEnabled = false;
        } else {
          sibling.set('_trickle', { _isEnabled: false });
        }
      }
      // check if already on page
      if (location._currentId === model.findAncestor('contentObjects').get('_id')) {
        this.listenToOnce(Adapt, 'pageView:ready', () => {
          _.defer(() => {
            Router.navigateToElement($('.' + id));
            this.checkVisibility(id);
          });
        });
        if (location._currentId === Adapt.course.get('_id')) Router.handleRoute ? Router.handleRoute() : Router.handleCourse();
        else Router.handleId(location._currentId);
      } else {
        this.listenToOnce(Adapt, 'pageView:ready', () => {
          _.defer(() => {
            this.checkVisibility(id);
          });
        });
        Backbone.history.navigate('#/id/' + id, { trigger: true });
      }
    }
    // restore pageIncompletePrompt config
    this._restorePageIncompletePrompt(pageModel);
    this.invalidate();
  }

  /**
  * Navigate to the element with the given id (or as closely to it as possible). Disable trickle on containing
  * page temporarily.
  */
  navigateAndDisableTrickle (id) {
    const model = data.findById(id);
    const pageModel = data.findById(location._currentId);
    // first ensure page incomplete prompt won't activate
    this._disablePageIncompletePrompt(pageModel);
    if (model._siblings === 'contentObjects') {
      Backbone.history.navigate('#/id/' + id, { trigger: true });
    } else {
      // if already on page ensure trickle is disabled
      if (location._currentId === model.findAncestor('contentObjects').get('_id')) {
        Adapt.devtools.set('_trickleEnabled', false);
        Router.navigateToElement($('.' + id));
        this.checkVisibility(id);
      } else {
        // pick target model to determine trickle config according to trickle version (2.1 or 2.0.x)
        const targetModel = Adapt.trickle ? model.findAncestor('contentObjects') : Adapt.course;
        // if necessary disable trickle (until page is ready)
        if (!targetModel.has('_trickle')) {
          targetModel.set('_trickle', { _isEnabled: false });
          this.listenToOnce(Adapt, 'pageView:ready', () => {
            _.defer(() => {
              targetModel.get('_trickle')._isEnabled = true;
              this.checkVisibility(id);
            });
          });
        } else if (targetModel.get('_trickle')._isEnabled) {
          targetModel.get('_trickle')._isEnabled = false;
          this.listenToOnce(Adapt, 'pageView:ready', () => {
            _.defer(() => {
              targetModel.get('_trickle')._isEnabled = true;
              this.checkVisibility(id);
            });
          });
        }
        Backbone.history.navigate('#/id/' + id, { trigger: true });
      }
    }
    // restore pageIncompletePrompt config
    this._restorePageIncompletePrompt(pageModel);
    this.invalidate();
  }

  checkVisibility (id) {
    let model = data.findById(id);
    if ($('.' + id).is(':visible') || model === Adapt.course) return;
    while (!$('.' + id).is(':visible') && model !== Adapt.course) {
      model = model.getParent();
      id = model.get('_id');
    }
    logging.debug('adapt-devtools::checkVisibility scrolling to ancestor ' + id);
    Router.navigateToElement($('.' + id));
  }
}

class CourseMap extends Backbone.Controller {
  initialize () {
    this.listenToOnce(Adapt, 'adapt:initialize devtools:enable', this.onEnabled);
  }

  onEnabled() {
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

      // Strip HTML tags
      t = $(`<div>${t}</div>`).text();

      return t;
    }
    function when(prop, options) {
      if (this.get(prop)) {
        return options.fn(this);
      }
      return options.inverse(this);
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
      }
      return options.inverse(this);
    }
    Handlebars.registerHelper('isMenu', isMenu);
    Handlebars.registerHelper('eachChild', eachChild);
    Handlebars.registerHelper('getId', getId);
    Handlebars.registerHelper('getProp', getProp);
    Handlebars.registerHelper('getTitle', getTitle);
    Handlebars.registerHelper('when', when);
    Handlebars.registerHelper('isTrickled', isTrickled);
  }

  open () {
    if (!this.mapWindow) {
      this.mapWindow = window.open('assets/map.html', 'Map');
      return;
    }
    this.mapWindow.focus();
  }

  onMapClosed () {
    logging.debug('onMapClosed');
    this.mapWindow = null;
  }

  onMapLoaded (mapWindow) {
    logging.debug('onMapLoaded');
    this.mapWindow = mapWindow;
    this.mapWindow.focus();
    $('html', this.mapWindow.document).addClass($('html', window.document).attr('class'));
    this.mapView = new MapView({ model: Adapt, el: this.mapWindow.document });
    $(this.mapWindow).on('unload', this.onMapClosed.bind(this));
  }

  onCourseClosed () {
    if (!this.mapView) return;
    this.mapView.remove();
    // this.mapWindow.close();
  }
}

export default new CourseMap();
