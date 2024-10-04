import ShortUniqueId from "short-unique-id";
const uid = new ShortUniqueId({ length: 6 });

type TurnOver = { turnOver: boolean };

const make = (provider: Provider, schedule: ScheduleItem): Shift => {
  return {
    id: uid.rnd(),
    name: schedule.name,
    bonus: schedule.bonus,
    skip: 0,
    role: schedule.role,
    provider,
    counts: {},
  };
};

const addToBoard = (draft: Board, provider: Provider, schedule: ScheduleItem): ShiftId => {
  const shift = make(provider, schedule);
  draft.shifts[shift.id] = shift;
  return shift.id;
};

const addPatient = (shift: Shift, patient: Patient): Shift => {
  return adjustCount(shift, patient.mode, 1);
};

const removePatient = (shift: Shift, patient: Patient): Shift => {
  return adjustCount(shift, patient.mode, -1);
};

const addSupervisor = (shift: Shift): Shift => {
  return adjustCount(shift, "supervisor", 1);
};

const removeSupervisor = (shift: Shift): Shift => {
  return adjustCount(shift, "supervisor", -1);
};

const startTurn = (shift: Shift): TurnOver => {
  if (shift.skip > 0) {
    shift.skip -= 1;
    return { turnOver: true };
  }
  return { turnOver: false };
};

const endTurn = (shift: Shift): TurnOver => {
  if (shift.bonus > 0) {
    shift.bonus -= 1;
    return { turnOver: false };
  }
  return { turnOver: true };
};

const addPatientOnTurn = (shift: Shift, patient: Patient): TurnOver => {
  addPatient(shift, patient);
  return endTurn(shift);
};

const skipNextTurn = (shift: Shift): void => {
  const shiftAlreadySkipped = shift.skip > 0; // only skip one turn at a time
  shift.skip = shiftAlreadySkipped ? shift.skip : 1;
};

const pauseTurn = (shift: Shift): void => {
  const numberOfTurnsSoBigItWillNeverBeReached = 100;
  shift.skip = numberOfTurnsSoBigItWillNeverBeReached;
};

const resumeTurn = (shift: Shift): void => {
  shift.skip = 0;
};

// HELPERS

const adjustCount = (shift: Shift, whichCount: string, howMuch: number): Shift => {
  const counts = shift.counts;
  const currentCount = counts[whichCount] ?? 0;
  const newCount = currentCount + howMuch;
  counts[whichCount] = newCount > 0 ? newCount : 0;
  return shift;
};

export default {
  make,
  addToBoard,
  addPatient,
  addPatientOnTurn,
  removePatient,
  addSupervisor,
  removeSupervisor,
  startTurn,
  skipNextTurn,
  pauseTurn,
  resumeTurn,
};
