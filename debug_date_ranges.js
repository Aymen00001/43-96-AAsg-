const { connectToDatabase, client } = require('./config/dbConfig.js');

async function checkDateRanges() {
  try {
    console.log('\n========================================');
    console.log('DATE RANGE ANALYSIS FOR idCRM=2264');
    console.log('========================================\n');

    const db = await connectToDatabase();

    // Check livestats collection
    console.log('📊 LIVESTATS COLLECTION (aggregated data):');
    console.log('─'.repeat(50));
    
    const livestatsCollection = db.collection('livestats');
    
    // Get all docs for idCRM 2264
    const livestatsDocs = await livestatsCollection
      .find({ IdCRM: '2264' })
      .sort({ date: 1 })
      .toArray();
    
    console.log(`Total documents for IdCRM=2264: ${livestatsDocs.length}`);
    
    if (livestatsDocs.length > 0) {
      console.log(`\nDate range in livestats:`);
      console.log(`  Earliest: ${livestatsDocs[0].date}`);
      console.log(`  Latest: ${livestatsDocs[livestatsDocs.length - 1].date}`);
      console.log(`\nSample documents:`);
      livestatsDocs.slice(0, 5).forEach((doc, idx) => {
        console.log(`  ${idx + 1}. date=${doc.date}, EtatTiquer:`, JSON.stringify(doc.EtatTiquer));
      });
    }

    // Check Tiquer collection
    console.log('\n\n📋 TIQUER COLLECTION (individual tickets):');
    console.log('─'.repeat(50));
    
    const tiquerCollection = db.collection('Tiquer');
    
    // Try both idCRM field types for idCRM 2264
    let tiquerDocs = await tiquerCollection
      .find({ idCRM: '2264' })
      .toArray();
    
    console.log(`Total documents with idCRM="2264": ${tiquerDocs.length}`);
    
    if (tiquerDocs.length === 0) {
      tiquerDocs = await tiquerCollection
        .find({ idCRM: 2264 })
        .toArray();
      console.log(`Total documents with idCRM=2264 (as number): ${tiquerDocs.length}`);
    }
    
    if (tiquerDocs.length === 0) {
      tiquerDocs = await tiquerCollection
        .find({ IdCRM: '2264' })
        .toArray();
      console.log(`Total documents with IdCRM="2264": ${tiquerDocs.length}`);
    }
    
    if (tiquerDocs.length === 0) {
      tiquerDocs = await tiquerCollection
        .find({ IdCRM: 2264 })
        .toArray();
      console.log(`Total documents with IdCRM=2264 (as number): ${tiquerDocs.length}`);
    }

    if (tiquerDocs.length > 0) {
      console.log(`\nDate range in Tiquer:`);
      const sortedByDate = tiquerDocs.sort((a, b) => {
        const dateA = a.Date || a.date || '';
        const dateB = b.Date || b.date || '';
        return dateA.localeCompare(dateB);
      });
      
      console.log(`  Earliest: ${sortedByDate[0].Date || sortedByDate[0].date}`);
      console.log(`  Latest: ${sortedByDate[sortedByDate.length - 1].Date || sortedByDate[sortedByDate.length - 1].date}`);
      
      console.log(`\nSample documents:`);
      tiquerDocs.slice(0, 5).forEach((doc, idx) => {
        console.log(`  ${idx + 1}. Date=${doc.Date || doc.date}, idTiquer=${doc.idTiquer}, TTC=${doc.TTC}`);
      });
    } else {
      console.log('\n❌ NO TICKETS FOUND FOR idCRM=2264 IN TIQUER COLLECTION!');
    }

    // Compare counts for 2435
    console.log('\n\n📊 COMPARISON WITH idCRM=2435 (working store):');
    console.log('─'.repeat(50));
    
    const livestats2435 = await livestatsCollection
      .find({ IdCRM: '2435' })
      .toArray();
    
    const tiquer2435 = await tiquerCollection
      .find({ idCRM: '2435' })
      .toArray();
    
    console.log(`livestats collection: ${livestats2435.length} documents`);
    console.log(`Tiquer collection: ${tiquer2435.length} documents`);
    
    if (tiquer2435.length > 0) {
      const dates = tiquer2435.map(d => d.Date || d.date).filter(Boolean);
      const uniqueDates = [...new Set(dates)];
      console.log(`  Date range: ${Math.min(...dates)} to ${Math.max(...dates)}`);
      console.log(`  Unique dates: ${uniqueDates.length}`);
    }

    console.log('\n========================================\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkDateRanges();
