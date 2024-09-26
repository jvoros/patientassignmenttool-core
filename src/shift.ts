import { produce } from "immer";
import ShortUniqueId from "short-unique-id";
const uid = new ShortUniqueId({ length: 6 });

const make = (provider: Provider, schedule: ScheduleItem): Shift => {
  return {
    id: uid.rnd(),
    name: schedule.name,
    bonus: schedule.bonus,
    role: schedule.role,
    provider,
    counts: {},
  };
};

const adjustCount = produce(
  (draft, params: { shiftId: ShiftId; whichCount: string; howMuch: number }) => {
    const counts = draft.shifts[params.shiftId].counts;
    const newCount = counts[params.whichCount] + params.howMuch;
    counts[params.whichCount] = newCount > 0 ? newCount : 0;
  }
);

export default {
  make,
  adjustCount,
};
