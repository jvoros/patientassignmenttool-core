import { describe, expect, it } from "vitest";
import Zone from "../src/zone";
import Shift from "../src/shift";
import board from "./testboard";

describe("# Zone Functions", () => {
  describe("make()", () => {
    it("should make zones", () => {
      const zoneParams = {
        id: "newZone",
        name: "New Zone",
        type: "zone",
        superFrom: "main",
      };
      const zone1 = Zone.make(zoneParams);
      expect(Object.keys(zone1).length).toBe(6);

      const zone2 = Zone.make({ ...zoneParams, type: "zone_patient" });
      expect(Object.keys(zone2).length).toBe(6);

      const zone3 = Zone.make({ ...zoneParams, type: "rotation" });
      expect(zone3.active.patient).toBe(null);
      expect(zone3.active.staff).toBe(null);

      const zone4 = Zone.make({ ...zoneParams, type: "rotation_super" });
      expect(zone4.active.staff).toBe(null);
    });

    it("should insert at 0 for simple and list", () => {
      const newBoard = Zone.join(board, "off", "five");
      expect(newBoard.zones.off.shifts[0]).toBe("five");
    });
  });

  describe("join()", () => {
    it("should update active if empty in rotation or supervisor", () => {
      const board2: Board = structuredClone(board);
      board2.zones.main.active.patient = null;
      board2.zones.main.active.staff = null;
      const newBoard = Zone.join(board2, "main", "five");
      expect(newBoard.zones.main.active.patient).toBe("five");
      expect(newBoard.zones.main.active.staff).toBe("five");
    });

    it("should insert at active.patient index in rotation", () => {
      const newBoard = Zone.join(board, "main", "five");
      expect(newBoard.zones.main.shifts[1]).toBe("five");
    });

    it("should insert at 0 if nextPt not set", () => {
      const board2: Board = structuredClone(board);
      board2.zones.main.active.patient = null;
      const newBoard = Zone.join(board2, "main", "five");
      expect(newBoard.zones.main.shifts[0]).toBe("five");
    });

    it("should not allow app to join rotation_super if no doc on", () => {
      const board2: Board = structuredClone(board);
      board2.zones.main.shifts = [];
      expect(() => {
        Zone.join(board2, "main", "four");
      }).toThrowError();
    });
  });

  describe("leave()", () => {
    it("should remove shift from zone", () => {
      const newBoard = Zone.leave(board, "main", "two");
      expect(newBoard.zones.main.shifts.includes("two")).toBe(false);
    });
    it("should handle resetting active assignments", () => {
      const newBoard = Zone.leave(board, "main", "one");
      expect(newBoard.zones.main.active.patient).toBe("two");
      expect(newBoard.zones.main.active.staff).toBe("two");
    });
    it("should throw error if last doc tries to leave super zone", () => {
      const clone = structuredClone(board);
      clone.zones.main.shifts = ["one"];
      expect(() => {
        Zone.leave(clone, "main", "one");
      }).toThrowError();
    });
  });

  describe("advance()", () => {
    it("should advance actives", () => {
      const newBoard = Zone.advance(board, "main", "patient");
      expect(newBoard.zones.main.active.patient).toBe("two");
      const newNewBoard = Zone.advance(newBoard, "main", "staff");
      expect(newNewBoard.zones.main.active.staff).toBe("two");
    });
  });

  describe("adjustOrder()", () => {
    it("should move shifts in zone one slot at a time", () => {
      const newBoard = Zone.adjustOrder(board, "main", "one", 1);
      expect(newBoard.zones.main.shifts[0]).toBe("one");
      const newNewBoard = Zone.adjustOrder(newBoard, "main", "two", -1);
      expect(newNewBoard.zones.main.shifts[0]).toBe("two");
    });
  });
});
