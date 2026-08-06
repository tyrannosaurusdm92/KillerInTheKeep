# Browser Smoke-Test Record

An intercepted-origin Chromium smoke test was run on 2026-08-06. The test intentionally returned HTTP 503 for the designated Apps Script endpoint to verify that the offline test profile remains usable when the live deployment is unreachable.

Passed checks:

- Authentication appears before the lobby/game shell.
- The offline authenticated lobby opens.
- A Free-for-All game starts with all eight unique character tokens.
- Gunnus uses the approved PvP Sitting Room start.
- Gunnus receives the fixed black-and-cyan dice identity.
- No dice skin/sound customization surface is present.
- Runtime initiative includes active monsters.
- The four SVG map assets are present and a floor source is loaded.
- The dice surface initializes.
- Exactly one contextual movement control is shown.
- A d10 movement roll completes and legal destination text appears.
- The local CC BY 4.0 text loads from the Licenses tab.
- Project-license and font-license records are present.
- No unexpected console errors or page exceptions occurred.

Because direct browser navigation to a local/test origin was blocked by the execution environment, the test document used an intercepted base URL. SVG/XML validity and asset existence were separately checked statically. The full machine-readable record is `SMOKE_TEST.json`.

## v6.1.0 upgrade validation

The existing intercepted-origin browser record above covers the unchanged application shell, lobby, map, dice surface, and offline startup path. For v6.1.0, all changed frontend JavaScript, the unchanged-path backend source, and every JSON file passed syntax/parsing checks. Node-based runtime tests built all 69 power contexts, all 10 weapon contexts, eight initiative rolls, Detect Magic, all five Dragon’s Breath variants, and lowest-hand-first evidence redistribution.

A fresh headless Chromium rerun was attempted in the current container, but Chromium did not finish startup because of the container’s D-Bus/headless environment and produced no DOM or application console. This is recorded as an environment limitation, not as a passed browser rerun. Production Apps Script deployment and multiplayer still require owner-side live testing.
