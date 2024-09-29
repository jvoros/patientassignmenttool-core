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

const add = (draft: Board, provider: Provider, schedule: ScheduleItem): ShiftId => {
  const shift = make(provider, schedule);
  draft.shifts[shift.id] = shift;
  return shift.id;
};

const adjustCount = (
  draft: Board,
  params: { shiftId: ShiftId; whichCount: string; howMuch: number }
): Board => {
  const counts = draft.shifts[params.shiftId].counts;
  const newCount = counts[params.whichCount] + params.howMuch;
  counts[params.whichCount] = newCount > 0 ? newCount : 0;
  return draft;
};
export default {
  make,
  adjustCount,
};
