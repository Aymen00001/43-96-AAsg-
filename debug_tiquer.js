const { connectToDatabase, client } = require("./config/dbConfig");

async function debugTiquerCollection() {
  try {
    console.log("🔍 Connecting to MongoDB...\n");
    const db = await connectToDatabase();
    const tiquerCollection = db.collection("Tiquer");

    // 1. Check if ANY documents exist with IdCRM = 2264 (UPPERCASE) - AS NUMBER
    console.log("📊 STEP 1: Checking for ANY documents with IdCRM=2264 (as NUMBER)...");
    const anyDocs = await tiquerCollection
      .find({ IdCRM: 2264 })
      .limit(5)
      .toArray();
    console.log(`Found ${anyDocs.length} documents with IdCRM=2264 (number)\n`);

    if (anyDocs.length > 0) {
      console.log("✓ Sample documents (IdCRM=2264, numeric):");
      anyDocs.forEach((doc, idx) => {
        console.log(`\nDocument ${idx + 1}:`);
        console.log(JSON.stringify(doc, null, 2));
      });
    }

    // 2. Check with string IdCRM
    console.log("\n\n📊 STEP 2: Checking for documents with IdCRM='2264' (as STRING)...");
    const stringDocs = await tiquerCollection
      .find({ IdCRM: "2264" })
      .limit(5)
      .toArray();
    console.log(`Found ${stringDocs.length} documents with IdCRM='2264' (string)\n`);

    // 3. Query with date range (numeric IdCRM)
    console.log(
      "\n\n📊 STEP 3: Querying with date range 20260210-20260312 (numeric IdCRM)..."
    );
    const datedDocs = await tiquerCollection
      .find({
        IdCRM: 2264,
        Date: { $gte: "20260210", $lte: "20260312" },
      })
      .limit(5)
      .toArray();
    console.log(`Found ${datedDocs.length} documents with date filter (numeric IdCRM)\n`);

    // 4. Check all available fields in sample document
    console.log("\n📊 STEP 4: Field analysis of first document with IdCRM=2264...");
    if (anyDocs.length > 0) {
      const firstDoc = anyDocs[0];
      console.log("All fields and their types:");
      Object.entries(firstDoc).forEach(([key, value]) => {
        const type =
          value === null
            ? "null"
            : Array.isArray(value)
            ? "array"
            : typeof value;
        console.log(`  ${key}: ${type} = ${JSON.stringify(value).slice(0, 50)}`);
      });
    }

    // 5. Check collection stats and find actual IdCRM values
    console.log("\n\n📊 STEP 5: Collection statistics...");
    const totalCount = await tiquerCollection.countDocuments();
    console.log(`Total documents in Tiquer collection: ${totalCount}`);

    const idcrm2264Count = await tiquerCollection.countDocuments({
      IdCRM: 2264,
    });
    console.log(`Documents with IdCRM=2264: ${idcrm2264Count}`);

    // Get distinct IdCRM values to see what exists
    console.log("\n📍 All distinct IdCRM values in database (SORTED):");
    const allIdCRM = await tiquerCollection.distinct("IdCRM");
    const sortedIdCRM = allIdCRM
      .sort((a, b) => {
        // Sort numbers first, then strings
        if (typeof a === "number" && typeof b === "number") return a - b;
        if (typeof a === "string" && typeof b === "string") return a.localeCompare(b);
        return typeof a === "number" ? -1 : 1;
      });
    console.log(`Total distinct IdCRM values: ${sortedIdCRM.length}`);
    console.log(`Values: ${sortedIdCRM.slice(0, 50).join(", ")}`);
    console.log(`\n⚠️  2264 ${sortedIdCRM.includes(2264) ? "EXISTS ✓" : "NOT FOUND ❌"}`);

    // 6. Sample of all collections in database
    console.log("\n\n📊 STEP 6: Available collections in database:");
    const collections = await db.listCollections().toArray();
    collections.forEach((col) => {
      console.log(`  - ${col.name}`);
    });

    // 7. Check actual sample documents from collection
    console.log("\n\n📊 STEP 7: Sample documents from Tiquer collection...");
    const allSamples = await tiquerCollection.find().limit(3).toArray();
    console.log(`Sample records (first 3 documents):`);
    allSamples.forEach((doc, idx) => {
      console.log(`\n--- Document ${idx + 1} ---`);
      console.log(JSON.stringify(doc, null, 2));
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
  } finally {
    await client.close();
    console.log("\n✅ Connection closed");
  }
}

debugTiquerCollection();
