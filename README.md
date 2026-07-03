# Undaunted Dungeon Tracker

Foundry VTT v14 module version of the Undaunted dungeon tracker macro.

## Features

- Foundry VTT v14 compatible
- `ApplicationV2` tracker window
- Persistent dungeon state until reset
- Persistent RollTable name configuration until reset
- Scene control button to open the tracker
- Floating canvas button to open the tracker
- Macro/API function to open the tracker
- Split module code for easier maintenance

The module preserves the original workflow:

- Dungeon setup
- Explore rolls and progress tracking
- Search and discoveries
- Hazard generation
- Encounters and NPC clash handling
- Wandering monster checks
- Torch tracking
- Rest tracking
- Manual dungeon time advancement

## Installation

Copy the `dungeon_explorer` folder into your Foundry user data modules directory.

Example target path:

```text
Data/modules/dungeon_explorer
```

Then enable **Undaunted Dungeon Tracker** from the Foundry module management UI.

## Usage

Open the tracker with either:

- The floating `Dungeon` button on the canvas
- The dungeon icon scene control button
- A macro calling `UndauntedDungeonTracker.openTracker()`

When the tracker opens:

1. Press `New` to start a new dungeon
2. Choose `Cave`, `Tomb`, `Fort`, or `Temple`, or roll from tables
3. Adjust torch/rest settings and RollTable names if needed
4. Use `Setup` later to update table names and timing settings without starting over
5. Use the tracker buttons to run dungeon actions

State is stored on the current user and remains available until `Reset` is used.

## Macro/API Access

The module exposes a small API on both the module record and a global:

```js
UndauntedDungeonTracker.openTracker();
```

```js
game.modules.get("dungeon_explorer").api.openTracker();
```

Also available:

```js
UndauntedDungeonTracker.setupDungeon();
UndauntedDungeonTracker.resetDungeon();
```

## RollTable Configuration

All RollTable names remain configurable in the setup dialog.

Configured table names are stored in the same persistent tracker state, so users do not need to re-enter them each session unless they reset the tracker.

## File Layout

```text
module.json
scripts/
  module.js
  constants.js
  state.js
  chat.js
  tracker-service.js
  apps/
    tracker-app.js
templates/
  tracker.hbs
styles/
  tracker.css
```

## Notes

- The module currently stores state per user, matching the original macro behavior.
- RollTables referenced by name must already exist in the world or an available compendium import.
- Missing RollTables produce a Foundry warning and a visible placeholder result in chat.
