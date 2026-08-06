# External Research and License Audit

Audit date: 2026-08-06

## Authoritative rules/license research

- D&D Beyond, **Systems Reference Document (SRD) v5.2.1**: https://www.dndbeyond.com/srd
- Creative Commons, **Attribution 4.0 International legal code**: https://creativecommons.org/licenses/by/4.0/legalcode.txt

The local license interface includes the CC BY 4.0 legal code and a separate SRD attribution notice. Only SRD-compatible names/concepts/stat structures should be added; protected non-SRD lore and artwork are excluded.

## Engine and browser-platform research

Evaluated, not imported:

- Phaser official repository and releases: https://github.com/phaserjs/phaser
- PixiJS official repository: https://github.com/pixijs/pixijs
- EasyStar.js pathfinding: https://github.com/prettymuchbryce/easystarjs

Standards/reference implementation sources:

- W3C Web App Manifest: https://www.w3.org/TR/appmanifest/
- MDN Progressive Web Apps installability: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- W3C Gamepad specification: https://www.w3.org/TR/gamepad/

The build retains its existing renderer and uses original graph/pathfinding code. It uses a standards-based manifest, service worker, landscape declaration, and Gamepad API integration.

## Google Drive inventory

The provided Drive folder was listed and contained map packs, example images, asset folders, audio/effects folders, and large Dungeondraft archives. Some files exceeded the project's 24,000 KB per-file production limit. Since folder access and filenames did not establish a redistribution license, no newly discovered Drive asset was copied into the release.

## Exclusion policy

The production package excludes `.git`, node_modules, demos, tests, repository history, source ZIPs, nested archives, unrelated examples, and assets whose redistribution terms were not verified.
