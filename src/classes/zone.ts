import { Shift, ShiftGarage } from "./shift";
import ErroniousMonk from "./error";

//  ZONE
//  Zone is just a list of shifts, adds at the end

export class Zone {
  public id: string;
  public name: string;
  public type: string;
  public shifts: StateShiftId[];

  public constructor(options: StateZone) {
    this.id = options.id;
    this.name = options.name;
    this.type = options.type;
    this.shifts = options.shifts;
  }

  join(shift: Shift): Zone {
    this.shifts.push(shift.id);
    return this;
  }

  leave(shiftId: StateShiftId): Zone {
    const index = this.findShiftIndex(shiftId);
    const removedId = this.shifts.splice(index, 1)[0];
    return this;
  }

  // HELPERS
  protected findShiftIndex(shiftId: StateShiftId): number {
    return this.shifts.findIndex((id) => id === shiftId);
  }
}

// ZONE WITH PATIENTS
// ZoneWithPatients has a nextPt but always returns first shift.
// Still just puts shifts in a list, adding at the end.
// Like current FastTrack behavior

export class ZoneWithPatients extends Zone {
  constructor(options: StateZone) {
    super(options);
  }

  get nextPt(): StateShiftId | undefined {
    return this.shifts[0];
  }

  join(shift: Shift): ZoneWithPatients {
    this.shifts.push(shift.id);
    return this;
  }

  leave(shiftId: StateShiftId): ZoneWithPatients {
    const index = this.findShiftIndex(shiftId);
    if (index === -1) {
      return this;
    }
    const removedId = this.shifts.splice(index, 1)[0];
    return this;
  }
}

// ROTATION
// List of shifts but joins at nextPt slot as next up.

export class Rotation extends ZoneWithPatients {
  public _nextPt: StateShiftId | undefined;

  constructor(options: StateZone) {
    super(options);
    this._nextPt = options.nextPt;
  }

  get nextPt() {
    return this._nextPt;
  }

  join(shift: Shift): Rotation {
    if (!this.nextPt) {
      this._nextPt = shift.id;
      this.shifts.splice(0, 0, shift.id);
      return this;
    }
    const index = this.findShiftIndex(this.nextPt);
    if (index === -1) {
      const msg = `Zone ${this.name} does not contain the shiftId set for nextPt: ${this.nextPt}`;
      ErroniousMonk.log(msg);
      this._nextPt = undefined; // unset the incorrect pointer
      return this.join(shift); // rerun
    }
    this.shifts.splice(index, 0, shift.id);
    this._nextPt = shift.id;
    return this;
  }

  getNext(shiftId: StateShiftId, offset: number = 1): StateShiftId | undefined {
    const currentIndex = this.findShiftIndex(shiftId);
    if (currentIndex < 0) {
      ErroniousMonk.log(`Zone ${this.name} doesn't contain shift ${shiftId}`);
      return;
    }
    const length = this.shifts.length;
    const nextIndex = (currentIndex + offset + length) % length;
    return this.shifts[nextIndex];
  }

  moveNext(offset: number = 1): ZoneWithPatients {
    if (!this._nextPt) {
      ErroniousMonk.log(`Zone ${this.name} has no next shift set`);
      return this;
    }
    this._nextPt = this.getNext(this._nextPt, offset);
    return this;
  }
}

// ROTATION WITH SUPERVISOR
// Rotation with nextSupervisor added
// Supervisor can come from this rotation or another

export class RotationWithSupervisor extends Rotation {
  public _nextSuper: StateShiftId | undefined;
  public superFrom: Zone["id"];
  public garage: ShiftGarage;

  constructor(options: StateZone) {
    super(options);
    this._nextSuper = options.nextSuper;
    this.superFrom = options.superFrom ?? this.id;
  }

  setGarage(garage: ShiftGarage) {
    this.garage = garage;
  }

  join(shift: Shift): RotationWithSupervisor {
    super.join(shift);
    // if no super, and this shift is physician set this shift as super
    if (!this._nextSuper && shift?.role === "physician") {
      this._nextSuper = shift.id;
    }
    return this;
  }

  getWhichNext(whichNext: string, offset: number = 1): StateShiftId | undefined {
    if (whichNext === "nextPt" && this._nextPt) {
      return this.getNext(this._nextPt, offset);
    }

    if (whichNext === "nextSuper" && this._nextSuper) {
      const nextId = this.getNext(this._nextSuper, offset);
      if (!nextId) return;

      const nextShift = this.garage.find(nextId);
      if (!nextShift) return;

      if (nextShift.role !== "physician") {
        const adjustedOffset = offset < 0 ? offset - 1 : offset + 1;
        return this.getWhichNext(whichNext, adjustedOffset);
      }
      return nextId;
    }
    return;
  }
}

export class ZoneGarage {
  public zones: Zone[];

  constructor(zones: StateZone[]) {
    this.zones = zones.map((zone) => {
      switch (zone.type) {
        case "rotationWithSuper":
          return new RotationWithSupervisor(zone);
        case "rotation":
          return new Rotation(zone);
        case "zoneWithPatients":
          return new ZoneWithPatients(zone);
        default:
          return new Zone(zone);
      }
    });
  }

  find(zoneId: Zone["id"]): Zone | undefined {
    return this.zones.find((zone) => zone.id === zoneId);
  }
}
