import { describe, expect, it } from "vitest";
import Shift from "../src/shift";
import board from "../sampleboard";

describe("# Shift Tests", () => {
  describe("make()", () => {
    it("should make shifts from providers and schedules", () => {
      const provider = { last: "Julius", first: "Doctor" };
      const schedule = {
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

  describe("addToBoard()", () => {
    it("should add new shifts to the board and return shiftId", () => {
      const clone = structuredClone(board);
      const shiftId = Shift.addToBoard(
        clone,
        { last: "Irving", first: "Julius" },
        { name: "Dunkmaster Shift", bonus: 0, joinZones: ["main", "off"], role: "physician" }
      );
      expect(clone.shifts[shiftId].provider.last).toBe("Irving");
    });
  });

  describe("addPatient()", () => {
    it("should add patient to shift", () => {
      const shift = board.shifts.one;
      const newShift = Shift.addPatient(shift, { mode: "walkin", room: "1" });
      expect(newShift.counts.walkin).toBe(2);
    });
  });

  describe("removePatient()", () => {
    it("should remove patient from shift", () => {
      const shift = board.shifts.one;
      const newShift = Shift.removePatient(shift, { mode: "walkin", room: "1" });
      expect(newShift.counts.walkin).toBe(1);
    });
  });

  describe("addSupervisor()", () => {
    it("should add supervisor to shift", () => {
      const shift = board.shifts.one;
      const newShift = Shift.addSupervisor(shift);
      expect(newShift.counts.supervisor).toBe(2);
    });
  });

  describe("removeSupervisor()", () => {
    it("should remove supervisor from shift", () => {
      const shift = board.shifts.one;
      const newShift = Shift.removeSupervisor(shift);
      expect(newShift.counts.supervisor).toBe(1);
    });
  });

  describe("startTurn()", () => {
    it("should return true if shift is active", () => {
      const shift = board.shifts.one;
      const result = Shift.startTurn(shift);
      expect(result.turnOver).toBe(false);
    });

    it("should return false if shift is inactive", () => {
      const shift = board.shifts.one;
      shift.skip = 1;
      const result = Shift.startTurn(shift);
      expect(result.turnOver).toBe(true);
    });
  });

  describe("addPatientOnTurn()", () => {
    it("should return true if shift is still in bonus", () => {
      const shift = board.shifts.one;
      const result = Shift.addPatientOnTurn(shift, { mode: "walkin", room: "1" });
      expect(result.turnOver).toBe(false);
    });

    it("should return false if shift is out of bonus", () => {
      const shift = board.shifts.one;
      shift.bonus = 0;
      const result = Shift.addPatientOnTurn(shift, { mode: "walkin", room: "1" });
      expect(result.turnOver).toBe(true);
    });
  });
});
