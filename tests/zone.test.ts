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
        type: "list",
        superFrom: "main",
      };
      const zone1 = Zone.make(zoneParams);
      expect(Object.keys(zone1).length).toBe(5);

      const zone2 = Zone.make({ ...zoneParams, type: "simple" });
      expect(Object.keys(zone2).length).toBe(5);

      const zone3 = Zone.make({ ...zoneParams, type: "rotation" });
      expect(Object.keys(zone3).length).toBe(6);

      const zone4 = Zone.make({ ...zoneParams, type: "supervisor" });
      expect(Object.keys(zone3).length).toBe(6);
    });

    it("should insert at 0 for simple and list", () => {
      const newBoard = Zone.addShiftId(board, "five", "off");
      expect(newBoard.zones.off.shifts[0]).toBe("five");
    });
  });

  describe("addShiftId()", () => {
    it("should update nextPt/nextSuper if empty in rotation or supervisor", () => {
      const board2: Board = structuredClone(board);
      board2.zones.main.nextPt = undefined;
      board2.zones.main.nextSuper = undefined;
      const newBoard = Zone.addShiftId(board2, "five", "main");
      expect(newBoard.zones.main.nextPt).toBe("five");
      expect(newBoard.zones.main.nextSuper).toBe("five");
    });

    it("should insert at nextPt index in rotation", () => {
      const newBoard = Zone.addShiftId(board, "five", "main");
      expect(newBoard.zones.main.shifts[1]).toBe("five");
    });

    it("should insert at 0 if nextPt not set", () => {
      const board2: Board = structuredClone(board);
      board2.zones.main.nextPt = undefined;
      const newBoard = Zone.addShiftId(board2, "five", "main");
      expect(newBoard.zones.main.shifts[0]).toBe("five");
    });
  });
});
