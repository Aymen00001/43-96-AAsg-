const { connectToDatabase, client } = require('./config/dbConfig.js');

async function exploreLiveStats() {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('livestats');

    console.log('\n' + '='.repeat(80));
    console.log('LIVESTATS COLLECTION EXPLORATION');
    console.log('='.repeat(80));

    // Total count
    const totalCount = await collection.countDocuments();
    console.log(`\nTotal documents in livestats: ${totalCount}`);

    // Show unique idCRM values
    console.log('\nUnique idCRM values in collection:');
    console.log('-'.repeat(80));
    const uniqueIdCRMs = await collection.distinct('idCRM');
    console.log(`Found ${uniqueIdCRMs.length} unique idCRM values:`);
    console.log(uniqueIdCRMs.sort((a, b) => a - b).slice(0, 20));
    if (uniqueIdCRMs.length > 20) {
      console.log(`... and ${uniqueIdCRMs.length - 20} more`);
    }

    // Show sample document
    console.log('\nSample document from livestats:');
    console.log('-'.repeat(80));
    const sample = await collection.findOne();
    if (sample) {
      console.log(JSON.stringify(sample, null, 2));
    }

    // Check collection schema
    console.log('\nCollection schema (field names):');
    console.log('-'.repeat(80));
    const aggregation = await collection.aggregate([
      { $project: { arrayofkeys: { $objectToArray: '$$ROOT' } } },
      { $unwind: '$arrayofkeys' },
      { $group: { _id: '$arrayofkeys.k' } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    const fieldNames = aggregation.map(doc => doc._id);
    console.log('Fields:', fieldNames);

    // Show date range in collection
    console.log('\nDate range information:');
    console.log('-'.repeat(80));
    const minDate = await collection.findOne({}, { sort: { date: 1 } });
    const maxDate = await collection.findOne({}, { sort: { date: -1 } });
    console.log(`Min date: ${minDate?.date}`);
    console.log(`Max date: ${maxDate?.date}`);

    await client.close();
  } catch (error) {
    console.error('Error exploring livestats:', error);
  }
}

exploreLiveStats();
