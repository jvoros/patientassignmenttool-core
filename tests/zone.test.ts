import { describe, expect, it } from "vitest";
import Zone from "../src/zone";
import board from "../sampleboard";

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
      expect(zone3.active.patient).toBe(undefined);
      expect(zone3.active.supervisor).toBe(undefined);

      const zone4 = Zone.make({ ...zoneParams, type: "rotation_super" });
      expect(zone4.active.supervisor).toBe(undefined);
    });

    it("should insert at 0 for simple and list", () => {
      const clone = structuredClone(board);
      Zone.join(clone, "off", "five");
      expect(clone.zones.off.shifts[0]).toBe("five");
    });
  });

  describe("join()", () => {
    it("should update active if empty in rotation or supervisor", () => {
      const board2: Board = structuredClone(board);
      board2.zones.main.active.patient = undefined;
      board2.zones.main.active.supervisor = undefined;
      const newBoard = Zone.join(board2, "main", "five");
      expect(newBoard.zones.main.active.patient).toBe("five");
      expect(newBoard.zones.main.active.supervisor).toBe("five");
    });

    it("should insert at active.patient index in rotation", () => {
      const clone = structuredClone(board);
      Zone.join(clone, "main", "five");
      expect(clone.zones.main.shifts[1]).toBe("five");
    });

    it("should insert at 0 if nextPt not set", () => {
      const board2: Board = structuredClone(board);
      board2.zones.main.active.patient = undefined;
      Zone.join(board2, "main", "five");
      expect(board2.zones.main.shifts[0]).toBe("five");
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
      const clone = structuredClone(board);
      Zone.leave(clone, "main", "two");
      expect(clone.zones.main.shifts.includes("two")).toBe(false);
    });
    it("should handle resetting active assignments", () => {
      const clone = structuredClone(board);
      Zone.leave(clone, "main", "one");
      expect(clone.zones.main.active.patient).toBe("two");
      expect(clone.zones.main.active.supervisor).toBe("two");
    });
    it("should throw error if last doc tries to leave super zone", () => {
      const clone = structuredClone(board);
      clone.zones.main.shifts = ["one"];
      expect(() => {
        Zone.leave(clone, "main", "one");
      }).toThrowError();
    });
  });

  describe("moveActive()", () => {
    it("should move actives", () => {
      const clone = structuredClone(board);
      Zone.moveActive(clone, "main", "patient");
      expect(clone.zones.main.active.patient).toBe("two");
      Zone.moveActive(clone, "main", "supervisor");
      expect(clone.zones.main.active.supervisor).toBe("two");
    });
  });

  describe("adjustOrder()", () => {
    it("should move shifts in zone one slot at a time", () => {
      const clone = structuredClone(board);
      Zone.adjustOrder(clone, "main", "one", 1);
      expect(clone.zones.main.shifts[0]).toBe("one");
      Zone.adjustOrder(clone, "main", "two", -1);
      expect(clone.zones.main.shifts[0]).toBe("two");
    });
  });

  describe("provideSupervisor", () => {
    it("should provide a Supervisor ShiftId and advance next supervisor", () => {
      const clone = structuredClone(board);
      const superv = Zone.provideSupervisor(clone, "main");
      expect(superv).toBe("one");
      expect(clone.zones.main.active.supervisor).not.toBe("one");
    });
  });
});
