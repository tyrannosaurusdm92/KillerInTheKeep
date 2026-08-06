# Killer in the Keep — Full Video Game/VTT Hybrid v6.1.0

This package merges the supplied four-floor clickable SVG keep, eight custom characters and sheets, all supplied decks, fixed 3D character and monster dice, the uploaded V2 Google Apps Script backend, authentication/lobby surfaces, map overlays, turn-based movement, combat, traps, treasure, fog, lighting, audio, autonomous characters, and autonomous monsters.

## Start

Serve this folder over HTTPS or a local web server and open the single primary entry point, `index.html`. Opening the HTML directly with `file://` is unsupported because SVG objects, JSON, documentation, service workers, and the Apps Script API require browser origin rules.

An Offline Test Profile is included for browser testing without modifying the live deployment. Online play uses the designated Apps Script endpoint in `json/runtime/build-config.json`. Replace `googleClientId` in that file to activate the production Google Identity Services flow.

## Authoritative architecture

- The uploaded `backend/Killer_In_The_Keep_Backend_V2.gs` is the authoritative online backend source.
- The frontend uses backend V2 state, reachability, contextual-dice, action, and bot-step routes where online.
- The offline profile runs the same structured map and monster data locally for reproducible package testing; it is not a substitute for production authorization.
- Hidden killer information is returned through private state in the local harness and through authenticated backend state online, never merely hidden with CSS.

## v6.1.0 combat, effects, and turn-order upgrade

- Dynamic SVG effects are mapped to every one of the 69 authored character powers, all 10 character weapon attacks, and all eight current monster attack/movement definitions.
- Dragon’s Breath exposes its five authored elemental choices: acid, cold, fire, lightning, and poison.
- Detect Magic is a no-movement, no-die exploration action that blankets the current room and identifies qualifying magical auras, glyphs, wards, curses, illusions, and spell traps.
- Perception spotlights hidden hazards without moving the character; healing, poison, blood, lightning, death, monster movement, and spellcasting each have matching visual and audio cues.
- Every character rolls initiative before movement begins. Once the order is established, the active character rolls one d10 for movement.
- The opening victim receives no evidence hand. Later cooperative deaths redistribute the defeated character’s cards to the lowest living hands first, filling toward five before overflow.
- All 11 monster-card designs have seven instances each, producing a 77-card monster deck.

## Major systems

- Four 48×32 SVG floors with coordinate, room, collision, door, stair, secret-passage, trap, chest, lighting, spawn, and starting-position metadata.
- Orthogonal character movement by default; L-shaped movement requires an explicit ability flag. Monster directions and traversal surfaces are data-driven.
- Exact cross-floor stair edges, movement-cost validation, legal destination highlighting, token path movement, room-entry events, fog, line of sight, and room lighting.
- Structured initiative, attacks, damage, HP, defeat/ghost states, character bots, monster bots, Mimics, and a Gelatinous Cube reserve encounter.
- Fixed character dice assignments, one brown monster set, one quiet shared character dice sound, and one quiet monster dice sound. No player dice customization exists.
- Account, verification, reset, Google-sign-in integration point, friends, blocks, invitations, game discovery, shared links, reconnect, chat, direct/private alliance messages, accusation, and voting surfaces.
- PWA manifest/service worker, landscape mobile/tablet handling, wheel/pointer zoom and pan, and standards-based Gamepad API controls.

## Folder policy

- One primary application entry: `index.html`.
- `js/` contains frontend source only.
- `css/` contains stylesheets only.
- `json/` contains structured game/configuration data only.
- `assets/` contains production images, SVG, and audio only.
- `html/character-sheets/` contains the eight permitted non-entry-point interactive HTML sheet assets.
- `backend/` contains backend source only.
- `docs/` contains licenses, manifests, audits, attributions, and README material only.
- No nested ZIP archives or source-control metadata are included.

## Deployment limitations

The package can be browser-tested locally, but a sandbox cannot republish or change ownership/access settings for the supplied Apps Script deployment. Production multiplayer, email delivery, Google OAuth, and account recovery therefore require deployment-owner configuration and live end-to-end testing. See `FULL_GAME_VALIDATION.md` and `BACKEND_FRONTEND_MATRIX.md` for exact status.
