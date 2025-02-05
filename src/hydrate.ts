type ZoneHydrated = Omit<Zone, "shifts"> & {
  shifts: Shift[];
};

type BoardEventNoPatches = Omit<BoardEvent, "inversePatches">;

type BoardEventHydrated = Omit<BoardEvent, "shift" | "supervisorShift" | "inversePatches"> & {
  shift: Shift | string;
  supervisorShift: Shift | string | null;
  inversePatches?: any[] | undefined;
};

type BoardHydrated = {
  date: string;
  zoneList1: ZoneHydrated[];
  zoneList2: ZoneHydrated[];
  timeline: BoardEventHydrated[];
};

const getShift = (board: Board, shiftId: ShiftId): Shift => {
  return board.shifts[shiftId];
};

const hydrateZone = (board: Board, zone: Zone): ZoneHydrated => {
  return {
    ...zone,
    shifts: zone.shifts.map((shiftId) => getShift(board, shiftId)),
  };
};

const getZoneList = (zones: Board["zones"], list: number): Zone[] => {
  const filteredZones = Object.values(zones).filter(
    (zone) => zone.order >= list * 10 && zone.order < list * 10 + 10
  );
  return filteredZones.sort((a, b) => a.order - b.order);
};

const hydrateZoneList = (board: Board, list: number): ZoneHydrated[] => {
  return getZoneList(board.zones, list).map((zone) => hydrateZone(board, zone));
};

const getEvent = (board: Board, eventId: BoardEventId): BoardEvent => {
  return board.events[eventId];
};

const trimEvent = (event: BoardEvent): BoardEventNoPatches => {
  const { inversePatches, ...trimmedEvent } = event;
  return trimmedEvent;
};

const getEventShifts = (
  board: Board,
  event: BoardEvent | BoardEventNoPatches
): BoardEventHydrated => {
  return {
    ...event,
    shift: getShift(board, event.shift!),
    supervisorShift: event.supervisorShift ? getShift(board, event.supervisorShift) : null,
  };
};

const hydrateTimeline = (board: Board) => {
  return board.timeline
    .map((id: BoardEventId) => getEvent(board, id))
    .map(trimEvent)
    .map((event: BoardEventNoPatches) => getEventShifts(board, event));
};

export const hydrate = (board: Board): BoardHydrated => {
  return {
    date: board.date,
    zoneList1: hydrateZoneList(board, 1),
    zoneList2: hydrateZoneList(board, 2),
    timeline: hydrateTimeline(board),
  };
};
