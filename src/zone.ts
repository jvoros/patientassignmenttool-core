//
// ZONE FUNCTIONS
// All the functions necessary to manipulate zone properties and contents
//

// MAKE
const make = (zoneParams: { id: string; name: string; type: string; superFrom: ZoneId }): Zone => {
  return { ...zoneParams, active: { patient: undefined, supervisor: undefined }, shifts: [] };
};

// JOIN
const join = (draft: Board, zoneId: ZoneId, shiftId: ShiftId): Board => {
  const zone = draft.zones[zoneId];
  // already in zone?
  if (zone.shifts.includes(shiftId)) {
    return draft;
  }
  checkForNotSupervisorShiftError(draft, zoneId, shiftId);
  const insertIndex = handleActivesAndGetIndex(draft, zone, shiftId);
  zone.shifts.splice(insertIndex, 0, shiftId);
  return draft;
};

const checkForNotSupervisorShiftError = (draft: Board, zoneId: ZoneId, shiftId: ShiftId) => {
  const isSupervisorZone = draft.zones[zoneId].type.includes("super");
  const isNoDoctorInZone = noDoctorsInZone(draft, zoneId);
  const isNotDoctorShift = draft.shifts[shiftId].role !== "physician";
  if (isSupervisorZone && isNoDoctorInZone && isNotDoctorShift) {
    throw new Error(
      `Error adding shift ${shiftId}. Must be at least one doctor in zone: ${zoneId}`
    );
  }
};

const handleActivesAndGetIndex = (draft: Board, zone: Zone, shiftId: ShiftId): number => {
  let index = 0;
  if (zone.type.includes("rotation")) {
    index = zone.active.patient ? findIndex(zone, zone.active.patient) : index;
    zone.active.patient = shiftId;
  }
  if (zone.type.includes("super") && draft.shifts[shiftId].role === "physician") {
    zone.active.supervisor = zone.active.supervisor ?? shiftId; // Assign if not already assigned
  }
  return index;
};

// LEAVE
const leave = (draft: Board, zoneId: ZoneId, shiftId: ShiftId): Board => {
  const zone = draft.zones[zoneId];
  checkForLastSupervisorError(draft, zoneId, shiftId);
  handleActivesOnLeave(draft, zoneId, shiftId);
  zone.shifts = zone.shifts.filter((id) => id !== shiftId);
  return draft;
};

const checkForLastSupervisorError = (draft: Board, zoneId: ZoneId, shiftId: ShiftId): void => {
  const { type } = draft.zones[zoneId];
  const isLastDocInSuperZone = type.includes("super") && numberDoctorsInZone(draft, zoneId) < 2;
  if (isLastDocInSuperZone) {
    throw new Error(`Error leaving zone. Shift ${shiftId} is last doctor in zone ${zoneId}.`);
  }
};

const handleActivesOnLeave = (draft: Board, zoneId: ZoneId, shiftId: ShiftId): void => {
  const { active } = draft.zones[zoneId];
  Object.keys(active).forEach((key) => {
    active[key] = active[key] === shiftId ? getNext(draft, zoneId, key) : active[key];
  });
};

// PROVIDE SUPER
const provideSupervisor = (draft: Board, zoneId: ZoneId): ShiftId => {
  const zone = draft.zones[zoneId];
  const { type, active } = zone;
  if (type !== "rotation_super") throw new Error(`Zone ${zoneId} is not a Supervisor Rotation`);
  if (!active.supervisor) throw new Error(`Zone ${zoneId} does not have an active supervisor.`);
  const supervisor = active.supervisor;
  moveActive(draft, zoneId, "supervisor");
  return supervisor;
};

// MOVE ACTIVE
const moveActive = (
  draft: Board,
  zoneId: ZoneId,
  whichActive: string,
  direction: number = 1
): Board => {
  draft.zones[zoneId].active[whichActive] = getNext(draft, zoneId, whichActive, direction);
  return draft;
};

// ADJUST ORDER
const adjustOrder = (draft: Board, zoneId: ZoneId, shiftId: ShiftId, direction: number): Board => {
  const zone = draft.zones[zoneId];
  const { index, nextIndex } = findIndexAndNeighbor(zone, shiftId, direction);
  zone.shifts.splice(nextIndex, 0, zone.shifts.splice(index, 1)[0]);
  return draft;
};

// GET NEXT
const getNext = (
  board: Board,
  zoneId: ZoneId,
  whichActive: string,
  offset: number = 1
): ShiftId | undefined => {
  checkForNoSupervisorError(board, zoneId, whichActive);
  const zone = board.zones[zoneId];
  if (zone.type.includes("zone")) return undefined;
  const currentActiveId = zone.active[whichActive];
  const nextId = findNeighbor(zone, currentActiveId, offset);
  const nextShiftRole = board.shifts[nextId].role;
  const needNextsupervisorAndNextNotDoc =
    whichActive === "supervisor" && nextShiftRole !== "physician";
  const newOffset = offset < 0 ? offset - 1 : offset + 1;
  if (needNextsupervisorAndNextNotDoc) {
    return getNext(board, zoneId, whichActive, newOffset);
  }
  return nextId;
};

const checkForNoSupervisorError = (board: Board, zoneId: ZoneId, whichActive: string) => {
  const needNextsupervisorAndNoDoctorInZone =
    whichActive === "supervisor" && noDoctorsInZone(board, zoneId);
  if (needNextsupervisorAndNoDoctorInZone) {
    throw new Error(
      `No doctors in Zone ${zoneId}. Can't get next supervisor. Prevent infinite recursion.`
    );
  }
};

// HELPERS

const findIndex = (zone: Zone, shiftId: ShiftId): number => {
  return zone.shifts.findIndex((id) => id === shiftId);
};

const findIndexAndNeighbor = (
  zone: Zone,
  shiftId: ShiftId,
  offset: number
): { index: number; nextIndex: number; nextId: ShiftId } => {
  const index = findIndex(zone, shiftId);
  if (index < 0) {
    throw new Error(`Zone does not contain ${shiftId}`);
  }
  const length = zone.shifts.length;
  const nextIndex = (index + offset + length) % length;
  return { index, nextIndex, nextId: zone.shifts[nextIndex] };
};

const findNeighbor = (zone: Zone, shiftId: ShiftId, offset: number): ShiftId => {
  const { nextId } = findIndexAndNeighbor(zone, shiftId, offset);
  return nextId;
};

const numberDoctorsInZone = (board: Board, zoneId: ZoneId): number => {
  const numberDocs = board.zones[zoneId].shifts.reduce((acc, shiftId) => {
    return board.shifts[shiftId].role === "physician" ? acc + 1 : acc;
  }, 0);
  return numberDocs;
};

const noDoctorsInZone = (board: Board, zoneId: ZoneId): boolean =>
  numberDoctorsInZone(board, zoneId) === 0;

export default {
  make,
  join,
  leave,
  provideSupervisor,
  moveActive,
  adjustOrder,
};
