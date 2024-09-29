import ShortUniqueId from "short-unique-id";
const uid = new ShortUniqueId({ length: 6 });

const EVENT_LIMIT = 3;

type EventMakeParams = {
  type: string;
  message?: string;
  detail?: string;
  patient?: { room: string; mode: string };
  shift?: ShiftId;
  supervisorShift?: ShiftId;
};

const make = (options: EventMakeParams): BoardEvent => {
  return { id: uid.rnd(), inversePatches: [], ...options };
};

// ADD
const add = (draft: Board, params: EventMakeParams): BoardEventId => {
  const event = make(params);
  // add event to board
  draft.events[event.id] = event;
  // add eventId to timeline
  draft.timeline = [event.id, ...draft.timeline.slice(0, EVENT_LIMIT - 1)];
  // filter events to just those on timeline
  for (const id in draft.events) {
    if (!draft.timeline.includes(id)) {
      delete draft.events[id];
    }
  }
  return event.id;
};

// REASSIGN
const addReassign = (draft: Board, priorEventId: BoardEventId, newEventId: BoardEventId): Board => {
  const event = draft.events[priorEventId];
  const newShiftId = draft.events[newEventId].shift;
  if (!newShiftId) {
    throw new Error(`Error: no event.shiftId found for newEventId: ${newEventId}`);
  }
  const newProvider = draft.shifts[newShiftId].provider;
  if (!newProvider) {
    throw new Error(`Error: no shift found for shiftId: ${newShiftId}`);
  }
  event.message = `Reassigned to: ${newProvider.first} ${newProvider.last}`;
  return draft;
};

// ADD PATCHES
const addPatches = (draft: Board, eventId: BoardEventId, patches: object[]): Board => {
  draft.events[eventId].inversePatches = patches;
  return draft;
};

// UNDO
const undo = () => {};

export default {
  make,
  add,
  addReassign,
  addPatches,
  undo,
};
