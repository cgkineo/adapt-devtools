import Backbone from 'backbone';
import Adapt from 'core/js/adapt';
import helpers from './helpers';

const computeAccesibleName = helpers.computeAccesibleName;
const computeAccessibleDescription = helpers.computeAccessibleDescription;
const getAnnotationPosition = helpers.getAnnotationPosition;

class Annotation extends Backbone.View {

  className() {
    return 'devtools__annotation';
  }

  tagName() {
    return 'span';
  }

  initialize(options) {
    this.$parent = options.$parent;
    this.allowText = options.allowText;
    this.$el.data('annotating', this.$parent);
    this.$el.data('view', this);
  }

  render() {
    const template = Handlebars.templates.devtoolsAnnotation;
    const name = computeAccesibleName(this.$parent, this.allowText);
    const description = computeAccessibleDescription(this.$parent);
    this.$el.html(template({ name, description }));
    if (!name) this.$el.addClass('has-annotation-warning');
    const position = getAnnotationPosition(this.$parent, this.$el);
    this.$el.css(position.css);
    this.$el.removeClass('is-top is-left is-right is-bottom is-contained');
    this.$el.addClass(position.className);
  }

  showOutline() {
    this.$parent.addClass('devtools__annotation-outline');
    this.$el.addClass('has-mouse-over');
  }

  hideOutline() {
    this.$parent.removeClass('devtools__annotation-outline');
    this.$el.removeClass('has-mouse-over');
  }

}

class AltText extends Backbone.Controller {

  initialize() {
    this.onDomMutation = this.onDomMutation.bind(this);
    this.listenToOnce(Adapt, 'adapt:initialize devtools:enable', this.onEnabled);
  }

  onEnabled () {
    if (!Adapt.devtools.get('_isEnabled')) return;
    _.bindAll(this, 'onDomMutation', 'render', 'onMouseOver');
    this.mutations = [];
    this.mutated = false;
    this.listenTo(Adapt.devtools, 'change:_altTextEnabled', this.toggleAltText);
    $('body').append($('<div class="devtools__annotations" aria-hidden="true"></div>'));
    // if available we can use to avoid unnecessary checks
    if (typeof MutationObserver === 'function') {
      this.observer = new MutationObserver(this.onDomMutation);
    }
  }

  connectObserver() {
    if (this.observer) {
      this.observer.observe(document.querySelector('html'), {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [
          'class',
          'style',
          'aria-label',
          'aria-labelledby',
          'alt',
          'aria-describedby',
          'for',
          'aria-valuetext',
          'aria-valuenow',
          'tabindex',
          'aria-hidden'
        ]
      });
    }
    this.listenTo(Adapt, {
      'popup:closed notify:closed drawer:closed': this.onDomMutation,
      remove: this.removeAllAnnotations
    });
    $(window).on('scroll', this.onDomMutation);
    $(document).on('mouseover', '*', this.onMouseOver);
  }

  onMouseOver(event) {
    // Ignore propagated events
    if (event.currentTarget !== event.target) return;
    // Fetch first found tooltip element from target, through parents to html
    const $mouseoverEl = $(event.currentTarget).parents().add(event.currentTarget).filter('.devtools__annotation').last();
    if (this._outlineEl === $mouseoverEl) return;
    this._outlineEl = $mouseoverEl;
    if (!$mouseoverEl.length) return this.hideOutline();
    this.showOutline($mouseoverEl);
  }

  hideOutline() {
    $('.devtools__annotation').each((index, element) => {
      const $annotation = $(element);
      const annotation = $annotation.data('view');
      annotation.hideOutline();
    });
  }

  showOutline($mouseoverEl) {
    const annotation = $mouseoverEl.data('view');
    annotation.showOutline();
  }

  disconnectObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.stopListening(Adapt, 'popup:closed notify:closed drawer:closed', this.onDomMutation);
    $(window).off('scroll', this.onDomMutation);
    $(document).off('mouseover', '*', this.onMouseOver);
  }

  toggleAltText() {
    if (!Adapt.devtools.get('_altTextEnabled')) {
      this.mutated = false;
      this.disconnectObserver();
      this.removeAllAnnotations();
      return;
    }
    this.onDomMutation();
    this.connectObserver();
  }

  addAnnotation($element, allowText) {
    const annotation = new Annotation({ $parent: $element, allowText });
    $('.devtools__annotations').append(annotation.$el);
    $element.data('annotation', annotation);
    $element.attr('data-annotated', true);
    this.updateAnnotation($element, annotation, allowText);
  }

  removeAnnotation($element, annotation) {
    annotation.remove();
    $element.removeAttr('data-annotated');
    $element.removeData('annotation');
  }

  removeAllAnnotations() {
    $('.devtools__annotation').each((index, element) => {
      const $annotation = $(element);
      const $element = $annotation.data('annotating');
      const annotation = $annotation.data('view');
      if (!$element) return;
      this.removeAnnotation($element, annotation);
    });
  }

  clearUpAnnotations() {
    $('.devtools__annotation').each((index, element) => {
      const $annotation = $(element);
      const $element = $annotation.data('annotating');
      const annotation = $annotation.data('view');
      if (!$element) return;
      const isOutOfDom = ($element.parents('html').length === 0);
      const isHeadingHeightZero = $element.is('h1,h2,h3,h4,h5,h6,h7,[role=heading]') && $element.height() === 0;
      if (!isOutOfDom && ($element.onscreen().onscreen || isHeadingHeightZero)) return;
      this.removeAnnotation($element, annotation);
    });
  }

  updateAnnotation($element, annotation, allowText) {
    annotation.render();
  }

  onDomMutation(mutations) {
    if (this.mutated) return;
    requestAnimationFrame(this.render);
    this.mutated = true;
  }

  render() {
    if (this.mutated === false) return;
    this.clearUpAnnotations();
    const $headings = $('h1,h2,h3,h4,h5,h6,h7,[role=heading]');
    const $labelled = $([
      '.aria-label',
      '[alt]',
      '[aria-label]',
      '[aria-labelledby]',
      '[aria-describedby]',
      '[aria-activedescendant]',
      '[aria-valuetext]',
      '[aria-valuenow]',
      '[role=listbox]',
      '[aria-hidden]'
    ].join(','));
    $labelled
      .filter((index, element) => !$(element).parents().filter($headings).length)
      .add($headings)
      .each((index, element) => {
        const $element = $(element);
        const annotation = $element.data('annotation');
        const isVisible = $element.onscreen().onscreen;
        const isParentAriaHidden = Boolean($element.parents().filter('[aria-hidden=true]').length);
        const isAriaHidden = Boolean($element.filter('[aria-hidden=true]').length);
        const isNotAriaHidden = Boolean($element.filter('[aria-hidden=false]').length);
        const isImg = $element.is('img');
        const allowText = $element.is('.aria-label,h1,h2,h3,h4,h5,h6,h7,[role=heading]');
        const isOutOfDom = ($element.parents('html').length === 0);
        const isHeadingHeightZero = $element.is('h1,h2,h3,h4,h5,h6,h7,[role=heading]') && $element.height() === 0;
        if (!isOutOfDom && (isVisible || isHeadingHeightZero) && (isNotAriaHidden || (!isAriaHidden && !isParentAriaHidden) || (isImg && !isParentAriaHidden))) {
          if (!annotation) this.addAnnotation($element, allowText);
          else this.updateAnnotation($element, annotation, allowText);
        } else if (annotation) {
          this.removeAnnotation($element, annotation);
        }
      });

    if (this.observer) this.observer.takeRecords();
    this.mutated = false;
  }

}

export default new AltText();
