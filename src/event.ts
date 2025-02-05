import ShortUniqueId from "short-unique-id";
import { getMountainTime } from "./dates.js";
const uid = new ShortUniqueId({ length: 6 });

const EVENT_LIMIT = parseInt(process.env.DEV_EVENT_LIMIT as string) || 25;

const make = (options: EventMakeParams): BoardEvent => {
  return { id: uid.rnd(), time: getMountainTime(), inversePatches: [], ...options };
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
    console.error(`[addReassign] No shiftId found for newEventId [${newEventId}]`);
    throw new Error(`No event.shiftId found for newEventId [${newEventId}]`);
  }
  const newProvider = draft.shifts[newShiftId].provider;
  if (!newProvider) {
    console.error(`[addReassign] No provider found for shiftId [${newShiftId}]`);
    throw new Error(`No shift found for shiftId [${newShiftId}]`);
  }
  event.message = `Reassigned to: ${newProvider.first} ${newProvider.last}`;
  return draft;
};

// ADD PATCHES
const addPatches = (draft: any, eventId: BoardEventId, patches: any[]): Board => {
  draft.events[eventId].inversePatches = patches;
  return draft;
};

export default {
  make,
  add,
  addReassign,
  addPatches,
};
