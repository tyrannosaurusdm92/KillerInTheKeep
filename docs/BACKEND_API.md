# Supplied Backend API Alignment

## Transport

The frontend sends the route in a `path` field to the supplied Apps Script `/exec` URL. POST requests use JSON serialized as `text/plain;charset=utf-8` to avoid unnecessary browser preflight behavior. Protected routes include the issued session token. GET-compatible public routes are sent as query parameters.

## Complete manifest coverage

The frontend implements all 65 routes declared by `apiManifest_()`:

### Public/configuration
`/health`, `/config`, `/controls`, `/catalog`, `/api/manifest`

### Authentication and profile
`/auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/me`, `/player/profile`, `/player/profile/update`, `/player/settings/update`

### Inventory and shop
`/inventory/list`, `/inventory/equip`, `/shop/list`, `/shop/buy`, `/shop/sell`

### Lobby and matchmaking
`/lobby/list`, `/lobby/create`, `/lobby/get`, `/lobby/join`, `/lobby/leave`, `/lobby/ready`, `/lobby/settings`, `/lobby/kick`, `/lobby/ban`, `/lobby/heartbeat`, `/lobby/quick-match`

### Match
`/match/start`, `/match/state`, `/match/input`, `/match/task/start`, `/match/task/complete`, `/match/evidence/discover`, `/match/evidence/collect`, `/match/evidence/compare`, `/match/body/report`, `/match/emergency`, `/match/vote`, `/match/kill`, `/match/sabotage`, `/match/ability`, `/match/monster/attack`, `/match/chat/send`, `/match/chat/list`, `/match/leave`, `/match/history`

### Friends and guilds
`/friends/request`, `/friends/respond`, `/friends/list`, `/friends/remove`, `/friends/block`, `/guild/create`, `/guild/get`, `/guild/list`, `/guild/join`, `/guild/leave`

### Safety, leaderboard, and administration
`/moderation/report`, `/leaderboard`, `/admin/stats`, `/admin/reports`, `/admin/player/ban`, `/admin/player/unban`, `/admin/cleanup`

## Eight-player adapter

The backend source still advertises `maxPlayers: 12` and lobby sizes 10 and 12. The frontend does not change those server constants. Instead it filters and rejects them, sends only 4/6/8 lobby sizes, and validates every returned lobby and match against the eight-character roster.

## Authority boundary

The backend owns authentication, lobby membership, host authority, hidden roles, task timing, evidence links, bodies, votes, killer actions, movement plausibility, cooldowns, rewards, moderation, and win conditions. The frontend displays only the player-safe state returned by the server.
