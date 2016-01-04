# adapt-cheat

Revised developer/testing tool.

##Installation

* Download into ``src/extensions`` folder
* Add following to ``config.json``
```
    "_cheat": {
        "_isEnabled": true
    }
```

The extension features the following:

##Question hinting

Allows the user to toggle visual indicators which reveal how to answer questions correctly.

##Auto correct

When enabled, automatically provides the correct answer when submit is selected. If not enabled the user can shift-click the submit button to have the correct answer provided. N.B. this feature is only applicable to question types with correct answers, so this excludes for example confidence slider and linked confidence slider components.

##Tutor toggle

Allows the tutor extension to be hushed, preventing feedback popups when questions are answered by the user. Feedback can still be viewed by manually selecting the **Show Feedback** button if available.

##Unlock menu

When selected adapt-cheat will attempt to break any form of menu locking, e.g. linear step-locking, assessment locking etc.

##Untrickle

This feature appears whenever applicable. As the name implies selecting this will disable trickle and reveal all content on the current page.

##Pass

Similar to the original functionality, when selected unanswered question components in the page will be answered correctly. N.B. standard question components (gmcq, mcq, matching, question strip, slider, text input) will be answered naturally, as per the auto correct feature; revealing the correct responses, feedback and marking if applicable. The models of any other question components will be modified to indicate a correct answer, but their visual state may not change.

##Fail

As per the **Pass** functionality, but all unanswered questions wil be answered incorrectly. How the questions are answered incorrectly is random; where applicable questions may be answered partly correctly or incorrectly.

##Half

When selected approximately half of the unanswered questions on the page will be answered correctly, while the other half will be answered incorrectly. The choice of how each are answered is randomised.

##Developer tools

The core Adapt object can be reached via window.a for convenience.

With the browser developer console open, control-click content to reveal the underlying model (content object, article, block, component). Note that doing so also creates a global variable named according to the model's unique identifier.