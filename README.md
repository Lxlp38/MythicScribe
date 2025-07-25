<div align="center"><img src="./assets/icon.png" height=120></div>
<div align="center"><h1>MythicScribe</h1></div>

<div align="center">
    <a href="https://github.com/Lxlp38/MythicScribe/releases">
      <img alt="GitHub Release" src="https://img.shields.io/github/v/release/Lxlp38/MythicScribe">
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


# Known Issues

* When using the formatter, yaml comments put in awkward places may be misplaced.


# Dev Builds

You can download Dev Builds from the [Github Repository](https://github.com/Lxlp38/MythicScribe) in the following ways
- The latest dev build is available on the [Dev Build Release](https://github.com/Lxlp38/MythicScribe/releases/tag/dev), always updated to the latest commit.
- A build is generated as an artifact and made public for each commit, for a duration of 90 days. You can download it from the commit's associated [Action](https://github.com/Lxlp38/MythicScribe/actions/workflows/commit-build-artifact.yml)


# Credits and Acknowledgements
- [@maecy](https://twitter.com/maecy_official?s=21&t=ZBZ5BDKcoa6LYFwgd690_A), for creating and providing this extension's ⭐awesome⭐ icon and the [Stellius Team](https://stellius.net/) in general for the collaboration!
- MythicScribe is integrated with some External Tools:
  - [AuraFX](https://aurafx.vercel.app?source=MythicScribe) by [sleepsweetly](https://github.com/sleepsweetly)
  - [MinecraftSounds](https://minecraftsounds.com/) by [Morose](https://github.com/xmorose)
- [Game-icons.net](https://game-icons.net/) for the awesome icons used in the Node View! All images are licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). In particular, the icons used have been made by
  - [Delapouite](https://delapouite.com/)
    - [mob](/assets/nodegraph/mob.png) ([source](https://game-icons.net/1x1/delapouite/spiked-dragon-head.html))
    - [placeholder](/assets/nodegraph/placeholder.png) ([source](https://game-icons.net/1x1/delapouite/price-tag.html))
    - [stat](/assets/nodegraph/stat.png) ([source](https://game-icons.net/1x1/delapouite/upgrade.html))
    - [pin](/assets/nodegraph/pin.png) ([source](https://game-icons.net/1x1/delapouite/pin.html))
    - [block](/assets/nodegraph/block.png) ([source](https://game-icons.net/1x1/delapouite/cube.html))
    - [achievement](/assets/nodegraph/achievement.png) ([source](https://game-icons.net/1x1/delapouite/round-star.html))
  - [Lorc](https://lorcblog.blogspot.com/)
    - [metaskill](/assets/nodegraph/metaskill.png) ([source](https://game-icons.net/1x1/lorc/scroll-unfurled.html))
    - [item](/assets/nodegraph/item.png) ([source](https://game-icons.net/1x1/lorc/sword-spade.html))
    - [droptable](/assets/nodegraph/droptable.png) ([source](https://game-icons.net/1x1/lorc/swap-bag.html))
    - [randomspawn](/assets/nodegraph/randomspawn.png) ([source](https://game-icons.net/1x1/lorc/rally-the-troops.html))
    - [equipmentset](/assets/nodegraph/equipmentset.png) ([source](https://game-icons.net/1x1/lorc/battle-gear.html))
    - [archetype](/assets/nodegraph/archetype.png) ([source](https://game-icons.net/1x1/lorc/strong.html))
    - [spell](/assets/nodegraph/spell.png) ([source](https://game-icons.net/1x1/lorc/magic-swirl.html))
    - [menu](/assets/nodegraph/menu.png) ([source](https://game-icons.net/1x1/delapouite/hamburger-menu.html))
  - Caro Asercion
    - [furniture](/assets/nodegraph/furniture.png) ([source](https://game-icons.net/1x1/caro-asercion/armchair.html))
    - [reagent](/assets/nodegraph/reagent.png) ([source](https://game-icons.net/1x1/caro-asercion/round-potion.html))
  - Skoll
    - [sound waves](/assets/utils/minecraftsounds.png) ([source](https://game-icons.net/1x1/skoll/sound-waves.html))