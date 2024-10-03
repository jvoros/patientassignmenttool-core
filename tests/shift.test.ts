import { describe, expect, it } from "vitest";
import Shift from "../src/shift";
import board from "../sampleboard";

describe("# Shift Tests", () => {
  describe("make()", () => {
    it("should make shifts from providers and schedules", () => {
      const provider: Provider = { last: "Julius", first: "Doctor" };
      const schedule: ScheduleItem = {
        name: "all night baby",
        bonus: 99,
        role: "physician",
        joinZones: ["main"],
      };
      const shift = Shift.make(provider, schedule);
      expect(shift.id.length).toBe(6);
      expect(shift.provider.first).toBe("Doctor");
      expect(shift.bonus).toBe(99);
    });
  });

  describe("add()", () => {
    it("should add new shifts to the board and return shiftId", () => {
      const clone = structuredClone(board);
      const shiftId = Shift.add(
        clone,
        { last: "Irving", first: "Julius" },
        { name: "Dunkmaster Shift", bonus: 0, joinZones: ["main", "off"], role: "physician" }
      );
      expect(clone.shifts[shiftId].provider.last).toBe("Irving");
    });
  });

  describe("adjustCount()", () => {
    it("should adjust counts, but not below 0", () => {
      const clone = structuredClone(board);
      Shift.adjustCount(clone, "one", "walkin", 1);
      expect(clone.shifts.one.counts.walkin).toBe(2);
      Shift.adjustCount(clone, "one", "walkin", -2);
      expect(clone.shifts.one.counts.walkin).toBe(0);
    });
  });
});
