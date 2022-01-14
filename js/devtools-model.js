define([], function(require) {

  const Adapt = require('coreJS/adapt');

  const DevtoolsModel = Backbone.Model.extend({

    initialize: function() {
      const config = Adapt.config.has('_devtools') ? Adapt.config.get('_devtools') : this.getDefaultConfig();
      this.set(_.extend({
        _trickleEnabled: false,
        _hintingAvailable: true,
        _hintingEnabled: false,
        _toggleFeedbackAvailable: true,
        _feedbackEnabled: true,
        _autoCorrectAvailable: true,
        _autoCorrectEnabled: false,
        _altTextAvailable: true,
        _altTextEnabled: false,
        _tutorListener: null,
        _unlockAvailable: true,
        _unlocked: false,
        _toggleBankingAvailable: true,
        _traceFocusAvailable: true,
        _traceFocusEnabled: false,
        _extended: true
      }, config));
    },

    getDefaultConfig: function() {
      return {
        _isEnabled: false,
        _extended: true
      };
    },

    toggleFeedback: function() {
      this.set('_feedbackEnabled', !this.get('_feedbackEnabled'));
    },

    toggleHinting: function() {
      this.set('_hintingEnabled', !this.get('_hintingEnabled'));
    },

    toggleAutoCorrect: function() {
      this.set('_autoCorrectEnabled', !this.get('_autoCorrectEnabled'));
    },

    toggleAltText: function() {
      this.set('_altTextEnabled', !this.get('_altTextEnabled'));
    },

    toggleTraceFocus: function() {
      this.set('_traceFocusEnabled', !this.get('_traceFocusEnabled'));
    }
  });

  return DevtoolsModel;

});
