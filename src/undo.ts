import { produce, produceWithPatches, enablePatches, applyPatches } from "immer";
import Event from "./event";
enablePatches();

// produceWithUndo()
//
// This function wraps any user-initiated board-modifying function to ensure two things:
// 1. An event is always recorded using Event.add().
// 2. Undo functionality is enabled by adding inverse patches to the last event.
//
// How it works:
// - It takes a RecipeWithEvent function, which is an Immer recipe that:
//    - Receives `draft` (a mutable version of the board) and ...args.
//    - Performs the modifications on `draft`.
//    - Returns the parameters needed to create an event (eventParams).
//
// The wrapped function:
// - Returns a new function that accepts the `board` as its first argument, followed by any other arguments needed by the recipe.
// - Ensures that after the recipe runs, the event and undo patches are handled automatically.

const produceWithUndo =
  (recipeFn: RecipeWithEvent) =>
  (board: Board, ...args) => {
    const recipeWithEvent = (draft: Board) => {
      const eventParams = recipeFn(draft, ...args);
      Event.add(draft, eventParams);
    };
    // Apply the recipe and track patches for undo functionality
    const [nextState, _patches, inversePatches] = produceWithPatches(board, recipeWithEvent);
    // Add patches for undo functionality
    return produce(nextState, (draft) => {
      Event.addPatches(draft, draft.timeline[0], inversePatches);
    });
  };

// UNDO

const undo = (board: Board) => {
  const inversePatches = board.events[board.timeline[0]].inversePatches;
  return applyPatches(board, inversePatches);
};

export default {
  produce: produceWithUndo,
  undo,
};
