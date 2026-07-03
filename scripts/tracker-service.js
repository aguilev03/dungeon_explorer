import { DEFAULT_STATE, DEFAULT_TABLES } from "./constants.js";
import { postDungeonCreatedToChat, postRoomToChat, postSimpleMessage, postTimeToChat } from "./chat.js";
import { getState, resetState, saveState } from "./state.js";
import { countSuccesses, getOutcome, rollDice } from "./utils.js";

function resolveElement(element) {
  if (element instanceof HTMLElement) return element;
  if (Array.isArray(element)) return element[0] ?? null;
  return element?.[0] ?? element ?? null;
}

function findTable(name) {
  return game.tables.find((table) => table.name === name);
}

async function drawTable(tableName) {
  const table = findTable(tableName);

  if (!table) {
    ui.notifications.warn(`Missing RollTable: ${tableName}`);
    return { text: `<b>Missing table:</b> ${tableName}` };
  }

  const draw = await table.draw({ displayChat: false });
  const result = draw.results?.[0];
  const text = result?.description?.trim() || result?.text?.trim() || result?.name?.trim() || "No result";
  return { text, table: table.name };
}

function addDungeonTime(state, turns, reason = "Time passes") {
  const safeTurns = Math.max(0, Number(turns) || 0);

  state.totalTurns += safeTurns;
  state.totalMinutes += safeTurns * 10;
  state.encounterPool += safeTurns;
  state.torchTurnsUsed += safeTurns;
  state.turnsSinceRest += safeTurns;

  return {
    reason,
    turns: safeTurns,
    minutes: safeTurns * 10,
    torchBurnedOut: state.torchTurnsUsed >= state.torchMaxTurns,
    restDue: state.turnsSinceRest >= state.restDueEveryTurns
  };
}

function getRoomTableName(state) {
  const type = state.dungeonType?.toLowerCase();
  if (type?.includes("cave")) return state.tables.caveRoom;
  if (type?.includes("tomb")) return state.tables.tombRoom;
  if (type?.includes("fort")) return state.tables.fortRoom;
  if (type?.includes("temple")) return state.tables.templeRoom;
  return state.tables.caveRoom;
}

function getHazardTableName(state) {
  const type = state.dungeonType?.toLowerCase();
  if (type?.includes("cave")) return state.tables.caveHazards;
  if (type?.includes("tomb")) return state.tables.tombHazards;
  if (type?.includes("fort")) return state.tables.fortHazards;
  if (type?.includes("temple")) return state.tables.templeHazards;
  return state.tables.caveHazards;
}

function getUniqueTableNames(state) {
  const type = state.dungeonType?.toLowerCase();
  if (type?.includes("cave")) return [state.tables.caveUnique1, state.tables.caveUnique2];
  if (type?.includes("tomb")) return [state.tables.tombUnique1, state.tables.tombUnique2];
  if (type?.includes("fort")) return [state.tables.fortUnique1, state.tables.fortUnique2];
  if (type?.includes("temple")) return [state.tables.templeUnique1, state.tables.templeUnique2];
  return [state.tables.caveUnique1, state.tables.caveUnique2];
}

function rollExplore(progress) {
  const diceCount = Math.max(1, progress + 1);
  const rolls = rollDice(diceCount);
  const successes = countSuccesses(rolls);
  return { diceCount, rolls, successes, outcome: getOutcome(successes) };
}

function rollSearch(minutes) {
  let diceCount = 2;
  if (minutes === 20) diceCount = 4;
  if (minutes === 30) diceCount = 5;
  const rolls = rollDice(diceCount);
  const successes = countSuccesses(rolls);
  return { diceCount, rolls, successes, outcome: getOutcome(successes) };
}

export function getCurrentRoom(state) {
  if (!Array.isArray(state.rooms)) state.rooms = [];
  return state.rooms.find((room) => room.uid === state.currentRoomUid) ?? null;
}

async function createRoom(state, { isEntrance = false, isUnique = false } = {}) {
  state.roomsExplored += 1;

  const room = {
    uid: `${state.currentLevel}-${state.roomsExplored}-${Date.now()}`,
    id: state.roomsExplored,
    level: state.currentLevel,
    entrance: isEntrance,
    unique: isUnique,
    searched: false,
    descriptor: null,
    room: null,
    uniqueFeature1: null,
    uniqueFeature2: null,
    contents: null,
    hazard: null,
    routes: null
  };

  room.descriptor = (await drawTable(state.tables.roomDescriptor)).text;

  if (isUnique) {
    const uniqueTables = getUniqueTableNames(state);
    room.uniqueFeature1 = (await drawTable(uniqueTables[0])).text;
    room.uniqueFeature2 = (await drawTable(uniqueTables[1])).text;
  } else {
    room.room = (await drawTable(getRoomTableName(state))).text;
    room.contents = (await drawTable(state.tables.roomContents)).text;
    room.routes = (await drawTable(state.tables.routes)).text;

    if (String(room.contents).toLowerCase().includes("hazard")) {
      room.hazard = (await drawTable(getHazardTableName(state))).text;
    }
  }

  state.rooms.push(room);
  state.currentRoomUid = room.uid;

  await saveState(state);
  await postRoomToChat(state, room);
  return room;
}

