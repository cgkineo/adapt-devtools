define([
  'core/js/adapt',
  './helpers'
], function(Adapt, helpers) {

  const computeAccesibleName = helpers.computeAccesibleName;
  const computeAccessibleDescription = helpers.computeAccessibleDescription;
  const getAnnotationPosition = helpers.getAnnotationPosition;

  const AltText = _.extend({

    initialize: function() {
      _.bindAll(this, 'onDomMutation', 'render');
      this.mutations = [];
      this.mutated = false;
      this.listenTo(Adapt.devtools, 'change:_altTextEnabled', this.toggleAltText);
      $('body').append($('<div class="devtools__annotations"></div>'));
      // if available we can use to avoid unnecessary checks
      if (typeof MutationObserver === 'function') {
        this.observer = new MutationObserver(_.bind(this.onDomMutation, this));
      }
    },

    connectObserver: function() {
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
    },

    disconnectObserver: function() {
      if (!this.observer) {
        this.observer.disconnect();
      }
      this.stopListening(Adapt, 'popup:closed notify:closed drawer:closed', this.onDomMutation);
      $(window).off('scroll', this.onDomMutation);
    },

    toggleAltText: function() {
      if (!Adapt.devtools.get('_altTextEnabled')) {
        this.mutated = false;
        this.disconnectObserver();
        this.removeAllAnnotations();
        return;
      }
      this.onDomMutation();
      this.connectObserver();
    },

    addAnnotation: function($element, $annotation, allowText) {
      $annotation = $('<span class="devtools__annotation"></span>');
      $('.devtools__annotations').append($annotation);
      $element.data('annotation', $annotation);
      $annotation.data('annotating', $element);
      $element.attr('data-annotated', true);
      this.updateAnnotation($element, $annotation, allowText);
    },

    removeAnnotation: function($element, $annotation) {
      $annotation.remove();
      $element.removeAttr('data-annotated');
      $element.removeData('annotation');
    },

    removeAllAnnotations: function() {
      $('.devtools__annotation').each(_.bind(function(index, annotation) {
        const $annotation = $(annotation);
        const $element = $annotation.data('annotating');
        if (!$element) return;
        this.removeAnnotation($element, $annotation);
      }, this));
    },

    clearUpAnnotations: function() {
      $('.devtools__annotation').each(_.bind(function(index, annotation) {
        const $annotation = $(annotation);
        const $element = $annotation.data('annotating');
        if (!$element) return;
        if ($element.onscreen().onscreen) return;
        this.removeAnnotation($element, $annotation);
      }, this));
    },

    updateAnnotation: function($element, $annotation, allowText) {
      const template = Handlebars.templates.devtoolsAnnotation;
      const name = computeAccesibleName($element, allowText);
      const description = computeAccessibleDescription($element);
      $annotation.html(template({ name, description }));
      if (!name) $annotation.addClass('has-annotation-warning');
      $annotation.css(getAnnotationPosition($element, $annotation));
    },

    onDomMutation: function(mutations) {
      if (this.mutated) return;
      if (mutations instanceof Array) {
        this.mutations.push.apply(this.mutations, mutations);
      }
      requestAnimationFrame(this.render);
      this.mutated = true;
    },

    render: function() {
      if (this.mutated === false) return;

      this.clearUpAnnotations();

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
        .each(_.bind(function(index, element) {
          const $element = $(element);
          const $annotation = $element.data('annotation');
          const isVisible = $element.onscreen().onscreen;
          const isAriaHidden = Boolean($element.parents().add($element).filter('[aria-hidden=true]').length);
          const isImg = $element.is('img');
          const allowText = $element.is('.aria-label');

          if (isVisible && (!isAriaHidden || isImg)) {
            if (!$annotation) this.addAnnotation($element, $annotation, allowText);
            else this.updateAnnotation($element, $annotation, allowText);
          } else if ($annotation) {
            this.removeAnnotation($element, $annotation);
          }
        }, this));

      this.mutated = false;
    }

  }, Backbone.Events);

  Adapt.once('adapt:initialize devtools:enable', function() {
    if (!Adapt.devtools.get('_isEnabled')) return;

    AltText.initialize();
  });

  return AltText;

});
