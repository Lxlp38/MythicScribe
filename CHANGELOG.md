# Changelog

## [Unreleased]

### Added
- `MythicScribe.enabledPlugins` configuration to set enabled / disabled datasets based on the plugin implementing them
- Hovers and Completions for Droptables
  - `MythicScribe.fileRegex.Droptable` configuration to define a regex to recognize Droptable files
- Hover and Completions for Stat Files
  - `MythicScribe.fileRegex.Stat` configuration to define a regex to recognize Stat files
- "Bundle" Custom Datasets
  - A Bundle json can contain references to any number of other custom dataset types
  - When a Bundle is imported as a File and not as a Link, the path of other File-sourced datasets is interpreted as "relative" to the Bundle's location

```json
[
    {
        "elementType": "Mechanic",
        "source": "File",
        "pathOrUrl": "test.json"
    },
    {
        "elementType": "Enum",
        "source": "File",
        "pathOrUrl": "testenum.json"
    },
    {
        "elementType": "Mechanic",
        "source": "Link",
        "pathOrUrl": "https://raw.githubusercontent.com/Lxlp38/LxMythicUtilities/refs/heads/main/Datasets/LxMythicUtilitiesMechanics.json"
    }
]
```
> Bundle.json Example  
> Given that the Bundle is imported as a File, then "test.json" and "testenum.json" will ne fetched from the same directory the bundle is in  
> Of course, you can add ".." and other/directories/toYourFile.json  
> You can also specify a "Link" source to fetch datasets from a link  

### Changed
- Refactor of how Mechanics/Enums and Subscriptions are handled
- Regexes for files can now be found in the `MythicScribe.fileRegex` configuration. Old configurations for this are deprecated and automatically migrated
- "Local File" value inside customDatasets configurations is now called "File". When the old value is detected, it is automatically migrated

### Fixed
- Error with the formatter's indentation when the config file actual indentation is 1
- Syntax error when a list of attribute values is spread across multiple lines
- Error with text formatting where comments could still end up being formatted, with some of the text spilling over the commented line
- Error where completions would continue to be shown repeatedly when accepting completions on mechanic-like objects that do not have attributes
- Completions being activated even when after a comment in some cases


## [1.5.0]

### Added
- MythicEntity Enum And Completions
- AITargets Completions and Hovers
- AIGoals Completions and Hovers
- Lambda Enum Datasets: by specifying a comma (`,`) separated list of values for an attribute's enum, an enum will be registered when the attribute is loaded and autocompletions will suggest those values
- Added Enums to Custom Datasets: new Enum files can be registered to use for your other Custom Datasets.
  - The "Lambda Enum Datasets" feature already allows you to put arbitrary values as the attribute's enum in order to create a quick dataset, but with Custom Enum Datasets you can also add descriptions to the values, while also being able to reference the same Enum Dataset from multiple attributes if need be

### Changed
- Refactor of how Enums are handled in order to allow for a dynamic addition
- Changed VSCode compatible version from 1.94 to 1.93 to allow compatibility with Cursor

### Fixed
- Hovers and attribute completions not showing up (or showing up incorrectly in some instances) for attributes that are not on the same line as the mechanic/targeter/condition they reference
- Targeters can now autocomplete and show hovers when used as the value of an attribute


## [1.4.0]

### Added
- "Format Document" Feature.
  - Should be good to use, but let me know if it behaves wrongly
  - Will also change document indentation based on the `editor.tabSize` config
- Item Triggers
- Enhanced Autocompletion for Item triggers:
  - Furniture triggers only will be displayed when inside FurnitureSkills
  - Block triggers only will be displayed when inside CustomBlockSkills
- Multiple datasets and associated autocompletions for mechanic attributes

### Fixed
- Attribute values completions not working on invocation 
- MechanicLine completions popping up after a comment. For now this has been patched by detecting the presence of the "#" or the "<#" characters on the same line before the cursor position 
- Skill mechanics written in the skill:MetaSkill syntax now get autocompletions
- Autocompletions for list completions showing elements already put in the line (for instance, suggesting to put another mechanic on a line that already has one)


## [1.3.0]

