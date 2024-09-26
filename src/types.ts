// SITE

type Provider = {
  last: string;
  first: string;
};

type Role = "physician" | "app" | "resident";

type ScheduleItem = {
  name: string;
  role: string;
  bonus: number;
  joinZones: ZoneId[];
};

type Site = {
  id: string;
  event_limit: number;
  providers: Provider[];
  schedule: ScheduleItem[];
};

// BOARD

type Board = {
  date: string;
  // object with any number of zones
  // each as an object property
  zones: {
    [id: ZoneId]: Zone;
  };
  shifts: {
    [id: ShiftId]: Shift;
  };
  events: BoardEvent[];
};

// ZONES

// ZONE TYPES
// list: just a list of shifts
// simple: list of shifts, first shift always up next
// rotation: adds at up next index, can move who is up next
// supervisor: rotation, but also has nextSupervisor
// any zone can get a supervisor from another zone

type ZoneType = "list" | "simple" | "rotation" | "supervisor";

type Zone = {
  id: string;
  name: string;
  type: string;
  nextPt?: ShiftId | undefined;
  nextSuper?: ShiftId | undefined;
  superFrom?: ZoneId | undefined;
  shifts: ShiftId[];
};

type ZoneId = Zone["id"];

// SHIFTS

type Shift = {
  id: string;
  name: string;
  role: string;
  bonus: number;
  provider: Provider;
  counts: {
    [ptType: string]: number;
  };
};

type ShiftId = Shift["id"];

// EVENTS

type BoardEvent = {
  type: string;
  inversePatches: any[];
  room?: string;
  mode?: string;
  provider?: string;
  supervisor?: string;
};

// LOG

type LogItem = {
  date: string;
  site: string;
  shift: string;
  provider: string;
  patients: number;
  supervised: number;
  bounty?: number;
};
