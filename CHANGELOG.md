# Change Log

All notable changes to the "mythicscribe" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

### Added

- Support for inline metaskills
  - By writing `=[` a new completion will be displayed, allowing you to write down the syntax for inline metaskills
- By writing a `;` after either another `;` or a `{` now deleted the newly added character and brings up attribute suggestions
- Moving the cursor to the right of empty curly brackets `{}` now deletes the brackets and puts a space. Enabled by default, can be configured in `MythicScribe.enableEmptyBracketsAutomaticRemoval` 
  - `  - mechanic{}` --> `  - mechanic `
- added `regexForMythicmobsFile` config, which allows you to define a custom regex to determine which files are MythicMobs ones based on their path matching the regex
- added `regexForMetaskillFile` config, which allows you to define a custom regex to determine which files are Metaskill files based on their path matching the regex

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