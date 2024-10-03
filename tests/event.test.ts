import { describe, expect, it } from "vitest";
import Event from "../src/event";
import board from "../sampleboard";

const options = {
  type: "assign",
  mode: "walkin",
  room: "Tr A",
  provider: "Brian Kasavana",
  supervisor: "Jeremy Voros",
};

const testEvent = Event.make(options);

const testPatches = [{ name: "Jeremy" }, { instrument: "Banjo" }];

describe("# Event Tests", () => {
  describe("make()", () => {
    it("should make BoardEvents", () => {
      expect(Object.keys(testEvent).length).toBe(8);
    });
  });

  describe("add()", () => {
    it("should make new event and add to the board and timeline and limit to EVENT_LIMIT", () => {
      const clone = structuredClone(board);
      const id = Event.add(clone, options);
      expect(clone.timeline[0]).toBe(id);
      expect(clone.timeline.length).toBe(3);
      expect(Object.keys(clone.events).length).toBe(3);
    });
  });

  describe("addReassign()", () => {
    it("should reassign to new shift", () => {
      const clone = structuredClone(board);
      Event.addReassign(clone, "one", "three");
      expect(clone.events.one.shift).toBe("three");
    });
  });

  describe("addPatches()", () => {
    it("should add patches to most recent event", () => {
      const clone = structuredClone(board);
      const id = Event.add(clone, options);
      Event.addPatches(clone, id, testPatches);
      expect(clone.events[id].inversePatches.length).toBe(2);
    });
  });

  describe.todo("undo", () => {});
});
