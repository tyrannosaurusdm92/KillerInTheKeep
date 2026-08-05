# Third-Party Repository Review

The user identified three RPG repositories as implementation references. Their engine/runtime code cannot be directly loaded into a CSS/JavaScript/JSON/HTML browser application, so compatible systems were independently implemented in JavaScript instead of bundling Unity or Godot engines.

## gdquest-demos/godot-open-rpg

- License: MIT
- Relevant patterns reviewed: turn-based combat flow, inventory, progression, grid/map interaction, menus, and modular roleplaying-game organization
- Browser implementation: character progression, card/inventory views, grid navigation, combat state, and page-based game UI
- Repository: https://github.com/gdquest-demos/godot-open-rpg

## i-Jiro/Unity3D-Turn_Based_RPG

- License: GNU GPL v3
- Relevant patterns reviewed: modular battlers, initiative/turn flow, status effects, stat modifiers, battle UI, inventory, and simple enemy logic
- Browser implementation: initiative list, combatants, HP/AC, attacks, monster state, action cards, logs, and offline bot behavior
- Repository: https://github.com/i-Jiro/Unity3D-Turn_Based_RPG

## 0x7c13/Pal3.Unity

- License: GNU GPL v3 for repository code; original commercial game assets are not supplied or licensed by the repository
- Relevant patterns reviewed: input abstraction, map interaction, gamepad/touch support, and separation between code and external assets
- Browser implementation: keyboard, arrow-key, NumPad, touch, and gamepad input routed into one shared movement/action layer
- Repository: https://github.com/0x7c13/Pal3.Unity

## Import limitation

The named Library copies were not available as separately materializable files during this build, and the larger containing Library archives returned a permission error when copied into the build environment. Therefore, this package does not falsely claim to contain verbatim source files from those Library archives. It implements the compatible gameplay architecture independently and records the official repositories and licenses for traceability.

Because two reviewed repositories use GPL v3 and their architecture materially informed the implementation, the shipped application code is distributed under GPL v3. Original Killer In The Keep artwork remains separately reserved as described in the Art and Asset Notice.
