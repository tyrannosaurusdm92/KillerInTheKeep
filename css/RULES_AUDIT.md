# Gameplay Rules Integration Audit — v6.1.0

## Reconciled content

- Four floors: Cellar, First Floor, Second Floor, Attic/Roof.
- Eight unique playable characters and eight custom HTML character sheets.
- Evidence: 8 suspects + 8 weapons + 22 rooms = 38 cards.
- Armory: 46 cards.
- Treasure: 37 cards.
- Monsters: 11 cards, including original Mimic and Gelatinous Cube additions.
- Traps: 7 cards.
- Total: 139 SVG cards.

## Dice authority

Each character has one fixed data-configured theme matching the required identity color. Monsters use one brown theme. The only production dice sounds are one shared quiet character sound and one shared quiet monster sound. Contextual controls expose only the required action dice.

## Movement authority

Characters use four-direction orthogonal movement. Diagonal movement is not enabled unless a specific rule overrides it. L-shaped movement is disabled by default and exists as a structured ability override. Monster movement definitions independently specify dice, directions, surfaces, speed limits, stairs, and traversal traits. Spider definitions include diagonal/wall/ceiling traversal; zombie definitions use their limited forward and forward-diagonal set.

The graph validates walkability, occupied cells, closed/locked doors, hazards, stair costs, secret discovery, remaining movement, and floor boundaries before returning destinations. Humans and bots use the same graph.

## Hidden information

The killer and opening-victim roles are selected in authoritative state. Public state excludes the solution and other users’ private hands. The killer receives a normal token, dice, public controls, and evidence participation. Private role information is returned only to the authenticated participant.

## Lobby deduction

Room theories and final accusations require a valid living participant and legal room/card state. Formal voting requires a living participant in the Foyer, prevents duplicate votes, hides interim vote choices, publishes only the resolved tally, and permits eligible bots to vote.

## Interactive systems

Doors, locks, traps, containers, treasure, lights, spawns, rooms, stairs, secret passages, walls, and starting spaces are metadata-driven overlays above the pre-painted SVG maps. Combat and card effects alter runtime state rather than existing only as card text.
