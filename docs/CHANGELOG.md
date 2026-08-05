# Changelog

## 2.1.0 — Full backend and cross-platform controller alignment

- Bound the frontend to the supplied version 1 Apps Script `/exec` deployment and library reference.
- Kept the backend unchanged and removed backend source from the deliverable.
- Enforced a hard four-to-eight-player frontend limit at setup, matchmaking, browser, join, start, and synchronized-state boundaries.
- Enforced one unique character per player across the eight supplied characters.
- Added exact backend class-ID and map/room compatibility mappings.
- Added the complete server-authoritative match loop: tasks, evidence, bodies, reports, emergency councils, voting, killer actions, sabotage, abilities, monsters, chat, results, rewards, and history.
- Added every route from the 65-route backend manifest to the frontend API client.
- Added Online Services for profiles, settings, inventory, shop, friends, blocks, guilds, lobby browsing, quick match, leaderboards, moderation, and administration.
- Added host lobby settings, kick, and lobby-ban controls.
- Added browser-standard Gamepad support for Xbox-, Nintendo-, PlayStation-, and generic standard-layout controllers on desktop, tablet, and mobile browsers that expose them.
- Added controller-only focus navigation so all menus and connected actions remain reachable without a keyboard or touchscreen.
- Added simultaneous keyboard, NumPad, touch, and controller input with adjustable analog deadzone.
- Set the supplied app artwork as manifest icons, maskable icon, Apple touch icon, and favicons.
- Added PWA manifest, install handling, service-worker shell caching, and app shortcuts.
- Added desktop and 390-pixel mobile integration tests with zero uncaught page errors and zero horizontal overflow.

## 2.0.0 — Unified game build

- Consolidated the eight-character game into one HTML entry point.
- Restored character sheets, maps, cards, investigation, combat, and physical 3D dice.
- Added offline training and initial connected lobby support.
