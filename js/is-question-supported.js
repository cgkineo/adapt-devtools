define([], function(require) {

  function isQuestionSupported(model) {
    switch (model.get('_component')) {
      case 'mcq':
      case 'gmcq':
      case 'matching':
      case 'ppq':
      case 'slider':
      case 'textinput':
      case 'questionStrip':return true;
      default: return false;
    }
  }

  return isQuestionSupported;

});
