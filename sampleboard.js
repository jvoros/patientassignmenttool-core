export default {
  date: "09/25/2004",

  zones: {
    off: {
      id: "off",
      name: "Off",
      type: "list",
      active: { patient: null, staff: null },
      shifts: ["four"],
    },
    main: {
      id: "main",
      name: "Main",
      type: "rotation_super",
      active: {
        patient: "one",
        staff: "one",
      },
      shifts: ["two", "one"],
    },
    fasttrack: {
      id: "fasttrack",
      name: "Fast Track",
      type: "simple",
      superFrom: "main", // id of rotation that provides supervisor
      active: { patient: null, staff: null },
      shifts: ["three"],
    },
  },

  shifts: {
    one: {
      id: "one",
      name: "6a-3p",
      role: "physician",
      bonus: 2,
      provider: {
        last: "Voros",
        first: "Jeremy",
      },
      counts: {
        walkin: 1,
        ambo: 1,
        ft: 1,
        supervised: 1,
        bounty: 1,
      },
    },
    two: {
      id: "two",
      name: "8a-6p",
      role: "physician",
      bonus: 2,
      provider: {
        last: "Blake",
        first: "Kelly",
      },
      counts: {},
    },
    three: {
      id: "three",
      name: "6a-3p APP",
      role: "app",
      bonus: 0,
      provider: {
        last: "Cheever",
        first: "Shelley",
      },
      counts: {},
    },
    four: {
      id: "three",
      name: "3p-11p APP",
      role: "app",
      bonus: 0,
      provider: {
        last: "Kasavana",
        first: "Brian",
      },
      counts: {},
    },
    five: {
      id: "five",
      name: "11a-9p",
      role: "physician",
      bonus: 2,
      provider: {
        last: "Hart",
        first: "Mike",
      },
      counts: {},
    },
  },

  timeline: ["three", "two", "one"],

  events: {
    one: {
      id: "one",
      type: "assign",
      patient: { room: "Tr A", mode: "ambulance" },
      shift: "three",
      supervisorShift: "two",
      inversePatches: ["immer inversePatches go here"],
    },
    two: {
      id: "two",
      type: "move",
      message: "Jeremy Voros changed position.",
      shift: "one",
      inversePatches: ["immer inversePatches go here"],
    },
    three: {
      id: "three",
      type: "assign",
      patient: { room: "4", mode: "ambulance" },
      shift: "one",
      inversePatches: ["immer inversePatches go here"],
    },
  },
};
