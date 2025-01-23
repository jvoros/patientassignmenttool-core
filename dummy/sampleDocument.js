import board from "./sampleboard.js";

export default {
  site: "stmarks",
  details: {
    name: "St. Mark's Hospital",
    providers: [
      { last: "Voros", first: "Jeremy", role: "physician" },
      { last: "Blake", first: "Kelly", role: "physician" },
      { last: "Cheever", first: "Shelley", role: "app" },
    ],
    schedule: [
      { name: "6a - 3p", bonus: 2, joinZones: ["main"], role: "physician" },
      { name: "6a - 3p APP", bonus: 0, joinZones: ["main", "fasttrack"], role: "app" },
      { name: "8a - 5p", bonus: 2, joinZones: ["main"], role: "physician" },
    ],
    zones: [
      { id: "main", order: 10, name: "Main", type: "rotation_super" },
      { id: "fasttrack", order: 20, name: "Fast Track", type: "zone_patient", superFrom: "main" },
      { id: "off", order: 0, name: "Off Service", type: "zone" },
    ],
  },
  board: board,
};
