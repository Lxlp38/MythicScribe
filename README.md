<div align="center"><img src="./assets/icon.png" height=120></div>
<div align="center"><h1>MythicScribe</h1></div>


<div align="center">
    <a href="https://github.com/Lxlp38/MythicScribe/releases">
      <img alt="GitHub Release" src="https://img.shields.io/github/v/release/Lxlp38/MythicScribe">
    </a>
    <a href="https://www.codefactor.io/repository/github/lxlp38/mythicscribe/overview/master">
      <img src="https://www.codefactor.io/repository/github/lxlp38/mythicscribe/badge/master" alt="CodeFactor" />
    </a>
    <a href="https://github.com/Lxlp38/MythicScribe/blob/master/LICENSE.txt">
      <img alt="GitHub License" src="https://img.shields.io/github/license/Lxlp38/MythicScribe">
    </a>
</div>

<div align="center">
    <a href="https://marketplace.visualstudio.com/items?itemName=Lxlp.mythicscribe">
      <img alt="Visual Studio Marketplace" src="https://vsmarketplacebadges.dev/version-short/Lxlp.mythicscribe.png">
    </a>
    <a href="https://discord.gg/UgcPG5ADDe">
        <img src="https://discordapp.com/api/guilds/1303771917022658591/widget.png?style=shield" alt="Discord Link"/>
    </a>
</div>

<div align="center">
A Visual Studio Code extension that connects your MythicMobs configurations with its documentation.
</div>
<div align="center">
It provides hover text with information about the pointed object and offers autocompletions for some of its syntax
</div>

- [Features](#features)
    - [Syntax Highlighting](#syntax-highlighting)
    - [Autocompletions](#autocompletions)
    - [Hover Information](#hover-information)
    - [Formatter](#formatter)
- [Extension Settings](#extension-settings)
- [Extension Commands](#extension-commands)
- [Known Issues](#known-issues)
- [Dev Builds](#dev-builds)
- [Credits and Acknowledgements](#credits-and-acknowledgements)


# Features

### Syntax Highlighting
![Syntax Highlighting Demo](https://raw.githubusercontent.com/Lxlp38/MythicScribe/refs/heads/master/demos/syntax-highlighting-demo.png)

### Autocompletions
![Autocompletion Demo](https://raw.githubusercontent.com/Lxlp38/MythicScribe/refs/heads/master/demos/autocompletion-demo.gif)
![Autocompletion Demo](https://raw.githubusercontent.com/Lxlp38/MythicScribe/refs/heads/master/demos/autocompletion2-demo.gif)

### Hover Information
![Hover Demo](https://raw.githubusercontent.com/Lxlp38/MythicScribe/refs/heads/master/demos/hover-demo.gif)

### Formatter
![Formatter Demo](https://raw.githubusercontent.com/Lxlp38/MythicScribe/refs/heads/master/demos/formatter-demo.gif)


# Extension Settings

* `MythicScribe.alwaysEnabled`: When enabled, the extension will no longer do any check to see if a document is a MythicMobs one
* `MythicScribe.fileRegex.MythicMobs`: Determines which files are recognized as MythicMobs files based on a custom regex
* `MythicScribe.fileRegex.Metaskill`: Determines which files are recognized as Metaskill files based on a custom regex
* `MythicScribe.fileRegex.Mob`: Determines which files are recognized as Mob files based on a custom regex
* `MythicScribe.fileRegex.Item`: Determines which files are recognized as Item files based on a custom regex
* `MythicScribe.fileRegex.Droptable`: Determines which files are recognized as Droptable files based on a custom regex
* `MythicScribe.enableMythicScriptSyntax`: Whether the extension should automatically convert the document types from yaml to MythicScript if it's recognized as a MythicMobs file. This does not change the file or its extension in any way, while also enabling mythic-specific syntax highlighting
* `MythicScribe.datasetSource`: Which dataset to use. `GitHub` or `Local`
* `MythicScribe.minecraftVersion`: Specify the minecraft version whose datasets to use 
* `MythicScribe.enableShortcuts`: Whether the Shortcuts feature should be active
* `MythicScribe.enableEmptyBracketsAutomaticRemoval`: Enable the removal of empty curly brackets `{}` by moving the cursor past them
* `MythicScribe.enableFileSpecificSuggestions`: Whether file specific suggestions (metaskill files, mob files) should be shown
* `MythicScribe.disableAcceptSuggestionOnEnter`: Whether the reminder to disable `editor.acceptSuggestionOnEnter` should be shown
* `MythicScribe.attributeAliasUsedInCompletions`: Which attribute alias to use for completions. Defaults to `main`
* `MythicScribe.customDatasets`: Which Custom Dataset to load and from where
* `MythicScribe.enabledPlugins`: Enable / Disable specific plugins' datasets. Plugin names are added automatically


# Extension Commands

* `MythicScribe.addCustomDataset`: Add a Custom Dataset from either a local path a link
* `MythicScribe.removeCustomDataset`: Removes one or multiple Custom Datasets
* `MythicScribe.createBundleDataset`: Create a Bundle Dataset based on other Custom Datasets you have previously added
* `MythicScribe.openLogs`: Open the Extension's logs. For debugging purposes

# Known Issues

* When `editor.acceptSuggestionOnEnter` is not `off` and `MythicScribe.enableFileSpecificSuggestions` is enabled, all the completions on newline *will* stop users from comfortably add spacing in their metaskills and the likes. For this reason, it is recommended to keep this configuration set to `off`


# Dev Builds

You can download Dev Builds from the [Github Repository](https://github.com/Lxlp38/MythicScribe) in the following ways
- The latest dev build is available on the [Dev Build Release](https://github.com/Lxlp38/MythicScribe/releases/tag/dev), always updated to the latest commit.
- A build is generated as an artifact and made public for each commit, for a duration of 90 days. You can download it from the commit's associated [Action](https://github.com/Lxlp38/MythicScribe/actions/workflows/commit-build-artifact.yml)


# Credits and Acknowledgements
- [@maecy](https://twitter.com/maecy_official?s=21&t=ZBZ5BDKcoa6LYFwgd690_A), for creating and providing this extension's ⭐awesome⭐ icon and the [Stellius Team](https://stellius.net/) in general for the collaboration!