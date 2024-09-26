import ShortUniqueId from "short-unique-id";
const uid = new ShortUniqueId({ length: 6 });

export class Shift implements Shift {
  id: string = uid.rnd();
  name: string;
  provider: string;
  bonus: number;
  role: string;
  patients: number;
  supervised: number;
  bounty: number;

  constructor(options: StateShift) {
    this.name = options.name;
    this.provider = options.provider;
    this.bonus = options.bonus;
    this.role = options.role;
    this.patients = options.patients ?? 0;
    this.supervised = options.supervised ?? 0;
    this.bounty = options.bounty ?? 0;
  }

  adjustCount(whichCount: "patient" | "supervise" | "bounty", howMuch: number): Shift {
    this[whichCount] += howMuch;
    return this;
  }
}

export class ShiftGarage {
  public shifts: Shift[];

  constructor(shifts: StateShift[]) {
    this.shifts = shifts.map((shift) => new Shift(shift));
  }

  find(id: StateShiftId): Shift | null {
    const shift = this.shifts.find((shift) => shift.id === id);
    return shift ?? null;
  }
}
