import Shift from "./shift";
import Zone from "./zone";
import Undo from "./undo";
// need unwrapped version to reuse in assignToZone
const assignToShiftRecipe = (draft, zoneId, shiftId, patient) => {
    const shift = draft.shifts[shiftId];
    Shift.adjustCount(draft, shiftId, patient.mode, 1);
    const supervisorId = assignSupervisorIfNeeded(draft, zoneId, shift.role);
    // event
    const { last, first } = shift.provider;
    const eventParams = {
        type: "assign",
        shift: shift.id,
        supervisorShift: supervisorId ?? undefined,
        patient,
        message: `Room ${patient.room} assigned to ${first} ${last}`,
    };
    return eventParams;
};
const assignToShift = Undo.produce(assignToShiftRecipe);
const assignSupervisorIfNeeded = (draft, zoneId, role) => {
    if (role !== "physician") {
        const zone = draft.zones[zoneId];
        const { superZoneId, superShiftId } = getSuperZoneAndShift(draft, zone);
        Shift.adjustCount(draft, superShiftId, "supervisor", 1);
        Zone.moveActive(draft, superZoneId, "supervisor");
        return superShiftId;
    }
    return undefined;
};
const getSuperZoneAndShift = (draft, zone) => {
    if (!zone.superFrom && !zone.active.supervisor) {
        throw new Error(`Assign Error: zoneId ${zone.id} has no 'superFrom:' property and no active.supervisor is set.`);
    }
    // use ! non-null assertion because already checked at least one exists
    const superShiftId = zone.superFrom
        ? draft.zones[zone.superFrom].active.supervisor
        : zone.active.supervisor;
    const superZoneId = zone.superFrom ?? zone.id;
    return { superShiftId, superZoneId };
};
const assignToZone = Undo.produce((draft, zoneId, patient) => {
    const shift = getActiveShift(draft, zoneId);
    const eventParams = assignToShiftRecipe(draft, zoneId, shift.id, patient);
    advanceRotationIfNeeded(draft, zoneId, shift);
    return eventParams;
});
const getActiveShift = (draft, zoneId) => {
    const zone = draft.zones[zoneId];
    const shiftId = zone.type.includes("rotation") ? zone.active.patient : zone.shifts[0];
    if (!shiftId) {
        throw new Error(`No shift in zone or active.patient for zone ${zoneId}`);
    }
    return draft.shifts[shiftId];
};
// may need to expand with bounty
const advanceRotationIfNeeded = (draft, zoneId, shift) => {
    const total = Object.keys(shift.counts).reduce((acc, key) => {
        return key === "supervisor" ? acc : acc + shift.counts[key];
    }, 0);
    if (total > shift.bonus) {
        Zone.moveActive(draft, zoneId, "patient");
    }
};
const reassignPatient = Undo.produce((draft, eventId, newShiftId) => {
    const event = draft.events[eventId];
    validateEvent(event);
    const newShift = draft.shifts[newShiftId];
    Shift.adjustCount(draft, newShiftId, event.patient?.mode, 1);
    const shift = draft.shifts[event.shift];
    Shift.adjustCount(draft, shift.id, event.patient?.mode, -1);
    updateEventTypeAndMessage(event, newShift);
    const supervisorShift = handleSupervisorOnReassign(draft, newShift, shift, event);
    return createEventParams(event, newShift, supervisorShift);
});
function validateEvent(event) {
    if (!event.patient) {
        throw new Error(`Error: event: ${event.id} has no patient property.`);
    }
    if (!event.shift) {
        throw new Error(`Error: event: ${event.id} has no shift property.`);
    }
}
const updateEventTypeAndMessage = (event, newShift) => {
    const newProvider = newShift.provider;
    event.type = "reassign";
    event.message = `Reassigned to: ${newProvider.first} ${newProvider.last}`;
};
const handleSupervisorOnReassign = (draft, newShift, shift, event) => {
    if (newShift.role !== "physician" && shift.role === "physician") {
        Shift.adjustCount(draft, shift.id, "supervisor", 1);
        return shift.id;
    }
    if (newShift.role !== "physician" && shift.role !== "physician") {
        return event.supervisorShift;
    }
    return null;
};
const createEventParams = (event, newShift, supervisorShift) => {
    const newProvider = newShift.provider;
    return {
        type: "assign",
        shift: newShift.id,
        supervisorShift,
        patient: event.patient,
        message: `Room ${event.patient.room} assigned to ${newProvider.first} ${newProvider.last}`,
    };
};
export default {
    assignToShift,
    assignToZone,
    reassignPatient,
};
