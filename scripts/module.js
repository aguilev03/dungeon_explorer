import { MODULE_ID } from "./constants.js";
import { UndauntedTrackerApplication } from "./apps/tracker-app.js";
import { resetDungeon, setupDungeon } from "./tracker-service.js";

let trackerApplication;

function getTrackerApplication() {
  if (!trackerApplication) trackerApplication = new UndauntedTrackerApplication();
  return trackerApplication;
}

export async function openTracker() {
  const app = getTrackerApplication();
  await app.render({ force: true });
  return app;
}

function registerSceneControl() {
  Hooks.on("getSceneControlButtons", (controls) => {
    const tokenControls = controls.find((control) => control.name === "token") ?? controls[0];
    if (!tokenControls) return;

    tokenControls.tools.push({
      name: "undaunted-dungeon-tracker",
      title: "Undaunted Dungeon Tracker",
      icon: "fas fa-dungeon",
      button: true,
      onClick: () => openTracker()
    });
  });
}

function registerApi() {
  const api = {
    openTracker,
    setupDungeon,
    resetDungeon
  };

  game.modules.get(MODULE_ID).api = api;
  globalThis.UndauntedDungeonTracker = api;
}

Hooks.once("init", () => {
  registerSceneControl();
});

Hooks.once("ready", () => {
  registerApi();
});
