import { MongoClient, ServerApiVersion } from "mongodb";

const uri =
  "mongodb+srv://jeremyvoros-vscode:EVENING_trait_marwan@patient-assignment.omhid.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const database = client.db("pat");
    const collection = database.collection("boards");
    const documents = await collection.find({}).toArray();
    console.log(documents);
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}
console.log("Running up that hill");
run().catch(console.dir);
