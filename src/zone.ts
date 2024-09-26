import { produce } from "immer";

const make = (zoneParams: { id: string; name: string; type: string; superFrom: ZoneId }): Zone => {
  const zone: Zone = { ...zoneParams, shifts: [] };
  switch (zoneParams.type) {
    case "rotation":
      zone.nextPt = "";
      return zone;
    case "supervisor":
      zone.nextPt = "";
      zone.nextSuper = "";
      return zone;
    default: // list and simple types
      return zone;
  }
};

const addShiftId = produce((draft, shiftId: ShiftId, zoneId: ZoneId) => {
  const zone: Zone = draft.zones[zoneId];
  const zoneNotEmpty = zone.shifts.length > 0;
  let insertIndex = 0;

  if (["supervisor", "rotation"].includes(zone.type)) {
    zone.nextPt = zone.nextPt ?? shiftId;
    const newIndex = findIndex(zone, zone.nextPt);
    insertIndex = newIndex > 0 ? newIndex : 0;
  }

  if (zone.type === "supervisor") {
    zone.nextSuper = zone.nextSuper ?? shiftId;
  }

  zone.shifts.splice(insertIndex, 0, shiftId);
});

// HELPERS
// these don't use Immer, pass in drafted zone
const findIndex = (zone: Zone, shiftId: ShiftId): number => {
  return zone.shifts.findIndex((id) => id === shiftId);
};

export default {
  make,
  addShiftId,
};
