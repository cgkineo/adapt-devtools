import Adapt from 'core/js/adapt';
import logging from 'core/js/logging';

class TraceFocus extends Backbone.Controller {

  initialize () {
    this.listenToOnce(Adapt, 'adapt:initialize devtools:enable', this.onEnabled);
  }

  onEnabled () {
    if (!Adapt.devtools.get('_isEnabled')) return;
    this.openingTags = /<[\\w-]+((\\s+[\\w-]+(\\s*=\\s*(?:".*?"|'.*?'|[^'">\\s]+))*)+\\s*|\\s*)\/?>/;
    this.consoleStyle = 'background: lightgray; color: blue';
    this.onFocusIn = this.onFocusIn.bind(this);
    this.listenTo(Adapt.devtools, 'change:_traceFocusEnabled', this.toggleTraceFocus);
    this.toggleTraceFocus();
  }

  toggleTraceFocus () {
    if (Adapt.devtools.get('_traceFocusEnabled')) {
      $('body').on('focusin', this.onFocusIn);
      return;
    }
    $('body').off('focusin', this.onFocusIn);
  }

  onFocusIn (e) {
    if (!$('html').is('.ie, .Edge')) return logging.debug('%cfocussed', this.consoleStyle, e.target);
    const $el = $(e.target);
    if (!$el[0] || !$el[0].outerHTML) return logging.debug('focussed: ', e.target);
    let openingTag = this.openingTags.exec($el[0].outerHTML)[0];
    if (!openingTag) {
      logging.debug('focussed: ' + e.target);
      return;
    }
    // add some context if possible
    // strip leading whitespace/nbsp and get first line of text
    const tokens = $el.text().replace(/[\s\xA0]*/, '').split(/\r\n|\r|\n/);
    if (tokens[0]) openingTag = openingTag.slice(0, 20) + '[...]';
    if ($('html').is('.ie8')) {
      logging.debug('focussed: ', openingTag, tokens[0]);
      return;
    }
    logging.debug('focussed: ', openingTag, tokens[0], $el);
  }
}

export default new TraceFocus();
