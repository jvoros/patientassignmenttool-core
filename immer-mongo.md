# Immer and Mongo FTW

This is it. I think the best architectural solution to this app. We don't need any classes. We don't need complex SQL table setups. The app has always worked well as a JSON state object passed between server and client.

The functional approach became cumbersome because of all the parameters that had to be passed to each function that dealt with some subpart of the state.

The OOP approach became cumbersome because of all the scaffolding required just to run a few methods.

All along the state object always had all the info present. So if we are going to pass state in to every function, why not use [Immer](https://immerjs.github.io/) to make that easy? Well, if you use Immer, you also get [patches](https://immerjs.github.io/immer/patches)!

This means we can just store the `inversePatches` necessary to undo any event. This makes implementing undos trivial. This also makes the state object waaaaaaay smaller than holding the entire state in each event.

Now the workflow is:

1. On startup, server gets site from database.
2. Server broadcasts site.board to all clients.
3. Client sends action to server.
4. Server uses Immer to make newBoard by applying action, saving the inversePatches.
5. Server adds Event to board, with the saved inversePatches.

- the inversePatches cannot include the adding of the Event. That is impossible since the inversePatch for adding the event would have to include the inversePatch itself.
- **Adding the event must be a separate action from the main action itself.**

5. Server sends newBoard to Mongo to update Site document.
6. On success from Mongo, Server broadcasts newBoard, from memory, to all clients.
7. To undo an event:

- remove the first event in array
- apply inversePatches to state
- send to Mongo to update Site.board
- broadcast to clients

There is one request from client to server. One request from server to DB. One response from server to all clients.

Everything is simplified.

## Sample Site Document

Immer works better with id's rather than arrays, so will use objects where possible.

The `site` object is the static info related to the site: providers, schedule and any config.

The `board` object is the current state of that site. The `events` array can be limited to `site.event_limit`.

```json
{
  "site": {
    "id": "SiteId",

    "event_limit": 25,

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
    ]
  },

  "board": {
    "date": "09/25/2004",

    "zones": {
      "off": {
        "id": "off",
        "name": "Off",
        "zoneType": "zone",
        "shifts": []
      },
      "main": {
        "id": "main",
        "name": "Main",
        "zoneType": "rotationWithSupervisor",
        "nextPt": "one",
        "nextSuper": "one",
        "shifts": ["two", "one"]
      },
      "fasttrack": {
        "id": "fasttrack",
        "name": "Fast Track",
        "zoneType": "zoneWithPatients",
        "superFrom": "main", // id of rotation that provides supervisor
        "nextPt": "three",
        "shifts": ["three"]
      }
    },

    "shifts": {
      "one": {
        "id": "one",
        "name": "6a-3p",
        "provider": {
          "last": "Voros",
          "first": "Jeremy"
        },
        "counts": {
          "walkin": 1,
          "ambo": 1,
          "ft": 1,
          "supervised": 1,
          "bounty": 1
        }
      },
      "two": {
        "id": "two",
        "name": "8a-6p",
        "provider": {
          "last": "Blake",
          "first": "Kelly"
        },
        "counts": {}
      },
      "three": {
        "id": "three",
        "name": "6a-3p APP",
        "provider": {
          "last": "Cheever",
          "first": "Shelley"
        },
        "counts": {}
      }
    },

    "events": [
      {
        "type": "assign",
        "room": 4,
        "mode": "ambulance",
        "provider": "Jeremy Voros",
        "supervisor": "Kelly Blake",
        "inversePatches": "immer inversePatches go here"
      },
      {
        "type": "move",
        "provider": "Jeremy Voros",
        "inversePatches": "immer inversePatches go here"
      },
      {
        "type": "assign",
        "room": 4,
        "mode": "ambulance",
        "provider": "Jeremy Voros",
        "supervisor": "Kelly Blake",
        "inversePatches": "immer inversePatches go here"
      }
    ]
  }
}
```

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
