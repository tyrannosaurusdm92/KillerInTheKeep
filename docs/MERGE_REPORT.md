# Killer In The Keep 2.1.0 Compatibility Report

## Supplied inputs

- `Killer_In_The_Keep_v2.0.0.zip` — playable frontend and original game assets.
- `Killer_In_The_Keep_Backend_v1_Unified_Cross_Platform(1).gs` — unchanged version 1 server contract used only for frontend alignment and testing.
- `Killer_In_The_Keep_Merged(4).json` — project loop, lobby, classes, maps, evidence, progression, social, accessibility, and crossplay specification.
- Supplied Apps Script web-app and library URLs.

## Compatibility decisions

- The frontend remains the deliverable; no new backend is supplied.
- The eight existing named characters remain the playable roster.
- Their frontend IDs map to `class_1` through `class_8`, the first eight backend class IDs.
- Backend maps map to Ravenwatch Keep, Mooncrypt Fortress, and Ashen Citadel artwork, with exact backend room labels applied to map zones.
- The unchanged backend's 12-player capability is overridden at every frontend boundary with a hard maximum of eight.
- Every backend-manifest route is represented by an API method and a reachable interface or game action.
- Hidden state remains server-owned and is never inferred by the client.

## Result

The package is a single-entry installable browser game with offline training and connected multiplayer. It supports mouse, keyboard, arrows, NumPad, touch, and standard-layout console controllers while preserving the supplied artwork and character roster.
