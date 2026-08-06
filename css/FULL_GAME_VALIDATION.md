# Full Game Validation — v6.1.0

Validation date: 2026-08-06

## Result

The supplied pre-video-game package and uploaded V2 Google Apps Script source were merged into one four-floor 2D video-game/VTT hybrid package. Static validation, JavaScript syntax checks, Apps Script syntax checks, JSON/XML parsing, runtime logic tests, an API-contract normalization test, and an intercepted-origin Chromium smoke test passed.

## Passed package checks

- One primary application entry point: `index.html`.
- Authentication is presented before lobby/game access.
- Four clickable SVG map floors and structured coordinate overlays are included.
- Eight supplied character artworks are used in bordered gameplay tokens.
- Eight fixed character dice identities and one fixed brown monster dice identity are configured; no player customization controls exist.
- Exactly two dice-roll sounds remain: shared character/character-bot and shared monster.
- Character movement defaults to orthogonal directions; L-shaped movement requires an explicit rule flag.
- Spider and zombie direction sets remain monster-specific and data-driven.
- Exact stair edges, floor changes, path costs, collision, fog, visibility, doors, traps, containers, lights, spawns, and secret passages are represented in structured data.
- Runtime initiative contains characters and active monsters.
- Combat, HP, defeat/ghost conversion, loot, searches, traps, lockpicking, room theories, final accusations, and autonomous turns are implemented.
- Cooperative shared visibility and PvP individual visibility are backend-configured.
- Formal V2 voting validates Foyer presence, eligibility, duplicate votes, hidden in-progress ballots, synchronized resolution, and bot participation.
- All 139 card SVG assets exist: 38 evidence, 46 armory, 37 treasure, 11 monsters, and 7 traps.
- Mimic and Gelatinous Cube cards/tokens are included through structured monster data.
- Local SRD/CC, software, asset, audio, font, project, research, manifest, and validation documentation is accessible from the Licenses tab.
- `assets/` contains production media only. Interactive character-sheet HTML is under `html/character-sheets/`.
- `docs/` contains documentation/data records only and no executable source.
- No nested archive, `.git`, dependency cache, or oversized file is included.

## Automated evidence

- `SMOKE_TEST.json`: browser UI flow and contextual dice test.
- `RUNTIME_LOGIC_TEST.json`: movement, spawn, stairs, initiative, hidden-role, and monster-direction tests.
- `API_CONTRACT_TEST.json`: V2 reachable-cell, dice-request, action-roll, and post-action state normalization.
- `PACKAGE_AUDIT.json`: final file, structure, size, and asset counts.
- `CHECKSUMS.sha256`: file-integrity list.

## Deployment-owner validation still required

The build environment cannot publish or modify the supplied Google Apps Script deployment. Therefore the following cannot honestly be certified here as live-production passes:

1. The designated deployment URL serving this exact revised `.gs` source.
2. Real multi-client synchronization across separate user accounts and networks.
3. Email verification/reset delivery and MailApp quota behavior.
4. Google OAuth completion, because the production OAuth client ID and authorized origins belong to the deployment owner. The UI initializes Google Identity Services when `googleClientId` is configured.
5. Google Password Manager behavior beyond standards-compliant credential-field markup.
6. Physical Bluetooth-controller compatibility across every intended browser/device.
7. App-store/desktop-wrapper packaging; the included deliverable is an installable PWA foundation.
8. Forgotten-email recovery. It is intentionally not exposed because the supplied backend has no verified, privacy-safe recovery channel for revealing account identifiers.

These are deployment/infrastructure checks, not hidden claims of completion. The package includes the exact backend source and configuration points needed for owner-side deployment testing.
