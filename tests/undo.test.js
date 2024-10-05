import { describe, it, expect } from "vitest";
import Board from "../src/board";
import board from "../dummy/sampleboard";

// if undo() works then so does produceWithUndo()
describe("undo()", () => {
  it("should undo the last event", () => {
    const newBoard = Board.signOut(board, "one");
    const newNewBoard = Board.reset(newBoard);
    const firstUndo = Board.undo(newNewBoard);
    const secondUndo = Board.undo(newBoard);
    expect(firstUndo).toEqual(newBoard);
    expect(secondUndo).toEqual(board);
  });
});
