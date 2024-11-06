# Changelog

## [1.0.0]

## Added
- MythicScript file types and syntax highlighting
  - `MythicScribe.enableMythicScriptSyntax` config to determine whether the extension should automatically convert the document types from yaml to MythicScript if it's recognized as a MythicMobs file. This does not change the file or its extension in any way, while also enabling mythic-specific syntax highlighting

- Mob file support for completions and hovers
- Item file support for completions and hovers
  - `MythicScribe.regexForItemFile`: Determines which files are recognized as Items files based on a custom regex


## [0.3.0]

## Added
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
- Default regexs for file specific features now check for the presence of a / or \ before and after the directory name

### Fixed
- Small issue with the shortcuts regex
- GitHub dataset not being correctly loaded for hover informations


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