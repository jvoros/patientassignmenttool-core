import ShortUniqueId from "short-unique-id";
const uid = new ShortUniqueId({ length: 6 });
const make = (provider, schedule) => {
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
const addToBoard = (draft, provider, schedule) => {
    const shift = make(provider, schedule);
    draft.shifts[shift.id] = shift;
    return shift.id;
};
const addPatient = (shift, patient) => {
    return adjustCount(shift, patient.mode, 1);
};
const removePatient = (shift, patient) => {
    return adjustCount(shift, patient.mode, -1);
};
const addSupervisor = (shift) => {
    return adjustCount(shift, "supervisor", 1);
};
const removeSupervisor = (shift) => {
    return adjustCount(shift, "supervisor", -1);
};
const startTurn = (shift) => {
    if (shift.skip > 0) {
        shift.skip -= 1;
        return { stillActive: false };
    }
    return { stillActive: true };
};
const addPatientOnTurn = (shift, patient) => {
    addPatient(shift, patient);
    if (shift.bonus === 0) {
        return { stillActive: false };
    }
    shift.bonus -= 1;
    return { stillActive: true };
};
const adjustCount = (shift, whichCount, howMuch) => {
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
};
