# Cross-Platform Controller Compatibility

The input layer consumes the browser-standard gamepad layout. Browsers normalize supported Xbox, Nintendo, PlayStation, and generic controllers to consistent button and axis indices while the UI displays the supplied backend's platform-specific labels.

## Core mapping

- Left stick: move forward/backward and strafe.
- Right stick: turn/camera intent.
- Left-stick click: sneak; hold while moving to sprint.
- Left face button: interact/use.
- Bottom face button: confirm/jump.
- Right face button: cancel/crouch/stop.
- Top face button: inspect.
- Shoulders/triggers: primary, secondary, dice, and contextual actions.
- D-pad and left stick outside gameplay: focus navigation through interactive controls.
- Start/select/stick buttons: game pages, character, cards, search, and related shortcuts.

All gameplay actions that are represented as buttons or fields remain reachable through controller focus navigation, including matchmaking, chat, evidence, voting, killer actions, shop, friends, guilds, and administration.

## Mobile and tablet

Pair the controller in the operating system by Bluetooth or USB, open the hosted game in a compatible browser, and press a controller button. The top status badge changes when the browser exposes the controller. Browser/OS controller support varies; keyboard and touch remain available simultaneously.
