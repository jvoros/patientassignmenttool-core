import { describe, expect, it } from "vitest";
import Shift from "../src/shift";
import board from "./testboard";

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

  describe("adjustCount()", () => {
    it("should adjust counts, but not below 0", () => {
      const newBoard = Shift.adjustCount(board, {
        shiftId: "one",
        whichCount: "walkin",
        howMuch: 1,
      });
      expect(newBoard.shifts.one.counts.walkin).toBe(2);
      const newBoard2 = Shift.adjustCount(board, {
        shiftId: "one",
        whichCount: "walkin",
        howMuch: -2,
      });
      expect(newBoard2.shifts.one.counts.walkin).toBe(0);
    });
  });
});
