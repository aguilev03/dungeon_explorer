import { formatTime } from "./utils.js";

function createMessage(content) {
  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    content
  });
}

export async function postTimeToChat(state, timeResult) {
  let html = `
    <h2>Dungeon Time</h2>
    <p><b>Reason:</b> ${timeResult.reason}</p>
    <p><b>Time Added:</b> ${timeResult.turns} turn(s), ${timeResult.minutes} minutes</p>
    <hr>
    <p><b>Total Time:</b> ${formatTime(state.totalMinutes)}</p>
    <p><b>Total Turns:</b> ${state.totalTurns}</p>
    <p><b>Encounter Pool:</b> ${state.encounterPool}d6</p>
    <p><b>Torch:</b> ${state.torchTurnsUsed} / ${state.torchMaxTurns} turns</p>
    <p><b>Rest:</b> ${state.turnsSinceRest} / ${state.restDueEveryTurns} turns</p>
  `;

  if (timeResult.torchBurnedOut) {
    html += "<p><b>Warning:</b> Torch has burned out or needs replacing.</p>";
  }

  if (timeResult.restDue) {
    html += "<p><b>Warning:</b> Rest is due.</p>";
  }

  return createMessage(html);
}

export async function postRoomToChat(state, room) {
  const title = room.entrance
    ? `Dungeon Entrance - Level ${room.level}`
    : room.unique
      ? `Unique Room Found - Level ${room.level}`
      : `Dungeon Room ${room.id} - Level ${room.level}`;

  let html = `
    <h2>${title}</h2>
    <p><b>Dungeon Type:</b> ${state.dungeonType}</p>
    <p><b>Progress:</b> ${state.progress}</p>
    <hr>
    <p><b>Descriptor:</b> ${room.descriptor}</p>
  `;

  if (room.unique) {
    html += `
      <p><b>Unique Feature 1:</b> ${room.uniqueFeature1}</p>
      <p><b>Unique Feature 2:</b> ${room.uniqueFeature2}</p>
      <hr>
      <p><b>This level is fully explored.</b> Unexplored routes now lead to dead ends.</p>
    `;
  } else {
    html += `
      <p><b>Room:</b> ${room.room}</p>
      <p><b>Contents:</b> ${room.contents}</p>
      ${room.hazard ? `<p><b>Hazard:</b> ${room.hazard}</p>` : ""}
      <p><b>Routes:</b> ${room.routes}</p>
    `;
  }

  return createMessage(html);
}

export async function postDungeonCreatedToChat({ dungeonType, levels, tables }) {
  return createMessage(`
    <h2>Undaunted Dungeon Created</h2>
    <p><b>Type:</b> ${dungeonType}</p>
    <p><b>Levels:</b> ${levels}</p>
    <p><b>Encounter Table:</b> ${tables.encounterMonsters}</p>
    <p><b>Wandering Table:</b> ${tables.wanderingMonsters}</p>
  `);
}

export async function postSimpleMessage(title, content) {
  return createMessage(`<h2>${title}</h2>${content}`);
}
