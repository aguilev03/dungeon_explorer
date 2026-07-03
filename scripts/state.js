import { DEFAULT_STATE, DEFAULT_TABLES, FLAG_KEY, FLAG_SCOPE } from "./constants.js";

function cloneState(state) {
  return foundry.utils.deepClone(state);
}

export async function getState() {
  const storedState = game.user.getFlag(FLAG_SCOPE, FLAG_KEY) ?? {};
  const mergedState = foundry.utils.mergeObject(cloneState(DEFAULT_STATE), storedState, {
    inplace: false,
    insertKeys: true,
    insertValues: true,
    overwrite: true
  });

  mergedState.rooms = Array.isArray(mergedState.rooms) ? mergedState.rooms : [];
  mergedState.tables = {
    ...DEFAULT_TABLES,
    ...(mergedState.tables ?? {})
  };

  return mergedState;
}

export async function saveState(state) {
  await game.user.setFlag(FLAG_SCOPE, FLAG_KEY, cloneState(state));
}

export async function resetState() {
  await game.user.unsetFlag(FLAG_SCOPE, FLAG_KEY);
}
