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
// triggerSkip: array of roles that trigger skip
//    if triggerSkip is 'app' then assignment in this zone will
//    trigger a skip in any other rotation zone that shift is also in

type ZoneType = "zone" | "zone_patient" | "rotation" | "rotation_super";

type ZoneId = Zone["id"];

type Zone = {
  id: string;
  name: string;
  type: string;
  superFrom?: ZoneId;
  triggerSkip?: string[]; // type Role,
  active: {
    patient: ShiftId | undefined;
    supervisor: ShiftId | undefined;
  };
  shifts: ShiftId[];
};

type ActiveKey = "patient" | "supervisor";

// SHIFTS

type Shift = {
  id: string;
  name: string;
  role: string;
  bonus: number;
  skip: number;
  provider: Provider;
  counts: {
    [ptType: string]: number;
  };
};

type ShiftId = Shift["id"];

// EVENTS

type Patient = {
  room: string;
  mode: string;
};

type mode = "walkin" | "ft" | "ambo" | "police";

type BoardEventId = BoardEvent["id"];

type BoardEvent = {
  id: string;
  time: string;
  type: string;
  inversePatches: any[];
  message?: string;
  detail?: string;
  patient?: Patient;
  shift?: ShiftId;
  supervisorShift?: ShiftId;
};

type EventMakeParams = {
  type: string;
  message?: string;
  detail?: string;
  patient?: { room: string; mode: string } | undefined;
  shift?: ShiftId | undefined;
  supervisorShift?: ShiftId | undefined;
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

// UNDO

type RecipeWithEvent = (draft: Board, ...args: any[]) => EventMakeParams;
