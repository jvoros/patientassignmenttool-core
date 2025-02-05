import { MongoClient, ServerApiVersion } from "mongodb";

const createDbConnection = (mongoUri: string): any => {
  const client = new MongoClient(mongoUri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  const getSiteComplete = async (site: string) => {
    const database = client.db("pat");
    const collection = database.collection("boards");
    return await collection.findOne({
      site,
    });
  };

  const getSiteDetails = async (site: string) => {
    const database = client.db("pat");
    const collection = database.collection("boards");
    return await collection.findOne({ site }, { projection: { site: 1, details: 1 } });
  };

  const getBoard = async (site: string) => {
    await client.connect();
    const database = client.db("pat");
    const collection = database.collection("boards");
    return await collection.findOne({ site }, { projection: { site: 1, board: 1 } });
  };

  const updateBoard = async (site: string, board: any) => {
    const database = client.db("pat");
    const collection = database.collection("boards");
    return await collection.updateOne({ site }, { $set: { board } });
  };

  const saveLogs = async (logs: LogItem[]) => {
    const database = client.db("pat");
    const collection = database.collection("logs");
    return await collection.bulkWrite(
      logs.map((log) => ({
        updateOne: {
          filter: { date: log.date, site: log.site, shift: log.shift },
          update: { $set: log },
          upsert: true,
        },
      }))
    );
  };

  const tryCatchWrap =
    (fn: any): Function =>
    async (...args: any[]) => {
      try {
        await client.connect();
        return await fn(...args);
      } catch (err) {
        console.error(err);
      } finally {
        //await client.close();
      }
    };

  return {
    getSiteComplete: tryCatchWrap(getSiteComplete),
    getSiteDetails: tryCatchWrap(getSiteDetails),
    getBoard: tryCatchWrap(getBoard),
    updateBoard: tryCatchWrap(updateBoard),
    saveLogs: tryCatchWrap(saveLogs),
  };
};

export default createDbConnection;
