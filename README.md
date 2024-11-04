<div align="center"><img src="./assets/icon.png" height=120></div>
<div align="center"><h1>MythicScribe</h1></div>

<div align="center">
    <img alt="GitHub Release" src="https://img.shields.io/github/v/release/Lxlp38/MythicScribe">
    <a href="https://www.codefactor.io/repository/github/lxlp38/mythicscribe/overview/master">
      <img src="https://www.codefactor.io/repository/github/lxlp38/mythicscribe/badge/master" alt="CodeFactor" />
    </a>
    <a href="https://github.com/Lxlp38/MythicScribe/blob/main/LICENSE.txt">
        <img alt="GitHub License" src="https://img.shields.io/github/license/Lxlp38/MythicScribe">
    </a>
</div>

<div align="center">
  <img alt="Visual Studio Marketplace Installs" src="https://img.shields.io/visual-studio-marketplace/i/Lxlp.mythicscribe">
  <img alt="GitHub commit activity" src="https://img.shields.io/github/commit-activity/t/Lxlp38/MythicScribe">
</div>

<div align="center">
A Visual Studio Code extension that connects your MythicMobs configurations with its documentation.
</div>
<div align="center">
It provides hover text with information about the pointed object and offers autocompletions for some of its syntax
</div>

# Table of Contents

- [Features](#features)
  - [Autocompletions](#autocompletions)
  - [Hover Information](#hover-informations)
- [Extension Settings](#extension-settings)
- [Known Issues](#known-issues)
- [Credits and Acknowledgements](#credits-and-acknowledgements)

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
* `MythicScribe.attributeAliasUsedInCompletions`: Which attribute alias to use for completions. Defaults to `main`

# Known Issues

* When `editor.acceptSuggestionOnEnter` is not `off` and `MythicScribe.enableFileSpecificSuggestions` is enabled, all the completions on newline *will* stop users from comfortably add spacing in their metaskills and the likes. For this reason, it is recommended to set this configuration to `off`. The extension will still try to warn the user about this if the `MythicScribe.disableAcceptSuggestionOnEnter` configuration is active


# Credits and Acknowledgements
- [@maecy](https://twitter.com/maecy_official?s=21&t=ZBZ5BDKcoa6LYFwgd690_A), for creating and providing this extension's ⭐awesome⭐ icon and the [Stellius Team](https://stellius.net/) in general for the collaboration!