const { MongoClient } = require("mongodb");

const mongoUri = 'mongodb+srv://maksebstatistique:Makseb123.@cluster0.7879moy.mongodb.net/statistiques?retryWrites=true&w=majority';
const client = new MongoClient(mongoUri);

async function verifyExactDates() {
  try {
    await client.connect();
    const db = client.db();
    
    console.log('\n' + '='.repeat(100));
    console.log('🔍 VERIFYING TAX ISSUE - Exact Dashboard Date Range');
    console.log('='.repeat(100));

    // From dashboard - shows 02/04/2026 - 03/04/2026
    // This could be April 2-3, 2026 (US format MM/DD/YYYY) or Feb 2 - Mar 3 (European DD/MM/YYYY)
    const dateRanges = [
      { label: 'April 2-3 (US format)', date1: '20260402', date2: '20260403' },
      { label: 'April 2-4 (US format - 2 days)', date1: '20260402', date2: '20260404' },
      { label: 'Feb 2 - Mar 3 (EU format)', date1: '20260202', date2: '20260303' },
      { label: 'Mar 2 - Apr 3 (EU format)', date1: '20260302', date2: '20260403' },
    ];

    const idCRM = '2264';

    for (const range of dateRanges) {
      console.log(`\n${'='.repeat(100)}`);
      console.log(`Testing: ${range.label} (${range.date1} to ${range.date2})`);
      console.log('='.repeat(100));

      const livestatsCollection = db.collection('livestats');
      
      const livestatsData = await livestatsCollection.find({
        IdCRM: idCRM,
        date: { $gte: range.date1, $lte: range.date2 }
      }).toArray();

      console.log(`Found ${livestatsData.length} records`);

      if (livestatsData.length > 0) {
        let totalTTC = 0;
        let totalHT = 0;
        let totalTVA = 0;

        livestatsData.forEach((record, idx) => {
          console.log(`\nRecord ${idx + 1} (Date: ${record.date}):`);
          if (record.ChiffreAffaire) {
            console.log(`  Total_TTC: ${record.ChiffreAffaire.Total_TTC}`);
            console.log(`  Total_HT: ${record.ChiffreAffaire.Total_HT}`);
            console.log(`  Total_TVA: ${record.ChiffreAffaire.Total_TVA || 'N/A'}`);

            totalTTC += parseFloat(record.ChiffreAffaire.Total_TTC || 0);
            totalHT += parseFloat(record.ChiffreAffaire.Total_HT || 0);
            totalTVA += parseFloat(record.ChiffreAffaire.Total_TVA || 0);
          }
        });

        console.log(`\n📊 AGGREGATED FOR THIS RANGE:`);
        console.log(`  Total_TTC: ${totalTTC.toFixed(2)}€`);
        console.log(`  Total_HT: ${totalHT.toFixed(2)}€`);
        console.log(`  Total_TVA: ${totalTVA.toFixed(2)}€`);
        console.log(`  Calculated Tax (TTC - HT): ${(totalTTC - totalHT).toFixed(2)}€`);

        if ((totalTTC - totalHT) < 0) {
          console.log(`\n❌ NEGATIVE TAX FOUND IN THIS RANGE!`);
          console.log(`   This matches the dashboard issue!`);
        }
      }
    }

    // Also check what's in livestats for TODAY (April 3, 2026)
    console.log(`\n${'='.repeat(100)}`);
    console.log(`SPECIAL: Today's data (April 3, 2026 - should have live/incomplete data)`);
    console.log('='.repeat(100));

    const livestatsCollection = db.collection('livestats');
    const todayData = await livestatsCollection.findOne({
      IdCRM: idCRM,
      date: '20260403'
    });

    if (todayData) {
      console.log('\n✅ Found today\'s livestats record:');
      console.log(JSON.stringify(todayData, null, 2));
    } else {
      console.log('\n⚠️  No livestats record for today (April 3)');
      
      // Check if there's live Tiquer data for today
      const tiquerCollection = db.collection('Tiquer');
      const tiquerCount = await tiquerCollection.countDocuments({
        IdCRM: idCRM,
        Date: '20260403'
      });
      console.log(`   But found ${tiquerCount} live Tiquer records for today`);
    }

    console.log('\n' + '='.repeat(100) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

verifyExactDates();
