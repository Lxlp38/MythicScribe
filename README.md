# What is MythicScribe?

MythicScribe is a VisualStudio Code extension that allows you to connect your MythicMobs configurations directly with its documentation, providing hover texts with informations regarding the pointed object and autocompletions for some of its syntax


## Features

### Autocompletions

![Autocompletion Demo](https://raw.githubusercontent.com/Lxlp38/MythicScribe/refs/heads/master/demos/autocompletion-demo.gif)
![Autocompletion Demo](https://raw.githubusercontent.com/Lxlp38/MythicScribe/refs/heads/master/demos/autocompletion2-demo.gif)

### Hover Informations

![Hover Demo](https://raw.githubusercontent.com/Lxlp38/MythicScribe/refs/heads/master/demos/hover-demo.gif)


## Extension Settings

This extension contributes the following settings:

* `MythicScribe.alwaysEnabled`: When enabled, the extension will no longer do any check to see if a document is a MythicMobs one
* `MythicScribe.regexForMythicmobsFile`: determine which files are Mythicmobs ones based on a custom regex
* `MythicScribe.regexForMetaskillFile`: determine which files are Metaskill ones based on a custom regex
* `MythicScribe.enableShortcuts`: Whether the Shortcuts feature should be active
* `MythicScribe.enableEmptyBracketsAutomaticRemoval`: Enable the removal of empty curly brackets `{}` by moving the cursor past them
* `MythicScribe.enableFileSpecificSuggestions`: Whether file specific suggestions (metaskill files, mob files) should be shown
* `MythicScribe.disableAcceptSuggestionOnEnter`: Whether the reminder to disable `editor.acceptSuggestionOnEnter` should be shown

## Known Issues
* When `editor.acceptSuggestionOnEnter` is not `off` and `MythicScribe.enableFileSpecificSuggestions` is enabled, all the completions on newline *will* stop users from comfortably add spacing in their metaskills and the likes. For this reason it is advised to set that configuration to `off`. The extension will still try to warn the user about this if the `MythicScribe.disableAcceptSuggestionOnEnter` configuration is active