# Change Log

All notable changes to the "mythicscribe" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.


## [Unreleased]

### Added
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
  - `MythicScribe.enableShortcuts` to disable
- `MythicScribe.enableDashesSuggestions` config to determine if dashes should be suggested

### Fixed
- Attribute autocompletions no longer stop default autocompletions from showing up when called
- Mechanic autocompletions do pop up once default autocompletions are called after a `-` symbol

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