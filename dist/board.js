import Shift from "./shift";
import Zone from "./zone";
import Undo from "./undo";
import Assign from "./assign";
// RESET
const reset = Undo.produce((draft) => {
    for (const zoneId in draft.zones) {
        draft.zones[zoneId] = {
            ...draft.zones[zoneId],
            active: { patient: undefined, supervisor: undefined },
            shifts: [],
        };
    }
    draft.shifts = {};
    draft.timeline = [];
    draft.events = {};
    // event
    const eventParams = { type: "reset", message: "Board Reset" };
    return eventParams;
});
const signIn = Undo.produce((draft, provider, schedule) => {
    const shiftId = Shift.addToBoard(draft, provider, schedule);
    schedule.joinZones.forEach((zone) => {
        Zone.join(draft, zone, shiftId);
    });
    // event
    const eventParams = {
        type: "signIn",
        shift: shiftId,
        message: `${provider.first} ${provider.last} signed in.`,
    };
    return eventParams;
});
const signOut = Undo.produce((draft, shiftId) => {
    const inZone = Object.keys(draft.zones).filter((zoneId) => draft.zones[zoneId].shifts.includes(shiftId) && zoneId !== "off");
    inZone.forEach((zoneId) => {
        Zone.leave(draft, zoneId, shiftId);
    });
    Zone.join(draft, "off", shiftId);
    // event
    const { first, last } = draft.shifts[shiftId].provider;
    const eventParams = {
        type: "signOut",
        shift: shiftId,
        message: `${first} ${last} signed out.`,
    };
    return eventParams;
});
const joinZone = Undo.produce((draft, zoneId, shiftId) => {
    const zone = draft.zones[zoneId];
    const { last, first } = draft.shifts[shiftId].provider;
    Zone.join(draft, zoneId, shiftId);
    // event
    const eventParams = {
        type: "join",
        shift: shiftId,
        message: `${first} ${last} joined ${zone.name}.`,
    };
    return eventParams;
});
const leaveZone = Undo.produce((draft, zoneId, shiftId) => {
    const zone = draft.zones[zoneId];
    const { last, first } = draft.shifts[shiftId].provider;
    Zone.leave(draft, zoneId, shiftId);
    // event
    const eventParams = {
        type: "leave",
        shift: shiftId,
        message: `${first} ${last} left ${zone.name}.`,
    };
    return eventParams;
});
const switchZone = Undo.produce((draft, leaveZoneId, joinZoneId, shiftId) => {
    const leaveZone = draft.zones[leaveZoneId];
    const joinZone = draft.zones[joinZoneId];
    const { last, first } = draft.shifts[shiftId].provider;
    Zone.leave(draft, leaveZoneId, shiftId);
    Zone.join(draft, joinZoneId, shiftId);
    // event
    const eventParams = {
        type: "switched",
        shift: shiftId,
        message: `${first} ${last} left ${leaveZone.name} to join ${joinZone.name}.`,
    };
    return eventParams;
});
const advanceRotation = Undo.produce((draft, zoneId, whichActive, direction) => {
    Zone.advanceRotation(draft, zoneId, whichActive, direction);
    // event
    const dir = direction === 1 ? "forward to" : "back to";
    const active = getActiveMessage(whichActive);
    const affectedShiftId = draft.zones[zoneId].active[whichActive];
    const { last, first } = draft.shifts[affectedShiftId].provider;
    const eventParams = {
        type: "advanceRotation",
        message: `${active} moved ${dir} ${first} ${last}.`,
    };
    return eventParams;
});
const getActiveMessage = (whichActive) => {
    return whichActive === "supervisor"
        ? "Supervisor"
        : whichActive === "patient"
            ? "Next Patient"
            : whichActive;
};
const changePosition = Undo.produce((draft, zoneId, shiftId, dir) => {
    Zone.adjustOrder(draft, zoneId, shiftId, dir);
    // event
    const direction = dir === 1 ? "up" : "back";
    const zoneName = draft.zones[zoneId].name;
    const { last, first } = draft.shifts[shiftId].provider;
    const eventParams = {
        type: "changePosition",
        shift: shiftId,
        message: `${first} ${last} moved ${direction} in ${zoneName}`,
    };
    return eventParams;
});
export default {
    reset,
    undo: Undo.undo,
    signIn,
    signOut,
    joinZone,
    leaveZone,
    switchZone,
    advanceRotation,
    changePosition,
    assignToShift: Assign.assignToShift,
    assignToZone: Assign.assignToZone,
    reassignPatient: Assign.reassignPatient,
};