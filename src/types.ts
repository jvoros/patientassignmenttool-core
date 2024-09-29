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
  timeline: BoardEventId[];
  events: {
    [id: BoardEventId]: BoardEvent;
  };
};

// ZONES

// ZONE TYPES
// zone: just a list of shifts
// zone_patient: list of shifts, first shift always up next
// rotation: adds at up next index, can move who is up next
// rotation_super: rotation, but also has supervisor
// any zone can get a supervisor from another zone

type ZoneType = "zone" | "zone_patient" | "rotation" | "rotation_super";

type ZoneId = Zone["id"];

type Zone = {
  id: string;
  name: string;
  type: string;
  superFrom?: ZoneId;
  active: {
    patient: ShiftId | null;
    staff: ShiftId | null;
  };
  shifts: ShiftId[];
};

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

type BoardEventId = BoardEvent["id"];

type BoardEvent = {
  id: string;
  type: string;
  inversePatches: any[];
  message?: string;
  detail?: string;
  patient?: { room: string; mode: string };
  shift?: ShiftId;
  supervisorShift?: ShiftId;
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