async function showSetupDialog(existingState) {
  const { DialogV2 } = foundry.applications.api;
  const state = existingState ?? (await getState());

  const content = `
    <form class="undaunted-setup-form">
      <div class="form-group">
        <label>Dungeon Type</label>
        <select name="typeMode">
          <option value="roll">Roll from table</option>
          <option value="Cave" ${state.dungeonType === "Cave" ? "selected" : ""}>Cave</option>
          <option value="Tomb" ${state.dungeonType === "Tomb" ? "selected" : ""}>Tomb</option>
          <option value="Fort" ${state.dungeonType === "Fort" ? "selected" : ""}>Fort</option>
          <option value="Temple" ${state.dungeonType === "Temple" ? "selected" : ""}>Temple</option>
        </select>
      </div>
      <div class="form-group">
        <label>Levels</label>
        <select name="levelMode">
          <option value="roll">Roll from table</option>
          <option value="1" ${state.levels === 1 ? "selected" : ""}>1 Level</option>
          <option value="2" ${state.levels === 2 ? "selected" : ""}>2 Levels</option>
          <option value="3" ${state.levels === 3 ? "selected" : ""}>3 Levels</option>
        </select>
      </div>
      <div class="form-group">
        <label>Torch Max Turns</label>
        <input type="number" name="torchMaxTurns" value="${state.torchMaxTurns ?? 6}" min="1">
      </div>
      <div class="form-group">
        <label>Rest Due Every X Turns</label>
        <input type="number" name="restDueEveryTurns" value="${state.restDueEveryTurns ?? 6}" min="1">
      </div>
      <hr>
      <p><b>RollTable Names</b></p>
      ${Object.entries(DEFAULT_TABLES).map(([key, value]) => `
        <div class="form-group">
          <label>${key}</label>
          <input type="text" name="${key}" value="${state.tables?.[key] ?? value}">
        </div>
      `).join("")}
    </form>
  `;

  return DialogV2.wait({
    window: { title: "Set Up Undaunted Dungeon" },
    content,
    buttons: [
      {
        action: "create",
        label: "Create",
        default: true,
        callback: (_, button, dialog) => {
          const form = resolveElement(dialog.element)?.querySelector("form");
          if (!form) return null;
          return Object.fromEntries(new FormData(form).entries());
        }
      },
      {
        action: "cancel",
        label: "Cancel"
      }
    ]
  });
}

export async function setupDungeon() {
  const priorState = await getState();
  const result = await showSetupDialog(priorState);
  if (!result) return null;

  const tables = {};
  for (const key of Object.keys(DEFAULT_TABLES)) {
    tables[key] = result[key] || DEFAULT_TABLES[key];
  }

  let dungeonType = result.typeMode;
  if (result.typeMode === "roll") {
    dungeonType = (await drawTable(tables.dungeonType)).text;
  }

  let levels = Number(result.levelMode);
  if (result.levelMode === "roll") {
    const levelText = String((await drawTable(tables.dungeonLevels)).text).toLowerCase();
    if (levelText.includes("three") || levelText.includes("3")) levels = 3;
    else if (levelText.includes("two") || levelText.includes("2")) levels = 2;
    else levels = 1;
  }

  const state = foundry.utils.mergeObject(foundry.utils.deepClone(DEFAULT_STATE), {
    active: true,
    dungeonType,
    levels,
    currentLevel: 1,
    progress: 0,
    roomsExplored: 0,
    currentRoomUid: null,
    rooms: [],
    totalTurns: 0,
    totalMinutes: 0,
    encounterPool: 0,
    torchTurnsUsed: 0,
    torchMaxTurns: Number(result.torchMaxTurns) || 6,
    turnsSinceRest: 0,
    restDueEveryTurns: Number(result.restDueEveryTurns) || 6,
    tables
  }, { inplace: false });

  await saveState(state);
  await postDungeonCreatedToChat({ dungeonType, levels, tables });
  await createRoom(state, { isEntrance: true });
  return state;
}

