// @ts-check
const { readFile, readdir, stat } = require("fs/promises");
const { join } = require("path");
const { MongoClient } = require("mongodb");

const dbUrl = "mongodb://localhost:27017";

const client = new MongoClient(dbUrl);

(async () => {
  try {
    await client.connect();
    console.log("🔥 Database Connected!");

    const directoryContents = await readdir(__dirname);

    for (const content of directoryContents) {
      const contentPath = join(__dirname, content);
      const contentStats = await stat(contentPath);

      if (
        !contentStats.isDirectory() ||
        ["node_modules", ".git"].includes(content)
      )
        continue;

      const jsonFilesOfContentDirectory = await readdir(contentPath);

      const db = client.db(content);

      for (const file of jsonFilesOfContentDirectory) {
        let dataToBeInserted = [];
        const fileContent = await readFile(join(contentPath, file), "utf-8");
        const fileLines = fileContent.split(/\r?\n/);

        for (const line of fileLines) {
          try {
            const jsonData = JSON.parse(line);
            delete jsonData["_id"];
            dataToBeInserted.push(jsonData);
          } catch (error) {}
        }

        const collectionName = file.replace(".json", "");
        await db.collection(collectionName).insertMany(dataToBeInserted);
        console.log(
          `Inserted -> ${dataToBeInserted.length} <- Documents to the collection -> ${collectionName} <- of database -> ${content} <-`
        );
        dataToBeInserted = [];
      }
    }

    process.exit(0);
  } catch (e) {
    console.log(e.message);
  }
})();
