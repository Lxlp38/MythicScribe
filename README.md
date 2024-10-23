# Table of Contents

- [What is MythicScribe](#what-is-mythicscribe)
- [Features](#features)
  - [Autocompletions](#autocompletions)
  - [Hover Information](#hover-informations)
- [Extension Settings](#extension-settings)
- [Known Issues](#known-issues)
- [Credits and Acknowledgements](#credits-and-acknowledgements)

# What is MythicScribe?

MythicScribe is a Visual Studio Code extension that connects your MythicMobs configurations with its documentation. It provides hover text with information about the pointed object and offers autocompletions for some of its syntax


# Features

### Autocompletions
![Autocompletion Demo](https://raw.githubusercontent.com/Lxlp38/MythicScribe/refs/heads/master/demos/autocompletion-demo.gif)
![Autocompletion Demo](https://raw.githubusercontent.com/Lxlp38/MythicScribe/refs/heads/master/demos/autocompletion2-demo.gif)

### Hover Information
![Hover Demo](https://raw.githubusercontent.com/Lxlp38/MythicScribe/refs/heads/master/demos/hover-demo.gif)


# Extension Settings

This extension contributes the following settings:

* `MythicScribe.alwaysEnabled`: When enabled, the extension will no longer do any check to see if a document is a MythicMobs one
* `MythicScribe.regexForMythicmobsFile`: Determines which files are recognized as MythicMobs files based on a custom regex
* `MythicScribe.regexForMetaskillFile`: Determines which files are recognized as Metaskills files based on a custom regex
* `MythicScribe.regexForMobFile`: Determines which files are recognized as Mobs files based on a custom regex
* `MythicScribe.datasetSource`: Which dataset to use. `GitHub` or `Local`
* `MythicScribe.enableShortcuts`: Whether the Shortcuts feature should be active
* `MythicScribe.enableEmptyBracketsAutomaticRemoval`: Enable the removal of empty curly brackets `{}` by moving the cursor past them
* `MythicScribe.enableFileSpecificSuggestions`: Whether file specific suggestions (metaskill files, mob files) should be shown
* `MythicScribe.disableAcceptSuggestionOnEnter`: Whether the reminder to disable `editor.acceptSuggestionOnEnter` should be shown


# Known Issues

* When `editor.acceptSuggestionOnEnter` is not `off` and `MythicScribe.enableFileSpecificSuggestions` is enabled, all the completions on newline *will* stop users from comfortably add spacing in their metaskills and the likes. For this reason, it is recommended to set this configuration to `off`. The extension will still try to warn the user about this if the `MythicScribe.disableAcceptSuggestionOnEnter` configuration is active


# Credits and Acknowledgements
- [@maecy](https://twitter.com/maecy_official?s=21&t=ZBZ5BDKcoa6LYFwgd690_A), for creating and providing this extension's ⭐awesome⭐ icon and the [Stellius Team](https://stellius.net/) in general for the collaboration!