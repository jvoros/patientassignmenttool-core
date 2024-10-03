import { describe, expect, it } from "vitest";
import Assign from "../src/assign";
import Board from "../src/board";
import board from "../sampleboard";

describe("assignToShift()", () => {
  it("should increase count of shift", () => {
    const newBoard = Assign.assignToShift(board, "main", "one", {
      mode: "walkin",
      room: "1",
    });
    expect(newBoard.shifts.one.counts.walkin).toBe(2);
  });
  it("should handle supervisor in same zone and advance supervisor", () => {
    const newBoard = Board.joinZone(board, "main", "three");
    const newNewBoard = Assign.assignToShift(newBoard, "main", "three", {
      mode: "ambo",
      room: "3",
    });
    expect(newNewBoard.shifts.three.counts.ambo).toBe(1);
    expect(newNewBoard.shifts.one.counts.supervisor).toBe(2);
    expect(newNewBoard.zones.main.active.supervisor).toBe("two");
  });
  it("should handle supervisor in different zone and advance active supervisor", () => {
    const newBoard = Assign.assignToShift(board, "fasttrack", "three", {
      mode: "walkin",
      room: "tra",
    });
    expect(newBoard.shifts.one.counts.supervisor).toBe(2);
    expect(newBoard.zones.main.active.supervisor).toBe("two");
  });
  it("should not move zone for simple type", () => {
    const newBoard = Assign.assignToShift(board, "fasttrack", "three", {
      mode: "walkin",
      room: "tra",
    });
    expect(newBoard.zones.fasttrack.active.patient).toEqual(undefined);
  });
});
describe("assignToZone()", () => {
  it("should advance active.patient only after bonus met", () => {
    const pt = { mode: "walkin", room: "tra" };
    let newBoard = Board.moveActive(board, "main", "patient", 1);
    newBoard = Assign.assignToZone(newBoard, "main", pt);
    expect(newBoard.zones.main.active.patient).toBe("two");
    newBoard = Assign.assignToZone(newBoard, "main", pt);
    expect(newBoard.zones.main.active.patient).toBe("two");
    newBoard = Assign.assignToZone(newBoard, "main", pt);
    expect(newBoard.zones.main.active.patient).toBe("one");
  });

  it("should not advance active.patient if zone.type is zone or zone_patient", () => {
    const newBoard = Assign.assignToZone(board, "fasttrack", {
      mode: "walkin",
      room: "tra",
    });
    expect(newBoard.zones.fasttrack.active.patient).toBe(undefined);
  });
});
describe.todo("reassignPatient()", () => {
  it("should reassign patients to new providers", () => {
    // this test also handles old doc to new doc case
    const newBoard = Assign.reassignPatient(board, "three", "two");
    expect(newBoard.shifts.two.counts.walkin).toBe(1);
    expect(newBoard.events.four.type).toBe("reassign");
  });
  it("should handle old doc & new app", () => {
    const newBoard = Assign.reassignPatient(board, "three", "three");
    expect(newBoard.shifts.three.counts.walkin).toBe(1);
    expect(newBoard.shifts.one.counts.walkin).toBe(1);
    expect(newBoard.events.four.supervisorShift).toBe("one");
    expect(newBoard.events.four.type).toBe("reassign");
  });
  it("should handle old app and new doc", () => {
    const baseBoard = Assign.reassignPatient(board, "three", "three"); // assign to APP
    const newBoard = Assign.reassignPatient(baseBoard, "three", "two"); // reassign to DOC
    expect(newBoard.shifts.two.counts.walkin).toBe(1);
    expect(newBoard.shifts.three.counts.walkin).toBe(0);
    expect(newBoard.events.four.supervisorShift).toBe(undefined);
  });
  it("should handle old app and new app", () => {
    const baseBoard = Assign.reassignPatient(board, "three", "three"); // assign to APP
    const newBoard = Assign.reassignPatient(baseBoard, "three", "four"); // reassign to APP
    expect(newBoard.events.four.supervisorShift).toBe("one");
    expect(newBoard.shifts.four.counts.walkin).toBe(1);
  });
});
