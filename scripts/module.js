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
      name: "dungeon-explorer",
      title: "Undaunted Dungeon Tracker",
      icon: "fas fa-torch",
      button: true,
      onClick: () => openTracker()
    });
  });
}

function registerBoardButton() {
  Hooks.on("renderSceneControls", (_app, html) => {
    const root = html?.[0] ?? html;
    if (!root) return;
    if (root.querySelector(`.${MODULE_ID}-board-button`)) return;

    const controlBar = root.querySelector("#controls");
    if (!controlBar) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = `${MODULE_ID}-board-button`;
    button.title = "Undaunted Dungeon Tracker";
    button.innerHTML = '<i class="fas fa-torch"></i><span>Dungeon</span>';
    button.addEventListener("click", () => openTracker());
    controlBar.appendChild(button);
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
  registerBoardButton();
});

Hooks.once("ready", () => {
  registerApi();
});
