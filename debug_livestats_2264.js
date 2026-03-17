const { connectToDatabase, client } = require('./config/dbConfig.js');

async function queryLiveStats() {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('livestats');

    console.log('\n' + '='.repeat(80));
    console.log('LIVESTATS COLLECTION QUERY FOR IdCRM=2264');
    console.log('='.repeat(80));

    // 1. Get a sample document to show structure
    console.log('\n1. SAMPLE DOCUMENT STRUCTURE (all fields):');
    console.log('-'.repeat(80));
    const sampleDoc = await collection.findOne({ IdCRM: '2264' });
    if (sampleDoc) {
      console.log(JSON.stringify(sampleDoc, null, 2));
    } else {
      console.log('No documents found for IdCRM=2264');
    }

    // 2. Count documents in date range 20260210 to 20260312
    console.log('\n2. DOCUMENT COUNT IN DATE RANGE (20260210 to 20260312):');
    console.log('-'.repeat(80));
    
    const countInRange = await collection.countDocuments({
      IdCRM: '2264',
      date: { $gte: '20260210', $lte: '20260312' }
    });
    console.log(`Total documents for IdCRM=2264 in range: ${countInRange}`);

    // 3. Get 2 sample documents from the collection
    console.log('\n3. TWO SAMPLE DOCUMENTS (with all fields):');
    console.log('-'.repeat(80));
    const sampleDocs = await collection
      .find({ IdCRM: '2264' })
      .limit(2)
      .toArray();

    if (sampleDocs.length === 0) {
      console.log('No documents found for IdCRM=2264');
    } else {
      sampleDocs.forEach((doc, index) => {
        console.log(`\nDocument ${index + 1}:`);
        console.log(JSON.stringify(doc, null, 2));
      });
    }

    // Additional: Show total count for this IdCRM
    console.log('\n' + '-'.repeat(80));
    const totalCount = await collection.countDocuments({ IdCRM: '2264' });
    console.log(`Total documents for IdCRM=2264: ${totalCount}`);

    // Show available dates for this IdCRM
    if (totalCount > 0) {
      console.log('\nAvailable dates for IdCRM=2264:');
      const dates = await collection.distinct('date', { IdCRM: '2264' });
      dates.sort();
      console.log(dates);
    }

    await client.close();
  } catch (error) {
    console.error('Error querying livestats:', error);
  }
}

queryLiveStats();
