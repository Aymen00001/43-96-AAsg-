const { MongoClient } = require("mongodb");

const mongoUri = 'mongodb+srv://maksebstatistique:Makseb123.@cluster0.7879moy.mongodb.net/statistiques?retryWrites=true&w=majority';
const client = new MongoClient(mongoUri);

async function findDataRange() {
  try {
    await client.connect();
    const db = client.db();
    
    console.log('\n' + '='.repeat(100));
    console.log('🔍 FINDING ACTUAL DATA RANGES IN DATABASE');
    console.log('='.repeat(100));

    const idCRM = '2264';

    // Check Tiquer collection
    console.log('\n📊 TIQUER COLLECTION:');
    console.log('-'.repeat(100));
    
    const tiquerCollection = db.collection('Tiquer');
    
    const minTicket = await tiquerCollection.findOne(
      { IdCRM: idCRM },
      { sort: { Date: 1 } }
    );
    
    const maxTicket = await tiquerCollection.findOne(
      { IdCRM: idCRM },
      { sort: { Date: -1 } }
    );

    if (minTicket || maxTicket) {
      console.log(`Tiquer data range:`);
      if (minTicket) console.log(`  From: ${minTicket.Date}`);
      if (maxTicket) console.log(`  To: ${maxTicket.Date}`);
    } else {
      console.log('No Tiquer data found');
    }

    // Check livestats collection
    console.log('\n📊 LIVESTATS COLLECTION:');
    console.log('-'.repeat(100));
    
    const livestatsCollection = db.collection('livestats');
    
    const minLivestat = await livestatsCollection.findOne(
      { IdCRM: idCRM },
      { sort: { date: 1 } }
    );
    
    const maxLivestat = await livestatsCollection.findOne(
      { IdCRM: idCRM },
      { sort: { date: -1 } }
    );

    if (minLivestat || maxLivestat) {
      console.log(`Livestats data range:`);
      if (minLivestat) console.log(`  From: ${minLivestat.date}`);
      if (maxLivestat) console.log(`  To: ${maxLivestat.date}`);
    } else {
      console.log('No livestats data found');
    }

    // Check Cloture collection
    console.log('\n📊 CLOTURE (Z/CLOSURE) COLLECTION:');
    console.log('-'.repeat(100));
    
    const clotureCollection = db.collection('Cloture');
    const clotures = await clotureCollection.find({ IdCRM: idCRM })
      .sort({ Date_cloture: 1 })
      .limit(5)
      .toArray();

    if (clotures.length > 0) {
      console.log(`Found ${clotures.length} closures (showing first 5):`);
      clotures.forEach((c, idx) => {
        console.log(`  ${idx + 1}. IDCloture: ${c.IDCloture}, Date: ${c.Date_cloture}, Time: ${c.HeureCloture}`);
      });
    } else {
      console.log('No Cloture records found');
    }

    // Now let's look for what store might have the negative tax issue
    console.log('\n' + '='.repeat(100));
    console.log('🔎 SEARCHING FOR NEGATIVE TAX PATTERNS IN ALL STORES');
    console.log('='.repeat(100));

    const livestats = db.collection('livestats');
    
    // Find any record where HT >= TTC (indicating potential swap)
    const allStores = await livestats.distinct('IdCRM');
    console.log(`\nTotal stores in livestats: ${allStores.length}`);
    console.log(`Checking first 5 stores for data consistency...\n`);

    for (let i = 0; i < Math.min(5, allStores.length); i++) {
      const storeId = allStores[i];
      const storeData = await livestats.findOne({ IdCRM: storeId });
      
      if (storeData && storeData.ChiffreAffaire) {
        const ttc = storeData.ChiffreAffaire.Total_TTC || 0;
        const ht = storeData.ChiffreAffaire.Total_HT || 0;
        
        const status = ttc > ht ? '✅' : '❌';
        console.log(`${status} Store ${storeId}: TTC=${ttc}, HT=${ht}, Tax=${(ttc - ht).toFixed(2)}€`);
      }
    }

    // Try different store IDs from the dashboard
    console.log('\n' + '='.repeat(100));
    console.log('🏪 CHECKING SPECIFIC STORE FROM DASHBOARD');
    console.log('='.repeat(100));

    console.log(`\nChecking IdCRM='2264' (from dashboard screenshot):`);
    const store2264 = await livestats.findOne({ IdCRM: '2264' });
    if (store2264) {
      console.log(`Found! Date: ${store2264.date}`);
      console.log(JSON.stringify(store2264.ChiffreAffaire, null, 2));
    } else {
      console.log('Not found in livestats');
    }

    // Check if there's a different format for store ID
    console.log(`\nChecking variations of store ID '2264':`);
    const variations = [
      'idCRM=2264',
      '2264',
      '02264',
      '002264',
    ];

    for (const variation of variations) {
      const count = await livestats.countDocuments({ IdCRM: variation });
      if (count > 0) {
        console.log(`  ✅ Found ${count} records with IdCRM='${variation}'`);
        const sample = await livestats.findOne({ IdCRM: variation });
        if (sample && sample.ChiffreAffaire) {
          console.log(`     Sample TTC: ${sample.ChiffreAffaire.Total_TTC}, HT: ${sample.ChiffreAffaire.Total_HT}`);
        }
      }
    }

    console.log('\n' + '='.repeat(100) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

findDataRange();
