import Shift from "./shift.js";
import Zone from "./zone.js";
import Undo from "./undo.js";

// ASSIGN
type AssignToShift = (draft: Board, zoneId: ZoneId, shiftId: ShiftId, patient: Patient) => Board;
const assignToShift = Undo.produce(
  (draft: Board, zoneId: ZoneId, shiftId: ShiftId, patient: Patient) => {
    const shift = draft.shifts[shiftId];
    Shift.addPatient(shift, patient);
    const supervisorId = assignSupervisorIfNeeded(draft, zoneId, shift.role);
    return createAssignEventParams(shift, supervisorId, patient);
  }
) as AssignToShift;

const createAssignEventParams = (
  shift: Shift,
  superShiftId: ShiftId | undefined,
  patient: Patient
): EventMakeParams => {
  const { last, first } = shift.provider;
  return {
    type: "assign",
    shift: shift.id,
    supervisorShift: superShiftId,
    patient,
    message: `Room ${patient.room} assigned to ${first} ${last}`,
  };
};

const assignSupervisorIfNeeded = (
  draft: Board,
  zoneId: ZoneId,
  role: string
): ShiftId | undefined => {
  if (role !== "physician") {
    const zone = draft.zones[zoneId];
    const { superZoneId, superShiftId } = getSuperZoneAndShift(draft, zone);
    Shift.addSupervisor(draft.shifts[superShiftId]);
    Zone.advanceRotation(draft, superZoneId, "supervisor");
    return superShiftId;
  }
  return undefined;
};

const getSuperZoneAndShift = (
  draft: Board,
  zone: Zone
): { superZoneId: ZoneId; superShiftId: ShiftId } => {
  if (!zone.superFrom && !zone.active.supervisor) {
    throw new Error(
      `Assign Error: zoneId [${zone.id}] has no 'superFrom:' property and no active.supervisor is set.`
    );
  }
  // use ! non-null assertion because already checked at least one exists
  const superShiftId = zone.superFrom
    ? draft.zones[zone.superFrom].active.supervisor!
    : zone.active.supervisor!;
  const superZoneId = zone.superFrom ?? zone.id;
  return { superShiftId, superZoneId };
};

// ASSIGN TO ZONE
type AssignToZone = (draft: Board, zoneId: ZoneId, patient: Patient) => Board;

const assignToZone = Undo.produce((draft, zoneId, patient) => {
  const zone = draft.zones[zoneId];
  const shift = getActiveShift(draft, zoneId);
  const { turnOver } = Shift.addPatientOnTurn(shift, patient);
  if (turnOver) {
    handleTurnOver(draft, zoneId);
  }
  handleTriggerSkip(zone, shift);
  const supervisorId = assignSupervisorIfNeeded(draft, zoneId, shift.role);
  return createAssignEventParams(shift, supervisorId, patient);
}) as AssignToZone;

const getActiveShift = (draft: Board, zoneId: ZoneId): Shift => {
  const zone = draft.zones[zoneId];
  const shiftId = zone.type.includes("rotation") ? zone.active.patient : zone.shifts[0];
  if (!shiftId) {
    throw new Error(`No shift in zone or active.patient for zone [${zoneId}]`);
  }
  return draft.shifts[shiftId];
};

const handleTurnOver = (draft: Board, zoneId: ZoneId): void => {
  Zone.advanceRotation(draft, zoneId, "patient");
};

const handleTriggerSkip = (zone: Zone, shift: Shift): void => {
  if (zone.triggerSkip && zone.triggerSkip.includes(shift.role)) {
    Shift.skipNextTurn(shift);
  }
};

// REASSIGN
type ReassignPatient = (draft: Board, eventId: BoardEventId, newShiftId: ShiftId) => Board;
const reassignPatient = Undo.produce((draft: Board, eventId: BoardEventId, newShiftId: ShiftId) => {
  const event = draft.events[eventId];
  validateEvent(event);

  const newShift = draft.shifts[newShiftId];
  Shift.addPatient(newShift, event.patient!);
  const shift = draft.shifts[event.shift!];
  Shift.removePatient(shift, event.patient!);

  updateEventTypeAndMessage(event, newShift);
  const supervisorShift = handleSupervisorOnReassign(newShift, shift, event);

  return createAssignEventParams(newShift, supervisorShift, event.patient!);
}) as ReassignPatient;

function validateEvent(event: BoardEvent) {
  if (!event.patient) {
    throw new Error(`Event [${event.id}] has no patient property.`);
  }
  if (!event.shift) {
    throw new Error(`Event [${event.id}] has no shift property.`);
  }
}

const updateEventTypeAndMessage = (event: BoardEvent, newShift: Shift) => {
  const newProvider = newShift.provider;
  event.type = "reassign";
  event.message = `Reassigned to: ${newProvider.first} ${newProvider.last}`;
};

const handleSupervisorOnReassign = (newShift: Shift, shift: Shift, event: BoardEvent) => {
  if (newShift.role !== "physician" && shift.role === "physician") {
    Shift.addSupervisor(shift);
    return shift.id;
  }
  if (newShift.role !== "physician" && shift.role !== "physician") {
    return event.supervisorShift;
  }
  return undefined;
};

export default {
  assignToShift,
  assignToZone,
  reassignPatient,
};
