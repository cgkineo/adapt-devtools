# adapt-devtools
Dev Tools is an *extension* that assists with course development and testing.<br>
![](https://raw.githubusercontent.com/wiki/cgkineo/adapt-devtools/adapt-cheat-preview.gif)

## Installation

* Download into ``src/extensions`` folder
* Add following to ``config.json``
```
    "_devtools": {
        "_isEnabled": true
    }
```

Once installed, a button is added to the navigation bar. By default, this is a cog icon. Select the button to reveal the following features.

**Important:** if using [adapt-contrib-trickle](https://github.com/adaptlearning/adapt-contrib-trickle), please ensure that you are using the latest version.

## Attributes

The attributes listed below are used in *config.json*.

### **\_devtools** (object)

The Dev Tools object contains the following settings:

#### **\_isEnabled** (boolean)

Controls whether the Dev Tools extension is enabled

#### **\_debugFile** (string)

Path to an optional JSON file used for debugging (e.g. *course/dev.json*). This file contains the property `_modelsToRemove` which represents the identifiers of models (and their descendants) to be completely removed from the course. See *example.json*.

## General options

### Question hinting

Allows the user to toggle visual indicators which reveal how to answer correctly standard question components (gmcq, mcq, matching, ppq, question strip, slider, text input).

### Auto correct

When enabled, automatically provides the correct answer when submit is selected. If not enabled, the user can Control+Click or Alt+Click for Windows / Option+Click for macOS the submit button to have the correct answer provided. Standard question components will be answered naturally; revealing the correct responses, feedback and marking if applicable. The plugin will not attempt to do this for bespoke questions or questions that do not have correct answers (e.g. confidence slider), but their models will still be modified to indicate that they are complete and correct.

### Tutor

Allows the tutor extension to be hushed, preventing feedback popups when questions are answered by the user. Feedback can still be viewed by manually selecting the **Show Feedback** button if available.

### Show alt text

Displays any alt text for images.

### Unlock

Once selected adapt-devtools will disable Adapt core locking (>=v2.0.9) throughout the course. For courses using older versions of the Adapt framework this feature will only attempt to break locking on menus, e.g. linear step-locking, assessment locking etc.

### Course map

Select this button to reveal an interactive diagram of the course structure. The diagram will reveal all structural elements (content objects, articles, blocks and components) arranged in an intuitive way, reflecting both the hierarchical relationship of the elements and the vertical arrangement of content within each page. The map can be used to navigate directly to any element in the course. Performing a Control+Click or Alt+Click for Windows / Option+Click for macOS will reveal the model of the selected course element in the browser console.

The course map uses the following legend:

* **Green fill:** element is complete
* **Red fill:** element is incomplete
* **Yellow triangle:** element is [trickled](https://github.com/adaptlearning/adapt-contrib-trickle)
* **Grey fill:** element is optional (`_isOptional: true`)

### Spoor log

Opens up the Spoor log in a popup window.

## Page options

### Question banks

If banking is used in an assessment in the current page, this can be toggled on and off. N.B. if the current page has more than one banked assessment, then the toggle will be applied to each (when invoked all banked assessments in the page will have banking toggled on or off).

### Untrickle

This feature appears whenever applicable. As the name implies selecting this will disable [trickle](https://github.com/adaptlearning/adapt-contrib-trickle) and reveal all content in the current page.

### Complete page

Completes all articles, blocks and components in the content object.

### Pass

Similar to the original functionality, when selected unanswered question components in the current page will be answered correctly. All non-question components will be completed.

### Fail

As per the **Pass** functionality, but all unanswered questions in the current page will be answered incorrectly. How the questions are answered incorrectly is random; therefore, where applicable, questions may be answered partly correctly or incorrectly.

### Half

When selected, approximately half of the unanswered questions in the current page will be answered correctly, while the other half will be answered incorrectly. The choice of how each are answered is randomised.

## Menu options

### Unlock menu

Unlocks all content objects on the menu but keeps all other locking intact. This is useful for accessing content objects that are locked via the `_lockType` attribute.

### Complete menu

Completes all content objects on the menu.

## Extended options

### Trace Focus

Toggles trace focus.

## Developer tools

Once the Dev Tools drawer has been *opened* for the first time, the core Adapt object can be reached via the `Adapt` reference for the remainder of the session.

To display the underlying model for any content object, article, block or component, with the browser's console open: hold down the left mouse button on the relevant element then press <kbd>m</kbd>. Note that doing so also creates a global variable named according to the model's unique identifier.

----------------------------
**Author / maintainer:** Kineo <br>
**Cross-platform coverage:** Chrome, Chrome for Android, Firefox (ESR + latest version), Edge, Safari for macOS/iOS/iPadOS, Opera <br>
