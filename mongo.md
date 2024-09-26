# Mongo Version

Basically, the key component is the `boards` collection. Within this collection, each document is the state for a particular site. Really only two elements are needed, `zones` and `events`. That is enough to construct the board for any site. As long as the backend app can handle any configuration of zones - some that are rotations, some that are lists, some that get supervisors from other rotations, etc. - then each site can just have their own document.

## Schema

Built using four collections:

1. **Sites**: contains the base configuration info about each site, e.g. list of doctors, shifts in the schedule, which zones their should be (with just zones can create an empty board).
2. **Boards**: like described above. Has the active board for each site.
3. **Logs**: saves the shift documents from the board on reset for analysis later.

## Sites

```json
{
  "id": "stmarks", // slug
  "name": "St. Mark's",
  "eventLimit": 20,
  "providers": [
    { "last": "Voros", "first": "Jeremy", "role": "physician" },
    { "last": "Blake", "first": "Kelly", "role": "physician" }
  ],
  "schedule": [
    {
      "name": "6a-3p",
      "role": "physician",
      "bonus": 2,
      "joinZones": ["main"]
    },
    {
      "name": "6a-3p APP",
      "role": "app",
      "bonus": 0,
      "joinZones": ["fasttrack", "flex"]
    }
  ],
  "zones": [
    // 0 index always 'Off'
    {"id": "off", "name": "Off", "zoneType": "zone", "shifts": []}
    // 1 index always 'Main'
      {
        "id": "main",
        "name": "Main",
        "type": "rotationWithSupervisor",
        "getSuper": null,
        "nextPt": null,
        "nextSuper": null,
        "shifts":[]
      },
     {
        "id": "fasttrack",
        "name": "Fast Track",
        "getSuper": "main",
        "zoneType": "zoneWithPatients",
        "shifts":[]
      },
     {"id": "flex", "name": "Flex", "zoneType": "zone", "shifts": []}
  ]
}
```

## Boards

The `shifts` array holds each shift, with a simple incrementing `id`. The zones reference these ids.

### History

`history` can be limited to `site_event_limit`. A big site may want more events in the history stack than a smaller site. Each `history` document has an `event` and a `snapshot`. The `snapshot` is to roll back state on undo. These will increase the document size but only have to be returned when executing an undo.

Needs to include `date`, `shifts`, and `zones`. Can use those three to roll back to prior state.

[StackOverflow answer on slice](https://stackoverflow.com/questions/29932723/how-to-limit-an-array-size-in-mongodb)

```js
$push: { "field": { $each: ["val1", "val2"], $slice: -10 }}
db.getCollection('col').updateOne({}, {$push: {"field": {$each: ["val1"], $slice: -10}}})
```

Using this approach at text json document with 15 shifts and a history limit of 30 was only 140kb.

### Sample Board Document

```json
{
  "id": "SiteId",
  "date": "09/25/2004",
  "zones": [
    {
      "id": "off",
      "name": "Off",
      "zoneType": "zone",
      "shifts": []
    },
    {
      "id": "main",
      "name": "Main",
      "zoneType": "rotationWithSupervisor",
      "nextPt": 1,
      "nextSuper": 1,
      "shifts": [1, 2]
    },
    {
      "id": "fasttrack",
      "name": "Fast Track",
      "zoneType": "zoneWithPatients",
      "superFrom": "main", // id of rotation that provides supervisor
      "nextPt": 3,
      "shifts": [3]
    }
  ],
  "shifts": [
    {
      "id": 1,
      "name": "6a-3p",
      "provider": "Jeremy Voros",
      "patients": 3,
      "supervised": 3
    },
    {
      "id": 2,
      "name": "8a-6p",
      "provider": "Kelly Blake",
      "patients": 1,
      "supervised": 0
    },
    {
      "id": 3,
      "name": "6a-3p APP",
      "provider": "Shelly Cheever",
      "patients": 3,
      "supervised": 0
    }
  ],
  "history": [
    {
      "event": {
        "eventType": "assign",
        "room": 4,
        "mode": "ambulance",
        "provider": "Jeremy Voros",
        "supervisor": "Kelly Blake"
      },
      "rollback": {
        "date": "09/24/2024", // needs to include date to rollback past a reset
        "zones": ["zones before change"],
        "shifts": ["shifts before change"]
      }
    }
  ]
}
```

## Logs

These will be added to database when reset to start a new day. No point in logging mid-day, when shifts aren't complete. Add each shift to its own log item.

```json
{
  "_id": "ObjectID because includes timestamp",
  "date": "09/25/2024",
  "siteId": "stmarks",
  "shift": "6a-3p",
  "provider": "Jeremy Voros",
  "patients": 3,
  "supervised": 3
}
```