export async function exploreDungeon() {
  const state = await getState();
  if (!state.active) {
    ui.notifications.warn("No active dungeon. Set up a dungeon first.");
    return null;
  }

  const timeResult = addDungeonTime(state, 1, "Explore / move to next room");
  const roll = rollExplore(state.progress);

  let content = `
    <h2>Explore a Dungeon</h2>
    <p><b>Time:</b> +1 turn / 10 minutes</p>
    <p><b>Rolled:</b> ${roll.diceCount}d6 -> [${roll.rolls.join(", ")}]</p>
    <p><b>Successes:</b> ${roll.successes}</p>
    <p><b>Outcome:</b> ${roll.outcome}</p>
  `;

  if (roll.outcome === "Strong") {
    content += "<p><b>Result:</b> You find the Unique Room.</p>";
    await postSimpleMessage("Explore a Dungeon", content.replace(/^<h2>Explore a Dungeon<\/h2>/, ""));
    await postTimeToChat(state, timeResult);
    await createRoom(state, { isUnique: true });

    if (state.currentLevel < state.levels) {
      state.currentLevel += 1;
      state.progress = 0;
      state.roomsExplored = 0;
      state.currentRoomUid = null;
      await saveState(state);

      await postSimpleMessage(
        "Next Dungeon Level",
        `<p>The unique room leads to a new entrance on level ${state.currentLevel}.</p><p><b>Progress reset to 0.</b></p>`
      );

      await createRoom(state, { isEntrance: true });
    } else {
      state.active = false;
      await saveState(state);
      await postSimpleMessage("Dungeon Complete", "<p>You found the final Unique Room.</p>");
    }

    return state;
  }

  if (roll.outcome === "Weak") {
    state.progress += 1;
    content += "<p><b>Result:</b> Enter a new room and gain +1 Progress.</p>";
  }

  if (roll.outcome === "Failure") {
    content += "<p><b>Result:</b> Enter a new room. Progress does not increase.</p>";
  }

  await saveState(state);
  await postSimpleMessage("Explore a Dungeon", content.replace(/^<h2>Explore a Dungeon<\/h2>/, ""));
  await postTimeToChat(state, timeResult);
  await createRoom(state);
  return state;
}

export async function searchRoom() {
  const state = await getState();
  if (!state.active) {
    ui.notifications.warn("No active dungeon.");
    return null;
  }

  const room = getCurrentRoom(state);
  if (!room) {
    ui.notifications.warn("No current room found.");
    return null;
  }

  if (room.searched) {
    await postSimpleMessage("Search Room", `<p><b>Room ${room.id}</b> has already been successfully searched.</p>`);
    return state;
  }

  const { DialogV2 } = foundry.applications.api;
  const minutes = await DialogV2.wait({
    window: { title: "Search & Discover" },
    content: `
      <form>
        <div class="form-group">
          <label>How long do you search?</label>
          <select name="minutes">
            <option value="10">10 minutes - 2d6</option>
            <option value="20">20 minutes - 4d6</option>
            <option value="30">30 minutes - 5d6</option>
          </select>
        </div>
      </form>
    `,
    buttons: [
      {
        action: "search",
        label: "Search",
        default: true,
        callback: (_, button, dialog) => {
          const form = resolveElement(dialog.element)?.querySelector("form");
          if (!form) return null;
          return Number(new FormData(form).get("minutes"));
        }
      },
      { action: "cancel", label: "Cancel" }
    ]
  });

  if (!minutes) return state;

  const turns = Math.ceil(minutes / 10);
  const timeResult = addDungeonTime(state, turns, `Search room for ${minutes} minutes`);
  const roll = rollSearch(minutes);
  const discoveries = [];

  if (roll.outcome === "Strong") {
    discoveries.push(await drawTable(state.tables.searchDiscoveries));
    discoveries.push(await drawTable(state.tables.searchDiscoveries));
    room.searched = true;
  }

  if (roll.outcome === "Weak") {
    discoveries.push(await drawTable(state.tables.searchDiscoveries));
    room.searched = true;
  }

  await saveState(state);

  let html = `
    <p><b>Room:</b> ${room.id}</p>
    <p><b>Time Spent:</b> ${minutes} minutes</p>
    <p><b>Rolled:</b> ${roll.diceCount}d6 -> [${roll.rolls.join(", ")}]</p>
    <p><b>Successes:</b> ${roll.successes}</p>
    <p><b>Outcome:</b> ${roll.outcome}</p>
    <hr>
  `;

  if (roll.outcome === "Failure") {
    html += "<p><b>Result:</b> Face an Encounter.</p>";
  } else {
    html += `<p><b>Discoveries:</b></p><ul>${discoveries.map((discovery) => `<li>${discovery.text}</li>`).join("")}</ul>`;
  }

  await postSimpleMessage("Search & Discover", html);
  await postTimeToChat(state, timeResult);
  return state;
}

