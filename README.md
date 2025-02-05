# Patient Assignment Tool v1.0

This is it. I think the best architectural solution to this app. We don't need any classes. We don't need complex SQL table setups. The app has always worked well as a JSON state object passed between server and client.

### Prior Approaches

The functional approach became cumbersome because of all the parameters that had to be passed to each function that dealt with some subpart of the state. And then modifying deeply nested objects in an immutable way also became complicated and hard to keep track of which functions worked in place as helpers and which functions had the responsibility to return new state.

The OOP approach became cumbersome because of all the scaffolding required just to run a few methods. The methods were simple, with short names and minimal parameters, because the object held the state. But it was very hard to test. And all the state the objects stored had to be turned into JSON to send to client anyway.

### Immer FTW

[Immer](https://immerjs.github.io/) splits the difference between the two. The state/board object always had all the info present. Immer makes it very easy to modify the state/board object in place and return a new state object.

Using Immer, you also get [patches](https://immerjs.github.io/immer/patches)! We can just store the `inversePatches` necessary to undo any event. This makes implementing undos trivial. This also makes the state object waaaaaaay smaller than holding the entire state in each event.

### Hydrate

The final innovation is hydrating the board before sending it to the client. The board document is structured in the optimal way for Immer but this isn't the best for the client. Hydrating the board puts complete `shift` and `event` objects at the appropriate places in the board. It also breaks `zones` into `zoneList1` and `zoneList2` for display in the client. This molds the board object into something easier to work with on the front end.

The hydrated board is fetched with `getBoardHydrated()`.

## App Flow in this Version

1. On startup, server gets site from database.
2. Server broadcasts site.board to all clients.
3. Client sends action to server.
4. Server uses Immer to make newBoard by applying action, and adding Event (without `inversePatches`).
5. Server adds the `inversePatches` to Event on board.
6. Server sends newBoard back to client.

- This app has worked for 18 months in production as just with just the server-side in-memory store. We don't need to wait for confirmation from server that data was saved in database. The database is just a backup persistence layer.

7. Server simultaneously sends newBoard to Mongo to update `Site.board`.

Everything is simplified.

To undo an event:

1. remove the first event in array
2. remove inversePatches from first event in array
3. _now the board is equivalent to the state immediately after these patches were applied_
4. apply inversePatches
5. broadcast to clients
6. send to Mongo to update `Site.board`

## Sample Site Document

Immer works better with id's rather than arrays, so will use objects where possible.

The `site` object is the static info related to the site: providers, schedule and any config.

The `board` object is the current state of that site. The `events` array can be limited to `site.event_limit`.

[Sample Site Document](./dummy/siteDocument.json)

[Sample Board](./dummy/sampleboard.js)

## Logs

These will be added to database when reset to start a new day. No point in logging mid-day, when shifts aren't complete. Add each shift to its own log item.

```json
{
  "_id": "ObjectID because includes timestamp",
  "date": "09/25/2024",
  "site": "stmarks",
  "shift": "6a-3p",
  "provider": "Jeremy Voros",
  "patients": 3,
  "supervised": 3,
  "bounty": 0
}
```

# API

Build the core js files from ts source into dist folder and copy to your project.

```
npm run build
```

Don't forget to include `MONGO_URI` connection string in `.env` and include it in your deploy routines.

## Board Functions

```js
import createBoardStore from "../path/to/module/index.js";
```

### # createBoardStore()

```ts
function createBoardStore(siteName: string);
```

Example initialization:

```js
const board = createBoardStore("stmarks");
```

Initializes the module. All following API calls are methods on the `board`, e.g `board.getBoard()`.

---

### # getBoard()

```ts
function getBoard(): Board;
```

Returns just the `board` portion of the the `site` document from memory, if already instantiated, or from the database if first connection.

---

### # getBoardHydrated()

```ts
function getBoardHydrated(): BoardHydrated;
```

Returns `board` in the _hydrated_ form, meaning the most convenient form for the client. Hydrating the board puts complete `shift` and `event` objects at the appropriate places in the board. It also breaks `zones` into `zoneList1` and `zoneList2` for display in the client.

---

### # getSiteComplete()

```ts
function getSiteComplete(): SiteDocument;
```

Returns the complete `site` document from the database.

---

### # getSiteDetails()

```ts
function getSiteDetails(): SiteDetails;
```

Returns just the `details` portion from the `site` document. `details` includes a list of `providers`, `schedule` - a list of daily shifts for the site, and `zones` - enough info to configure the zone.

---

### # boardReset()

```ts
function boardReset(): Board;
```

Returns an empty board and saves the previous board logs to the database.

---

## Shift Functions

### # signIn()

```ts
function signIn(provider: Provider, scheduleItem: ScheduleItem): Board;
```

```ts
type Provider = {
  last: string;
  first: string;
};

type Role = "physician" | "app" | "resident";

type ScheduleItem = {
  name: string;
  role: string;
  bonus: number;
  joinZones: ZoneId[];
};
```

Adds a shift to the board. Will add the shift to the zones specified in `joinZones`. The `ScheduleItem` object is configured in the `site` document and should come from there, not be hand configured.

---

### # signOut()

```ts
function signOut(shiftId: ShiftId): Board;
```

Signs out the specified shift.

---

### # deleteShift()

```ts
function deleteShift(shiftId: ShiftId): Board;
```

Delete the specified shift. Will not delete shift if patients have been assigned.

---

### # joinZone()

```ts
function joinZone(zoneId: ZoneId, shiftId: ShiftId): Board;
```

Adds the specified shift to the specified zone.

---

### # leaveZone()

```ts
function leaveZone(zoneId: ZoneId, shiftId: ShiftId): Board;
```

Removes the specified shift from the specified zone.

---

### # switchZone()

```ts
function switchZone(leaveZoneId: ZoneId, joinZoneId: ZoneId, shiftId: ShiftId): Board;
```

Moves the specified shift between the specified zones.

---

## Zone Functions

### # advanceRotation()

```ts
function advanceRotation = (zoneId: ZoneId, whichActive: string, direction: number): Board;
```

Changes which shift is set to the active shift in the rotation. `whichActive` is `patient` or `supervisor` to specify which role in the rotation needs to be adjusted. `direction` will almost always be `1` to specify advancing forward or `-1` to specify moving backward in rotation.

---

### # changePosition()

```ts
function changePosition = (zone: ZoneId, shift: ShiftId, direction: number): Board;

```

Adjusts the order of shifts in a rotation. `direction` will usually be `1` to move the shift forward in rotation, or `-1` to move the shift backward in the rotation.

---

### # pauseShift()

```ts
function pauseShift(shiftId: ShiftId): Board;
```

Pauses a shift in rotation, so the shift will be skipped everytime through rotation until the shift is unpaused.

---

### # unpauseShift()

```ts
function unpauseShift(shiftId: ShiftId): Board;
```

Unpauses a shift that is currently paused. Once unpaused, shift will again become active in the rotation.

---

## Assignment Functions

### # assignToShift()

```ts
function assignToShift(zoneId: ZoneId, shiftId: ShiftId, patient: Patient): Board;
```

```ts
type Patient = {
  room: string;
  mode: string;
};

type mode = "walkin" | "ft" | "ambo" | "police";
```

Assigns a patient to a specified shift. This is not part of any rotation. If the assignment also requires a supervisor assignment, that will also be triggered. This will create an event for the assignment.

`room` should come from the `site.details` and be configured on a sitewide basis.

---

### # assignToZone()

```ts
function assignToZone(zoneId: ZoneId, patient: Patient): Board;
```

```ts
type Patient = {
  room: string;
  mode: string;
};

type mode = "walkin" | "ft" | "ambo" | "police";
```

Assigns a patient according to the rotation. Whichever shift is set as active will have the patient assigned to it. The rotation will advance, or not, depending on the shift bonus, skip and other internal flags.

One notable flag is the `triggerSkip` flag for a shift. For example, the Fast Track Zone may be set up so when a patient is assigned to a shift in Fast Track, it will trigger a skip, for any other rotations that shift may also be in. The `triggerSkip` flag is configured in the `site.details` configuration.

---

### # reassignPatient()

```ts
function reassignPatient(eventId: BoardEventId, newShiftId: ShiftId): Board;
```

Handles all the logic to reassign a patient.

If a patient was initially assigned to a physician and is reassigned to an APP, the original physician will be set as supervisor.

If a patient was initially assigned to an APP and is reassigned to another APP, the original supervisor will stay set as the supervisor.

---

### # changeRoom()

```ts
function changeRoom(eventId: BoardEventId, newRoom: string): Board;
```

Changes the room of a patient assignement. Changes event type to `reassign` so both this function and `reassignPatient()` have the same event types.

---
