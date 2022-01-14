define([], function(require) {

  const Adapt = require('coreJS/adapt');

  function onShowFeedback() {
    // trickle waits for tutor to close so pretend that this happens
    // Adapt.trigger('tutor:opened'); trickle-tutorPlugin doesn't actually listen to this(!)
    Adapt.trigger('tutor:closed');
  }

  function hushTutor() {
    Adapt.devtools.set('_tutorListener', Adapt._events['questionView:showFeedback'].pop());
    Adapt.on('questionView:showFeedback', onShowFeedback);
  }

  function reinstateTutor() {
    Adapt.off('questionView:showFeedback', onShowFeedback);

    if (!Adapt._events.hasOwnProperty('questionView:showFeedback')) {
      Adapt._events['questionView:showFeedback'] = [];
    }

    Adapt._events['questionView:showFeedback'].push(Adapt.devtools.get('_tutorListener'));
  }

  function onFeedbackToggled() {
    if (Adapt.devtools.get('_feedbackEnabled')) {
      reinstateTutor();
      $(document).off('mouseup', '.js-btn-feedback');
    } else {
      hushTutor();
      $(document).on('mouseup', '.js-btn-feedback', onFeedbackButtonClicked);
    }
  }

  function onFeedbackButtonClicked(e) {
    const classes = $(e.currentTarget).parents('.component').attr('class');
    const componentId = /[\s]+(c\-[^\s]+)/.exec(classes)[1];

    if (componentId) {
      // bring tutor back temporarily
      reinstateTutor();
      // tutor expects a view, but it's not actually needed
      Adapt.trigger('questionView:showFeedback', { model: Adapt.findById(componentId) });
      // and hush it again
      hushTutor();
    } else console.error('devtools:onFeedbackButtonClicked: malformed component class name');
  }

  Adapt.once('adapt:initialize devtools:enable', function() {
    if (!Adapt.devtools.get('_isEnabled')) return;

    if (Adapt.devtools.get('_toggleFeedbackAvailable')) {
      // assume single registrant is adapt-contrib-tutor
      if (Adapt._events.hasOwnProperty('questionView:showFeedback') && Adapt._events['questionView:showFeedback'].length == 1) {
        Adapt.devtools.on('change:_feedbackEnabled', onFeedbackToggled);
      } else {
        console.warn('devtools: no tutor or multiple registrants of questionView:showFeedback so disabling ability to toggle feedback.');
        Adapt.devtools.set('_toggleFeedbackAvailable', false);
      }
    }
  });

});
