// SITE

type Provider = {
  last: string;
  first: string;
};

type Role = "physician" | "app" | "resident";

type ScheduleItem = {
  name: string;
  role: Role;
  bonus: number;
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
  event: BoardEvent[];
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
  type: ZoneType;
  nextPt?: ShiftId;
  nextSuper?: ShiftId;
  superFrom?: ZoneId;
  shifts: ShiftId[];
};

type ZoneId = Zone["id"];

// SHIFTS

type Shift = {
  id: string;
  name: string;
  provider: Provider;
  patients: number;
  supervised: number;
  bounty?: number;
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
