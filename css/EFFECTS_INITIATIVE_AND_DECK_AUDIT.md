# Effects, Initiative, Evidence, and Monster Deck Audit — v6.1.0

Generated: 2026-08-06

## Source review

The upgrade was mapped from the package’s eight internal character sheets, 69 structured character powers, 10 character weapon definitions, eight structured monster records, gameplay rules, evidence setup rules, map metadata, and included SRD 5.2.1 compliance material. Effects were keyed to the authored attack names, damage types, saving throws, targeting, areas, durations, conditions, and healing behavior rather than generic cosmetic guesses.

## Dynamic effects

- 69 character-power effect definitions.
- 10 character-weapon effect definitions.
- Eight monster attack definitions and eight monster movement cues.
- Blood effects for successful bites, piercing attacks, and slashing attacks.
- Green poison aura for poisoned targets.
- Healing and temporary-HP aura effects.
- Lightning, fire, frost, acid, necrotic, radiant, force, psychic, sonic, earth, water, wind, binding, illusion, charm, shield, summon, teleport, and death visuals.
- Room-wide Detect Magic blanket and stationary Perception spotlight.
- Dragon’s Breath permits acid, cold, fire, lightning, or poison, with the selected variant controlling the visual, sound, and damage type.

The effect runtime is stored at `js/effects.js`; structured mappings are stored at `json/runtime/effects.json`; audio cues are under `assets/audio/effects/`.

## Initiative and contextual dice

All eight characters roll `1d20 + Dexterity modifier` before movement begins. The rolls establish the complete turn order. Only after initiative is established does the active participant receive the movement `1d10`. Attack, save, damage, healing, and skill dice appear only for the legal action being resolved.

## Cooperative evidence redistribution

The opening victim is separate from the killer, begins as a ghost in the sealed murder room, receives no evidence cards, and does not enter normal redistribution. The remaining 35 evidence cards are dealt as five cards to each of seven living characters, including the killer.

When a later character dies in cooperative mode, that character’s hand is removed and redistributed to living characters. Recipients are ranked by their hand sizes at the moment of death. Hands below five are filled first; lower hands receive priority; overflow is distributed only after no living hand remains below five. The backend and offline runtime use the same rule.

## Monster deck copies

The monster card deck contains 11 distinct card designs and seven instances of each design, for 77 cards total. This includes the Mimic and Gelatinous Cube cards that were already present in the game-data deck but previously absent from the standalone monster deck manifest.

## Path and backend preservation

No original file path was removed. The existing backend remains at `backend/Killer_In_The_Keep_Backend_V2.gs`. New assets were added only under existing `assets/audio`, `json/runtime`, and `js` paths, plus this documentation.