### Added
- Custom Datasets (Experimental!) Feature: you can specify a file on your system or an url online as a new dataset for mechanics/conditions/targeters/triggers. This means that:
  - As an user: you can add your custom metaskill as a new mechanic (skill:yourCustomMetaSkill) and put the skill parameters as attributes in order to get your metaskill to autocomplete
  - As a plugin developer: you can make datasets for your mythicmobs extension and make your users use it (or, well, another choice would be to make a pull request and put the dataset directly on the MythicScribe repo)
- New datasets can be added either
  - Via the config `MythicScribe.customDatasets`
  - Via the command `MythicScribe.addCustomDataset`
- Syntax Highlighting for Template
- "Plugin" section to Mechanics/Targeters/Conditions/Triggers' Hovers, to specify from which plugin they are from

### Fixed
#### Syntax Highlighting 
- Unquoted strings not being recognized once a . or a space is used inside of them
- Closing placeholders (like `</red>`) not being recognized

### Changed
- Changed how mechanics/conditions/triggers/targeters datasets are stored and handled
- Changed some URI related stuff as a first step towards web compatibility

### Removed
- Check on startup for every mythicscript file (It was just an aesthetic feature, as file are checked again once they are opened)
- Theme enforcing


## [1.2.1]

### Fixed
- Yaml files not having autocompletions and hovers when the mythicscript syntax was disabled

### Removed
- Removed <> from auto-closing pairs and highlighted brackets


## [1.2.0]

### Added
- Lots of completions for file-specific fields
- Added a default value of "false" for editor.acceptSuggestionOnEnter for MythicScript 

### Changed
#### Datasets
- Changed dataset source from Spigot to Paper
- Changed supported Minecraft version (and added check to make sure the selected one is not invalid)
  - Removed 1.20.1
  - Removed 1.20.2
  - Added 1.20.5
  - Added 1.20.6
