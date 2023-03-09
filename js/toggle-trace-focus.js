import Adapt from 'core/js/adapt';

class TraceFocus extends Backbone.Controller {

  initialize () {
    Adapt.once('adapt:initialize devtools:enable', this.onEnabled);
  }

  onEnabled () {
    if (!Adapt.devtools.get('_isEnabled')) return;
    this.openingTags = /<[\\w-]+((\\s+[\\w-]+(\\s*=\\s*(?:".*?"|'.*?'|[^'">\\s]+))*)+\\s*|\\s*)\/?>/;
    this.consoleStyle = 'background: lightgray; color: blue';
    this.onFocusIn = _.bind(this.onFocusIn, this);

    this.listenTo(Adapt.devtools, 'change:_traceFocusEnabled', this.toggleTraceFocus);

    this.toggleTraceFocus();
  }

  toggleTraceFocus () {
    if (Adapt.devtools.get('_traceFocusEnabled')) {
      $('body').on('focusin', this.onFocusIn);
    } else {
      $('body').off('focusin', this.onFocusIn);
    }
  }

  onFocusIn (e) {
    if (!$('html').is('.ie, .Edge')) return console.log('%cfocussed', this.consoleStyle, e.target);

    const $el = $(e.target);

    if (!$el[0] || !$el[0].outerHTML) return console.log('focussed: ', e.target);

    let openingTag = this.openingTags.exec($el[0].outerHTML)[0];

    if (openingTag) {
      // add some context if possible
      // strip leading whitespace/nbsp and get first line of text
      const tokens = $el.text().replace(/[\s\xA0]*/, '').split(/\r\n|\r|\n/);

      if (tokens[0]) openingTag = openingTag.slice(0, 20) + '[...]';

      if ($('html').is('.ie8')) {
        console.log('focussed: ', openingTag, tokens[0]);
      } else {
        console.log('focussed: ', openingTag, tokens[0], $el);
      }
    } else {
      console.log('focussed: ' + e.target);
    }
  }
}

export default new TraceFocus();
