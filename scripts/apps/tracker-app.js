import { MODULE_ID } from "../constants.js";
import { getState } from "../state.js";
import {
  advanceTimeManual,
  checkWanderingMonster,
  configureTables,
  exploreDungeon,
  faceEncounter,
  getCurrentRoom,
  resetDungeon,
  resetTorch,
  restTaken,
  searchRoom,
  setupDungeon
} from "../tracker-service.js";
import { formatTime } from "../utils.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

function resolveElement(element) {
  if (element instanceof HTMLElement) return element;
  if (Array.isArray(element)) return element[0] ?? null;
  return element?.[0] ?? element ?? null;
}

export class UndauntedTrackerApplication extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: `${MODULE_ID}-app`,
    classes: [MODULE_ID, "application"],
    tag: "section",
    position: {
      width: 680,
      height: "auto"
    },
    window: {
      title: "Undaunted Dungeon Tracker",
      resizable: true
    }
  };

  static get PARTS() {
    const basePath = game?.modules?.get(MODULE_ID)?.path ?? `modules/${MODULE_ID}`;
    return {
      main: {
        template: `${basePath}/templates/tracker.hbs`
      }
    };
  }

  async _prepareContext() {
    const state = await getState();
    const room = getCurrentRoom(state);

    return {
      active: state.active ? "Yes" : "No",
      dungeonType: state.dungeonType ?? "None",
      currentLevel: state.currentLevel ?? 1,
      levels: state.levels ?? 1,
      progress: state.progress ?? 0,
      currentRoomId: room?.id ?? "None",
      searched: room?.searched ? "Yes" : "No",
      totalTime: formatTime(state.totalMinutes),
      totalTurns: state.totalTurns,
      encounterPool: `${state.encounterPool}d6`,
      torchStatus: state.torchTurnsUsed >= state.torchMaxTurns
        ? "Burned out"
        : `${state.torchTurnsUsed} / ${state.torchMaxTurns}`,
      restStatus: state.turnsSinceRest >= state.restDueEveryTurns
        ? "Rest due"
        : `${state.turnsSinceRest} / ${state.restDueEveryTurns}`,
      encounterTable: state.tables.encounterMonsters,
      wanderingTable: state.tables.wanderingMonsters
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);

    const element = resolveElement(this.element);
    if (!element) return;

    for (const button of element.querySelectorAll("[data-action]")) {
      button.addEventListener("click", this.#onActionClick.bind(this));
    }
  }

  async #onActionClick(event) {
    event.preventDefault();
    const action = event.currentTarget.dataset.action;

    switch (action) {
      case "setup":
        await configureTables();
        break;
      case "new":
        await setupDungeon();
        break;
      case "explore":
        await exploreDungeon();
        break;
      case "search":
        await searchRoom();
        break;
      case "encounter":
        await faceEncounter();
        break;
      case "time":
        await advanceTimeManual();
        break;
      case "wandering":
        await checkWanderingMonster();
        break;
      case "torch":
        await resetTorch();
        break;
      case "rest":
        await restTaken();
        break;
      case "reset":
        await resetDungeon();
        break;
      case "close":
        await this.close();
        return;
      default:
        return;
    }

    await this.render({ force: true });
  }
}
