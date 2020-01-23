define(function(require) {

  var Adapt = require('coreJS/adapt');

  var AltText = _.extend({

    initialize:function() {
      this.listenTo(Adapt.devtools, 'change:_altTextEnabled', this.toggleAltText);

      // if available we can use to avoid unnecessary checks
      if (typeof MutationObserver == 'function') {
        this.observer = new MutationObserver(_.bind(this.onDomMutation, this));
      }
    },

    addTimer:function(fireNow) {
      this.timerId = setInterval(_.bind(this.onTimer, this), 1000);
      if (fireNow) this.onTimer();
    },

    removeTimer:function() {
      clearInterval(this.timerId);
    },

    connectObserver:function() {
      if (this.observer) this.observer.observe(document.getElementById('wrapper'), {
        childList: true,
        subtree:true,
        attributes:true,
        attributeFilter:['class', 'style']
      });
    },

    disconnectObserver:function() {
      if (this.observer) this.observer.disconnect();
    },

    toggleAltText:function() {
      if (Adapt.devtools.get('_altTextEnabled')) {
        this.addTimer(true);
        this.connectObserver();
      }
      else {
        this.removeTimer();
        this.removeAllAnnotations();
        this.disconnectObserver();
      }
    },

    addAnnotation:function($img, $annotation) {
      var template = Handlebars.templates['devtoolsAnnotation'];
      var text = $img.attr('alt');

      if (!text) text = $img.attr('aria-label');

      var $annotation = $(template({text:text}));

      if (!text) $annotation.addClass('has-annotation-warning');

      $img.after($annotation);
      $img.data('annotation', $annotation);

      this.updateAnnotation($img, $annotation);
    },

    removeAnnotation:function($img, $annotation) {
      $annotation.remove();
      $img.removeData('annotation');
    },

    removeAllAnnotations:function() {
      $('img').each(_.bind(function(index, element) {
        var $img = $(element);
        var $annotation = $img.data('annotation');

        if ($annotation) this.removeAnnotation($img, $annotation);
      }, this));
    },

    updateAnnotation:function($img, $annotation) {
      var position = $img.position();
      position.left += parseInt($img.css('marginLeft'), 10) + parseInt($img.css('paddingLeft'), 10);
      position.top += parseInt($img.css('marginTop'), 10) + parseInt($img.css('paddingTop'), 10);
      $annotation.css(position);
    },

    onDomMutation:function(mutations) {
      this.mutated = true;
    },

    onTimer:function() {
      if (this.mutated === false) return;
      if (this.observer) this.mutated = false;

      //console.log('devtools::toggle-alt-text:run check');

      this.disconnectObserver();

      $('img').each(_.bind(function(index, element) {
        var $img = $(element);
        var $annotation = $img.data('annotation');
        var isVisible = $img.is(':visible');

        if (isVisible) {
          if (!$annotation) this.addAnnotation($img, $annotation);
          else this.updateAnnotation($img, $annotation);
        }
        else if ($annotation) {
          this.removeAnnotation($img, $annotation);
        }
      }, this));

      this.connectObserver();
    }
  }, Backbone.Events);

  Adapt.once('adapt:initialize devtools:enable', function() {
    if (!Adapt.devtools.get('_isEnabled')) return;

    AltText.initialize();
  });

  return AltText;

});
