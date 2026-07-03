export const MODULE_ID = "dungeon_explorer";
export const FLAG_SCOPE = MODULE_ID;
export const FLAG_KEY = "state";

export const DEFAULT_TABLES = {
  dungeonType: "Undaunted - Dungeon Type",
  dungeonLevels: "Undaunted - Dungeon Levels",
  routes: "Undaunted - Dungeon Routes",
  roomDescriptor: "Undaunted - Room Descriptor",
  roomContents: "Undaunted - Room Contents",
  searchDiscoveries: "Undaunted - Search Discoveries",
  wanderingMonsters: "Undaunted - Wandering Monsters",
  encounterMonsters: "Undaunted - Monsters",
  npcReaction: "Undaunted - NPC Reaction",
  activity: "Undaunted - Activity",
  distance: "Undaunted - Distance",
  caveHazards: "Undaunted - Cave Hazards",
  tombHazards: "Undaunted - Tomb Hazards",
  fortHazards: "Undaunted - Fort Hazards",
  templeHazards: "Undaunted - Temple Hazards",
  caveRoom: "Undaunted - Cave Room",
  tombRoom: "Undaunted - Tomb Room",
  fortRoom: "Undaunted - Fort Room",
  templeRoom: "Undaunted - Temple Room",
  caveUnique1: "Undaunted - Cave Unique Room",
  caveUnique2: "Undaunted - Cave Unique Room 2",
  tombUnique1: "Undaunted - Tomb Unique Room",
  tombUnique2: "Undaunted - Tomb Unique Room 2",
  fortUnique1: "Undaunted - Fort Unique Room",
  fortUnique2: "Undaunted - Fort Unique Room 2",
  templeUnique1: "Undaunted - Temple Unique Room",
  templeUnique2: "Undaunted - Temple Unique Room 2"
};

export const DEFAULT_STATE = {
  active: false,
  dungeonType: null,
  levels: 1,
  currentLevel: 1,
  progress: 0,
  roomsExplored: 0,
  currentRoomUid: null,
  rooms: [],
  totalTurns: 0,
  totalMinutes: 0,
  encounterPool: 0,
  torchTurnsUsed: 0,
  torchMaxTurns: 6,
  turnsSinceRest: 0,
  restDueEveryTurns: 6,
  tables: DEFAULT_TABLES
};
