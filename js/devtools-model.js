import Adapt from 'core/js/adapt';

export default class DevtoolsModel extends Backbone.Model {

  initialize() {
    const config = Adapt.config.has('_devtools') ? Adapt.config.get('_devtools') : this.getDefaultConfig();
    this.set({
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
      _extended: true,
      ...config
    });
  }

  getDefaultConfig() {
    return {
      _isEnabled: false,
      _extended: true
    };
  }

  toggleFeedback() {
    this.set('_feedbackEnabled', !this.get('_feedbackEnabled'));
  }

  toggleHinting() {
    this.set('_hintingEnabled', !this.get('_hintingEnabled'));
  }

  toggleAutoCorrect() {
    this.set('_autoCorrectEnabled', !this.get('_autoCorrectEnabled'));
  }

  toggleAltText() {
    this.set('_altTextEnabled', !this.get('_altTextEnabled'));
  }

  toggleTraceFocus() {
    this.set('_traceFocusEnabled', !this.get('_traceFocusEnabled'));
  }
}
