import { describe, expect, it } from "vitest";
import Board from "../src/board";
import board from "../sampleboard";

describe("# Board Tests", () => {
  describe("reset()", () => {
    it("should reset the board to empty state", () => {
      const newBoard = Board.reset(board);
      expect(newBoard.shifts).toEqual({});
      expect(newBoard.timeline.length).toBe(1);
      expect(
        Object.keys(newBoard.zones).reduce(
          (acc, zoneId) => acc + newBoard.zones[zoneId].shifts.length,
          0
        )
      ).toBe(0);
      expect(newBoard.events[newBoard.timeline[0]].inversePatches.length).toBeGreaterThan(0);
    });
  });

  describe("signIn()", () => {
    it("should add users to the board and their signOn zones", () => {
      const provider = { last: "Irving", first: "Julius" };
      const schedule = {
        name: "Dunkmaster Shift",
        bonus: 0,
        joinZones: ["main", "off"],
        role: "physician",
      };
      const newBoard = Board.signIn(board, provider, schedule);
      const newEventId = newBoard.timeline[0];
      const shift = newBoard.shifts[newBoard.events[newEventId].shift!];
      expect(shift.provider.last).toBe("Irving");
      expect(newBoard.zones.off.shifts[0]).toBe(shift.id);
      expect(newBoard.zones.main.shifts.includes(shift.id)).toBe(true);
    });
  });
  describe("joinZone()", () => {
    it("should add user to specified zone", () => {
      const newBoard = Board.joinZone(board, "fasttrack", "one");
      expect(newBoard.zones.fasttrack.shifts.includes("one")).toBe(true);
    });
  });
  describe("leaveZone()", () => {
    it("should remove user from a zone", () => {
      const newBoard = Board.leaveZone(board, "main", "one");
      expect(newBoard.zones.main.shifts.includes("one")).toBe(false);
    });
  });
  describe("switchZone", () => {
    it("should remove user from one zone and move to another", () => {
      const newBoard = Board.switchZone(board, "main", "fasttrack", "one");
      expect(newBoard.zones.main.shifts.includes("one")).toBe(false);
      expect(newBoard.zones.fasttrack.shifts.includes("one")).toBe(true);
    });
  });
  describe("signOut()", () => {
    it("should remove user from all zones and move to Off Zone", () => {
      // add shift to two zones
      const newBoard = Board.joinZone(board, "fasttrack", "one");
      const newNewBoard = Board.signOut(newBoard, "one");
      expect(newNewBoard.zones.main.shifts.includes("one")).toBe(false);
      expect(newNewBoard.zones.fasttrack.shifts.includes("one")).toBe(false);
      expect(newNewBoard.zones.off.shifts.includes("one")).toBe(true);
    });
  });
  describe("moveActive()", () => {
    it("should move active staff forward and back in rotation", () => {
      const newBoard = Board.moveActive(board, "main", "patient", -1);
      expect(newBoard.zones.main.active.patient).toBe("two");
    });
    it("should move active patient forward and back in rotation", () => {
      const newBoard = Board.moveActive(board, "main", "patient", 1);
      expect(newBoard.zones.main.active.patient).toBe("two");
    });
  });
  describe("changePosition()", () => {
    it("should move shifts forward and back in zone", () => {
      const newBoard = Board.changePosition(board, "main", "one", 1);
      expect(newBoard.zones.main.shifts[0]).toBe("one");
    });
  });
});
