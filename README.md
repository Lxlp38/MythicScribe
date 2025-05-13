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
  - [File Parser](#file-parser)
    - [Go To Definition](#go-to-definition)
    - [Created Skill/Mobs/Items/Stats Autocompletions](#created-skillmobsitemsstats-autocompletions)
  - [Config Visualization](#config-visualization)
- [Extension Settings](#extension-settings)
- [Extension Commands](#extension-commands)
- [Known Issues](#known-issues)
- [Dev Builds](#dev-builds)
- [Credits and Acknowledgements](#credits-and-acknowledgements)


# Features

## Syntax Highlighting
![Syntax Highlighting Demo](https://raw.githubusercontent.com/Lxlp38/MythicScribe/refs/heads/master/demos/syntax-highlighting-demo.png)

## Autocompletions
![Autocompletion Demo](https://raw.githubusercontent.com/Lxlp38/MythicScribe/refs/heads/master/demos/autocompletion-demo.gif)
![Autocompletion Demo](https://raw.githubusercontent.com/Lxlp38/MythicScribe/refs/heads/master/demos/autocompletion2-demo.gif)
![Color Picker](https://raw.githubusercontent.com/Lxlp38/MythicScribe/refs/heads/master/demos/ColorPicker-demo.gif)

## Hover Information
![Hover Demo](https://raw.githubusercontent.com/Lxlp38/MythicScribe/refs/heads/master/demos/hover-demo.gif)

## Formatter
![Formatter Demo](https://raw.githubusercontent.com/Lxlp38/MythicScribe/refs/heads/master/demos/formatter-demo.gif)

## File Parser
### Go To Definition
![Go To Definition](https://raw.githubusercontent.com/Lxlp38/MythicScribe/refs/heads/master/demos/GoToDefinition-demo.gif)
### Created Skill/Mobs/Items/Stats Autocompletions
![Node Autocompletions](https://raw.githubusercontent.com/Lxlp38/MythicScribe/refs/heads/master/demos/NodeAutocompletion-demo.gif)

## Config Visualization
![Node Graph](https://raw.githubusercontent.com/Lxlp38/MythicScribe/refs/heads/master/demos/NodeGraph-demo.gif)
![Node Go To Definition](https://raw.githubusercontent.com/Lxlp38/MythicScribe/refs/heads/master/demos/NodeDefinition-demo.gif)



# Extension Settings

* `MythicScribe.alwaysEnabled`: When enabled, the extension will no longer do any check to see if a document is a MythicMobs one
* `MythicScribe.fileRegex`: Configure what files are recognized as Mythic ones based on a configurable regex made against their path 
  * `MythicMobs`: The regex to determine if the file is a Mythic one at all
  * `Metaskill`: The regex to identify Metaskill files
  * `Mob`: The regex to identify Mob files
  * `Item`: The regex to identify Item files
  * `Droptable`: The regex to identify Droptable files
  * `Stat`: The regex to identify Stat files
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
* `MythicScribe.logLevel`: Set the Extension's log level
* `MythicScribe.fileParsingPolicy`: Set the Extension's policies regarding file parsing
  * `parseOnStartup`
  * `parseOnSave`
  * `parseOnModification`
  * `parsingGlobPattern`
  * `excludeGlobPattern`

# Extension Commands

* `MythicScribe.addCustomDataset`: Adds a Custom Dataset from either a local path or a link
* `MythicScribe.removeCustomDataset`: Removes one or multiple Custom Datasets
* `MythicScribe.createBundleDataset`: Creates a Bundle Dataset based on other Custom Datasets you have previously added
* `MythicScribe.openLogs`: Opens the Extension's logs. For debugging purposes
* `MythicScribe.loadDatasets`: (Re)loads the Datasets manually
* `MythicScribe.showNodeGraph`: Shows a graph of all the configurations parsed. Can be filtered based on configuration type and whether or not it's an open editor

# Known Issues

* When `editor.acceptSuggestionOnEnter` is not `off` and `MythicScribe.enableFileSpecificSuggestions` is enabled, all the completions on newline *will* stop users from comfortably add spacing in their metaskills and the likes. For this reason, it is recommended to keep this configuration set to `off`
* When using the formatter, yaml comments put in awkward places may be misplaced.


# Dev Builds

You can download Dev Builds from the [Github Repository](https://github.com/Lxlp38/MythicScribe) in the following ways
- The latest dev build is available on the [Dev Build Release](https://github.com/Lxlp38/MythicScribe/releases/tag/dev), always updated to the latest commit.
- A build is generated as an artifact and made public for each commit, for a duration of 90 days. You can download it from the commit's associated [Action](https://github.com/Lxlp38/MythicScribe/actions/workflows/commit-build-artifact.yml)


# Credits and Acknowledgements
- [@maecy](https://twitter.com/maecy_official?s=21&t=ZBZ5BDKcoa6LYFwgd690_A), for creating and providing this extension's ⭐awesome⭐ icon and the [Stellius Team](https://stellius.net/) in general for the collaboration!
- [Game-icons.net](https://game-icons.net/) for the awesome icons used in the Node View! In particular, the icons used have been made by
  - [Delapouite](https://delapouite.com/)
    - [mob](/assets/nodegraph/mob.svg), [placeholder](/assets/nodegraph/placeholder.svg), [stat](/assets/nodegraph/stat.svg), [pin](/assets/nodegraph/pin.svg), [block](/assets/nodegraph/block.svg), [achievement](/assets/nodegraph/achievement.svg)
  - [Lorc](https://lorcblog.blogspot.com/)
    - [metaskill](/assets/nodegraph/metaskill.svg), [item](/assets/nodegraph/item.svg), [droptable](/assets/nodegraph/droptable.svg), [randomspawn](/assets/nodegraph/randomspawn.svg), [archetype](/assets/nodegraph/archetype.svg), [spell](/assets/nodegraph/spell.svg), [menu](/assets/nodegraph/menu.svg)
  - Caro Asercion
    - [furniture](/assets/nodegraph/furniture.svg), [reagent](/assets/nodegraph/reagent.svg)