#### Syntax
- Writing < now automatically writes <>
- You can press < while having an area of text selected to surround it with <>
- You can press ( while having an area of text selected to surround it with ()
#### Others
- Refactor of how file-specific autocompletions are generated
- Now mechanics/conditions/targeters/triggers and attributes' names are no longer only in lowercase
- Minor refactor for how mechanics/conditions/targeters/triggers/attributes are fetched from the datasets
- Minor refactor for how attribute inheritance is handled

### Fixed
- Syntax Highlighting: yaml keys being wrongly recognized if using a : inside an attribute
- Syntax Highlighting: placeholders are now detected more effectively when inside attribute values
- Some triggers that needed specific casing to work now being autocompleted correctly by virtue of all mechanics/conditions/targeters/triggers now being completed with the original casing
- Local datasets not being loaded if an error occurred while fetching github datasets


## [1.1.0]

### Added
- Autocompletions on invocations for file enums (For instance, now an Item File's Id will complete as a list of materials also when pressing ctrl + space)
- DamageCause completion for DamageModifiers
- Config to set which datasets to use, based on minecraft version (apply to spigot ones and sounds)
  - `MythicScribe.minecraftVersion` is the config
- Datasets for minecraft versions
  - latest
  - 1.19.4
  - 1.20.1
  - 1.20.2
  - 1.20.4
  - 1.21.1

### Changed
- Default setting for mythicscript language regarding editor.tabSize (now 2) and editor.insertSpaces (now true)

### Fixed
- Curly brackets auto-closing too late inside attribute values

## [1.0.1]

### Fixed
- Error with nameids matching that made onTimer and onSignal become nameids
- Error with syntax highlighting for comments
- Error with hovers providing the wrong information on certain occasions


## [1.0.0]

### Added
- MythicScript file types and syntax highlighting
  - `MythicScribe.enableMythicScriptSyntax` config to determine whether the extension should automatically convert the document types from yaml to MythicScript if it's recognized as a MythicMobs file. This does not change the file or its extension in any way, while also enabling mythic-specific syntax highlighting

- Mob file support for completions and hovers
- Item file support for completions and hovers
  - `MythicScribe.regexForItemFile`: Determines which files are recognized as Items files based on a custom regex


## [0.3.0]

### Added
- `MythicScribe.attributeAliasUsedInCompletions` config, to set which attribute alias to use for completions. Defaults to `main`
- `true`/`false` snippet for Boolean attributes and Metaskill Boolean Fields
- A LOT of snippet completions for attributes whose value must be an element from an enum. As of now the support is only partial, and it will be added gradually over time.
- New datasets for completions:
  - audiences
  - equipslot
  - particles
  - statmodifiers
  - spigot attributes
  - spigot attributes operations
  - barcolor
  - barstyle
  - blockface
  - damagecause
  - dragonbattlerespawnphase
  - dye
  - enderdragonphase
  - entitytype
  - gamemode
  - material
  - potioneffecttype
  - spawnreason
  - worldenviroment
  - sounds

## Fixed
- triggers, targeters and inline conditions completions behaving inconsistently once invoked
- conditions completions inserting an extra space before the condition name if triggered by inputting "-" manually


## [0.2.0]

### Added
- Triggers support

### Changed
- Updated the way the mechanics/targeters/conditions are fetched from the dataset
- Condition Actions suggestions have been improved
- Default regexes for file specific features now check for the presence of a / or \ before and after the directory name

### Fixed
- Small issue with the shortcuts regex
- GitHub dataset not being correctly loaded for hover information


## [0.1.1]

### Fixed
- mechanic completions showing alongside mechanic line completions (@, ?)
- "automatic brackets removal" now has a 0.5 seconds cooldown, as to not stop undo operations

### Changed
- changed how subscriptions (completions, hovers, text listeners etc.) are registered: now they are dynamic, being unloaded when a document is not valid (not a mythicmob one) and loaded when it is. This should improve performance and allow notifications to be shown at better timings


## [0.1.0]

### Added
- added functionality to automatically download new datasets from github. Can be configured via `MythicScribe.datasetSource`
- added ModelEngine dataset
- added Shortcuts functionality
- added [scope].[type].[name]= shortcut for setvariable
  - scope can be
    - c for caster
    - t for target
    - w for world
    - g for global
    - s for skill
  - type can be
    - i for Integer (if no .[type] is used, this is the default)
    - f for Float
    - d for Double
    - s for String
  - name is the name of the variable
  - `MythicScribe.enableShortcuts` to enable or disable this feature
- `MythicScribe.enableFileSpecificSuggestions` config to determine if file specific suggestions (metaskill files, mob files) should be shown
- `MythicScribe.disableAcceptSuggestionOnEnter` config to set the reminder to disable `editor.acceptSuggestionOnEnter` should be shown

### Fixed
- Attribute autocompletions no longer stop default autocompletions from showing up when called
- Mechanic autocompletions do pop up once default autocompletions are called after a `-` symbol
- Some keys that should have allowed for mechanic completions and hovers (FurnitureSkills and the likes) now do, in fact, allow for mechanic completions and hovers
- MechanicLine autocompletions (@, ~) popping up inside attributes when pressing space
- Mechanics with a colon (:) inside the name not being recognized
- Non-inheritable attributes being shown in attribute completions


## [0.0.2]

### Added
- Autocompletion for mechanic line components (@, ?, ~)
- Support for inline metaskills
  - By writing `=[` a new completion will be displayed, allowing you to write down the syntax for inline metaskills
- By writing a `;` after either another `;` or a `{` now deletes the newly added character and brings up attribute suggestions
- Moving the cursor to the right of empty curly brackets `{}` now deletes the brackets and puts a space. Enabled by default, can be configured in `MythicScribe.enableEmptyBracketsAutomaticRemoval` 
  - `  - mechanic{}` --> `  - mechanic `
- added `regexForMythicmobsFile` config, which allows you to define a custom regex to determine which files are MythicMobs ones based on their path matching the regex
- added `regexForMetaskillFile` config, which allows you to define a custom regex to determine which files are Metaskill files based on their path matching the regex
- hover support for Metaskill components

### Fixed
- Inline Conditions showing their completions alongside mechanics


## [0.0.1]
- Initial Release

### Added
- Hover and Completions support for
  - Mechanics
  - Conditions
  - Targeters
  - Inline Conditions
  - Attributes
- Completions for Composite Conditions