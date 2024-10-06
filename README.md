# Patient Assignment Tool v1.0

This is it. I think the best architectural solution to this app. We don't need any classes. We don't need complex SQL table setups. The app has always worked well as a JSON state object passed between server and client.

### Prior Approaches

The functional approach became cumbersome because of all the parameters that had to be passed to each function that dealt with some subpart of the state. And then modifying deeply nested objects in an immutable way also became complicated and hard to keep track of which functions worked in place as helpers and which functions had the responsibility to return new state.

The OOP approach became cumbersome because of all the scaffolding required just to run a few methods. The methods were simple, with short names and minimal parameters, because the object held the state. But it was very hard to test. And all the state the objects stored had to be turned into JSON to send to client anyway.

### Immer FTW

[Immer](https://immerjs.github.io/) splits the difference between the two. The state/board object always had all the info present. Immer makes it very easy to modify the state/board object in place and return a new state object.

Using Immer, you also get [patches](https://immerjs.github.io/immer/patches)! We can just store the `inversePatches` necessary to undo any event. This makes implementing undos trivial. This also makes the state object waaaaaaay smaller than holding the entire state in each event.

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

[Sample Site Document](./dummy/siteDocumentFromMongo.json)

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
