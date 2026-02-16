import Backbone from 'backbone';
import Adapt from 'core/js/adapt';
import helpers from './helpers';

const { HEADING_SELECTOR, OVERLAY_SELECTOR, computeAccessibleName, computeAccessibleDescription, getAnnotationPosition } = helpers;

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
    this.isInOverlay = options.isInOverlay || false;
    this.$el.data('annotating', this.$parent);
    this.$el.data('view', this);
  }

  render() {
    const template = Handlebars.templates.devtoolsAnnotation;
    const name = computeAccessibleName(this.$parent, this.allowText);
    const description = computeAccessibleDescription(this.$parent);
    this.$el.html(template({ name, description }));
    if (!name) this.$el.addClass('has-annotation-warning');
    const position = getAnnotationPosition(this.$parent, this.$el, this.isInOverlay);
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
      'notify:opened drawer:opened drawer:openedCustomView': this.onOverlayOpened,
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
    this.stopListening(Adapt, 'notify:opened drawer:opened drawer:openedCustomView', this.onOverlayOpened);
    this.stopListening(Adapt, 'popup:closed notify:closed drawer:closed', this.onDomMutation);
    this.stopListening(Adapt, 'remove', this.removeAllAnnotations);
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

  addAnnotation($element, allowText, isInOverlay) {
    const annotation = new Annotation({
      $parent: $element,
      allowText,
      isInOverlay
    });

    if (isInOverlay) {
      $element.closest(OVERLAY_SELECTOR).append(annotation.$el);
    } else {
      $('.devtools__annotations').append(annotation.$el);
    }

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
      const isHeadingHeightZero = $element.is(HEADING_SELECTOR) && $element.height() === 0;
      if (!isOutOfDom && ($element.onscreen().onscreen || isHeadingHeightZero || annotation.isInOverlay)) return;
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

  onOverlayOpened() {
    // Wait for next frame to ensure overlay DOM layout is complete
    this.mutated = false;
    requestAnimationFrame(() => {
      this.mutated = false;
      this.onDomMutation();
    });
  }

  render() {
    if (this.mutated === false) return;
    this.clearUpAnnotations();
    const $headings = $(HEADING_SELECTOR);
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
        const allowText = $element.is(`.aria-label,${HEADING_SELECTOR}`);
        const isOutOfDom = ($element.parents('html').length === 0);
        const isHeadingHeightZero = $element.is(HEADING_SELECTOR) && $element.height() === 0;
        const isInOverlay = $element.closest(OVERLAY_SELECTOR).length > 0;
        if (!isOutOfDom && (isVisible || isHeadingHeightZero || isInOverlay) && (isNotAriaHidden || (!isAriaHidden && !isParentAriaHidden) || (isImg && !isParentAriaHidden))) {
          if (!annotation) this.addAnnotation($element, allowText, isInOverlay);
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