export async function faceEncounter() {
  const state = await getState();
  const encounter1 = await drawTable(state.tables.encounterMonsters);
  const reaction = await drawTable(state.tables.npcReaction);
  const activity = await drawTable(state.tables.activity);
  const distance = await drawTable(state.tables.distance);
  const activityText = String(activity.text).toLowerCase();
  const isNpcClash = activityText.includes("npc clash") || activityText.includes("clash");
  const encounter2 = isNpcClash ? await drawTable(state.tables.encounterMonsters) : null;

  let html = `
    <p><b>Encounter:</b> ${encounter1.text}</p>
    ${encounter2 ? `<p><b>Second Encounter:</b> ${encounter2.text}</p>` : ""}
    <hr>
    <p><b>NPC Reaction:</b> ${reaction.text}</p>
    <p><b>Activity:</b> ${activity.text}</p>
    <p><b>Distance:</b> ${distance.text}</p>
  `;

  if (encounter2) {
    html += "<hr><p><b>NPC Clash:</b> The activity represents a conflict between both encounter groups.</p>";
  }

  await postSimpleMessage("Face an Encounter", html);
  return state;
}

export async function advanceTimeManual() {
  const state = await getState();
  const { DialogV2 } = foundry.applications.api;
  const result = await DialogV2.wait({
    window: { title: "Advance Dungeon Time" },
    content: `
      <form>
        <div class="form-group">
          <label>Dungeon Action</label>
          <select name="turns">
            <option value="1">Explore / move - 1 turn</option>
            <option value="1">Disarm / examine trap - 1 turn</option>
            <option value="3">Clear blocked passage - 3 turns</option>
            <option value="1">Rest / linger - 1 turn</option>
            <option value="1">Loud combat - 1 turn</option>
            <option value="custom">Custom turns</option>
          </select>
        </div>
        <div class="form-group">
          <label>Custom Turns</label>
          <input type="number" name="customTurns" value="1" min="0">
        </div>
      </form>
    `,
    buttons: [
      {
        action: "advance",
        label: "Advance",
        default: true,
        callback: (_, button, dialog) => {
          const form = resolveElement(dialog.element)?.querySelector("form");
          if (!form) return null;
          const data = Object.fromEntries(new FormData(form).entries());
          const selectedText = form.querySelector("select[name='turns'] option:checked").textContent;
          const turns = data.turns === "custom" ? Number(data.customTurns) : Number(data.turns);
          return { turns, reason: selectedText };
        }
      },
      { action: "cancel", label: "Cancel" }
    ]
  });

  if (!result) return state;

  const timeResult = addDungeonTime(state, result.turns, result.reason);
  await saveState(state);
  await postTimeToChat(state, timeResult);

  if (String(result.reason).toLowerCase().includes("loud combat")) {
    await checkWanderingMonster(true);
  }

  return state;
}

export async function checkWanderingMonster(immediate = false) {
  const state = await getState();
  if (state.encounterPool <= 0 && !immediate) {
    ui.notifications.warn("Encounter pool is empty.");
    return null;
  }

  const diceCount = immediate ? Math.max(1, state.encounterPool + 1) : Math.max(1, state.encounterPool);
  const rolls = rollDice(diceCount);
  const triggered = rolls.some((roll) => roll === 1);

  let html = `
    <p><b>Pool:</b> ${diceCount}d6</p>
    <p><b>Rolled:</b> [${rolls.join(", ")}]</p>
    <hr>
  `;

  if (triggered) {
    const monster = await drawTable(state.tables.wanderingMonsters);
    html += `
      <h3>Wandering Monster!</h3>
      <p><b>Monster / Mob:</b> ${monster.text}</p>
      <p><b>Next:</b> You may press <b>Encounter</b> for reaction, activity, and distance.</p>
      <p><em>The encounter pool resets to 0.</em></p>
    `;
    state.encounterPool = 0;
  } else {
    html += `
      <h3>Quiet...</h3>
      <p>No wandering monster appears.</p>
      <p><em>The encounter pool remains at ${state.encounterPool}d6.</em></p>
    `;
  }

  await saveState(state);
  await postSimpleMessage("Wandering Monster Check", html);
  return state;
}

export async function resetTorch() {
  const state = await getState();
  state.torchTurnsUsed = 0;
  await saveState(state);
  await postSimpleMessage("Torch Reset", `<p>A fresh torch is lit. Torch timer is now 0 / ${state.torchMaxTurns} turns.</p>`);
  return state;
}

export async function restTaken() {
  const state = await getState();
  state.turnsSinceRest = 0;
  await saveState(state);
  await postSimpleMessage("Rest Taken", `<p>Rest timer reset to 0 / ${state.restDueEveryTurns} turns.</p>`);
  return state;
}

export async function resetDungeon() {
  await resetState();
  ui.notifications.info("Undaunted dungeon tracker reset.");
  return getState();
}
