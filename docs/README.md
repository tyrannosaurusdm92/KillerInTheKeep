# Killer In The Keep 2.1.0 — Cross-Platform Multiplayer Build

Open `killer-in-the-keep.html` from a static web host. The package contains one HTML entry file, no batch files, and no backend source file.

## Supplied backend connection

The frontend is permanently preconfigured for the supplied version 1 deployment:

- Web app: `https://script.google.com/macros/s/AKfycbwhZd5JCiob49mDc8N3vmTW9YqUu0oelxTbGHu92k9m9uNYrDktauJBcMyvxnbO6wQi/exec`
- Apps Script library: `https://script.google.com/macros/library/d/18Ef5XWIucyO13RYSEcAKGiMcpwEmJepzl7XPX38Iznh17iaL88SRB1Ly/1`

The backend was not modified, replaced, or bundled. The frontend adapts to its exact route, class, map, control, match-state, social, inventory, moderation, and administration contracts.

## Eight-player rule

Every frontend entry point enforces four to eight players:

- lobby choices are only 4, 6, or 8;
- quick match requests exactly 8 maximum;
- public rooms above 8 are hidden;
- room-code and public-browser joins reject rooms above 8;
- returned match state above 8 is rejected;
- every player must claim a different one of the eight characters before match start.

The supplied backend still advertises older 10- and 12-player options. This package intentionally does not change the backend; its frontend compatibility layer prevents those options from being used by Killer In The Keep.

## Connected gameplay

The live match interface implements preparation/exploration phases, server-timed objectives, evidence discovery/collection/comparison, bodies, reports, emergency councils, discussion, voting, killer targets, sabotage, class abilities, monsters, living/ghost chat, match results, XP, rewards, and history. The shared map synchronizes server positions and room names across all connected players.

The Online Services page exposes every route listed by the backend manifest: profiles, account settings, public lobby browser, quick match, inventory, cosmetics, shop, friends, blocks, guilds, leaderboard, match history, safety reports, and role-gated administration.

## Controller and input support

Keyboard, arrow keys, NumPad, touch controls, and browser-standard gamepads can be active at the same time. Standard-layout Xbox, Nintendo, PlayStation, and generic controllers receive:

- left-stick movement and sprint;
- right-stick turning/camera intent;
- face-button interact, confirm, cancel, inspect, jump, crouch, and contextual actions;
- shoulder/trigger actions;
- D-pad and stick navigation through every button, field, lobby, menu, and match action;
- adjustable analog deadzone;
- connected/disconnected status.

On mobile and tablet, controller support depends on the browser and operating system exposing the paired USB or Bluetooth controller through the Gamepad API.

## Installable app

The supplied app artwork is installed as the PWA icon through the web manifest, Apple touch icon, favicons, and service-worker app shell. The app can be installed by supported desktop and mobile browsers. Offline training, rules, maps, sheets, cards, dice, and local assets are cached; connected multiplayer still requires the supplied backend and an internet connection.
