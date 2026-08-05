# Killer In The Keep 2.1.0 Test Report

## Static validation

- One HTML entry file: `killer-in-the-keep.html`.
- No `.gs`, backend folder, `.bat`, or `.cmd` files in the deliverable.
- 204+ packaged assets resolve through their declared relative paths.
- All JSON files parse successfully.
- All first-party JavaScript modules and the service worker pass syntax validation.
- HTML contains 261 unique element IDs with no duplicates.
- Manifest icons exist at 192, 512, maskable 512, Apple touch, and favicon sizes.
- Character catalog contains exactly eight playable characters.
- Lobby options contain only 4, 6, and 8.
- Frontend API route literals cover all 65 routes declared by the supplied backend manifest; missing routes: none.
- The final package contains no backend replacement.

## Route-accurate connected integration test

A browser integration harness returned the same request/response shapes as the supplied backend and tested:

- login and private player state;
- profile and server accessibility settings;
- 8-player-filtered public lobby browser and quick-match policy;
- lobby creation, synchronization, unique character selection, host start, kick/ban controls, and settings;
- live role, room, task, evidence, body, council, voting, killer, sabotage, ability, monster, chat, and result interfaces;
- inventory, cosmetics shop, currencies, friends, blocks, guilds, leaderboards, history, moderation, and role-gated admin data;
- the `/match/monster/attack` route and refreshed health state;
- no uncaught page errors.

## Input and responsive tests

- Keyboard and NumPad movement changed the local token.
- Touch controls rendered nine reachable movement/action buttons.
- A simulated standard-layout console controller was detected and reported as connected.
- Controller mapping exposes Xbox, Nintendo, and PlayStation bindings from the backend control contract.
- Desktop test viewport: 1440 × 1000.
- Mobile test viewport: 390 × 844.
- Mobile horizontal overflow: 0 pixels.
- The full map rendered eight tokens and labeled backend rooms.

## PWA validation

- Manifest is linked from the HTML.
- Supplied artwork is used by all app-icon declarations.
- Service worker caches the HTML, CSS, JavaScript, runtime data, manifest, banner, and icons.
- Service-worker registration is skipped only for `file://`, as required by browser security rules.

## Network limitation

The sandbox blocked direct browser navigation to local HTTP servers and could not reach the live Apps Script deployment reliably. Therefore, the exact live deployment was not mutated or load-tested from this environment. Contract coverage and behavior were verified against the supplied backend source and a route-accurate mock; the Settings **Test Connection** button remains available for deployment-side verification.
