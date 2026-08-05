# Gameplay Guide

## Premise

A storm isolates four to eight adventurers inside a dangerous fantasy estate. One player is secretly the killer. Investigators explore the Keep, complete objectives, question others, gather evidence, survive traps and monsters, and identify the killer, murder weapon, and crime location before the killer completes a ritual or escapes with the relic.

## Offline Training

Choose an adventurer, map, party size, and starting level from the Keep Hub. Offline Training creates a full local mystery with bot-controlled party members. It is designed for learning the interface and testing the game; it is not secure against a player inspecting browser data.

## Digital cards

The original physical-card categories are represented as searchable digital decks:

- Suspects
- Weapons
- Rooms
- Traps
- Monsters
- Treasure
- Items
- Statuses

Cards dealt into **Your Private Hand** are not the three hidden solution cards. Evidence discovered through play appears in **Archived Evidence** and the Case Journal.

## Shared maps and movement

Every map is 48 columns by 32 rows. Every square represents exactly 5 feet by 5 feet. The player token resolves to the center of a cell. Visible party members appear on both the full Shared Map and the character sheet’s Map Page.

Primary controls include W/S for forward and backpedal, A/D for turning, Q/E for strafing, Shift for sprinting, Z for crouching, N for sneaking, F for interaction, M for map, C for character, B for cards/inventory, J for journal, and R for dice. Arrow-key, NumPad, gamepad, and touch alternatives are included. NumPad 1 and NumPad 7 remain unassigned.

Ground travel only is supported. Flight, climbing, swimming, diving, submersion, wall crawling, hovering, and free vertical movement cannot be enabled by a spell, item, ancestry, class, mount, or map feature.

## Investigation

Use **Perception Pulse** to make a Perception check. Successful checks can reveal a card that is not part of the hidden solution. Map evidence entities can also be investigated when adjacent. Objectives track evidence, questioning, ritual, relic, escape, and accusation progress according to the private role.

A formal accusation contains exactly three parts: suspect, weapon, and crime location. A fully correct accusation resolves the standard mystery in favor of the investigators. Failed accusations are recorded and can apply host-configured consequences in connected play.

## Combat

Exploration uses animated cell movement. Combat uses initiative and a movement allowance based on character speed. The Combat & Dice page supports initiative, monster hit points and armor class, attacks, damage, advantage/disadvantage, and standard dice expressions such as `1d20+5` or `2d6+3`.

## Host tools

The offline Host Console can change phases, inspect the local training seed, place evidence, traps, monsters, and treasure, and review the party. In connected play, the corresponding backend routes own these changes and redact the solution from ordinary players.
