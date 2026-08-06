# Backend / Frontend Coverage Matrix — v6.1.0

| System | Backend authority | Frontend integration | Status |
|---|---|---|---|
| Accounts and sessions | register, login, refresh, logout | Auth gate, restoration, secure sign-out | Implemented; live deployment test required |
| Email verification | verify/resend with expiry, cooldown, rate controls | Verification and replacement-code forms | Implemented; MailApp delivery test required |
| Password recovery | request/reset routes | Recovery forms | Implemented; email delivery test required |
| Google sign-in | `auth.google` server verification | Google Identity Services initialization when client ID is configured | Implemented/configuration required |
| Friends and blocks | search/list/request/respond/remove/block | Lobby social controls | Implemented |
| Games and invitations | create/list/join/invite/get/poll/heartbeat | Public discovery, shared links, invites, reconnect | Implemented |
| Character selection | unique hero and readiness validation | Eight-character selection before start | Implemented |
| Bot fill/takeover | unique bot participants and takeover continuity | Autonomous unfilled seats/local full party | Implemented |
| Hidden killer | private V2 state and authorized event visibility | Private role panel; ordinary public controls retained | Implemented |
| Four-floor world | V2 world blob and map index | SVG map object plus overlays | Implemented |
| Movement | server roll, reachability, path, collision, stair edges | Contextual d10, legal highlights, destination selection | Implemented |
| Contextual dice | V2 dice request/action result | Fixed 3D theme, physical replay, two role sounds | Implemented |
| Fog and lighting | per-mode visibility, lights, environment | Current/explored fog and room-state overlays | Implemented |
| Doors/locks/traps/chests | V2 interact, lockpick, disarm, trigger, loot | Adjacent contextual controls | Implemented |
| Combat | attack/save/effect/HP/ghost/loot | Legal targets, rolls, HP bars, logs | Implemented |
| Monster AI | structured monster cards and V2 bot step | Visible monster turns and brown dice identity | Implemented |
| Character bots | V2 bot step and local autonomous turns | Movement, combat, stairs, ghost actions | Implemented |
| Accusations | V2 room theory/final accusation with private hands | Foyer-validated accusation forms | Implemented |
| Voting | V2 Foyer ballot, duplicate prevention, hidden interim votes, bot votes | Lobby voting form | Implemented |
| Messages/alliances | authenticated game/direct/whisper channels | Public and private channel UI | Implemented; multi-client test required |
| Cards/items | ownership, visibility, decks, loot/effects | 139-card browser, inventory/use surfaces | Implemented |
| PWA/controller | browser standards | manifest, service worker, landscape prompt, Gamepad controls | Implemented; hardware/device test required |

## Contract normalization

`js/api.js` converts backend V2 response shapes into stable frontend shapes for dice expressions, reachable cells, action results, and refreshed state. `js/app.js` converts V2 tokens, monsters, doors, traps, containers, private role data, and roster metadata into the same rendering model used by the local test runtime.
