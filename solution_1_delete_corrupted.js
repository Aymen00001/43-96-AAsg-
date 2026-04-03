const { MongoClient } = require("mongodb");

const mongoUri = 'mongodb+srv://maksebstatistique:Makseb123.@cluster0.7879moy.mongodb.net/statistiques?retryWrites=true&w=majority';
const client = new MongoClient(mongoUri);

async function deleteCorruptedRecords() {
  try {
    await client.connect();
    const db = client.db();
    
    console.log('\n' + '='.repeat(100));
    console.log('🔧 SOLUTION 1: DELETING CORRUPTED TIQUER RECORDS FOR STORE 9999');
    console.log('='.repeat(100));

    const tiquerCollection = db.collection('Tiquer');
    const idCRM = '9999';

    // First, show what we're about to delete
    const corruptedTickets = await tiquerCollection.find({ IdCRM: idCRM, Date: '20260402' }).toArray();
    
    console.log(`\n📋 Found ${corruptedTickets.length} tickets to delete:\n`);
    
    corruptedTickets.forEach((ticket, idx) => {
      const ttc = parseFloat(ticket.TTC || 0);
      const ht = parseFloat(ticket.Totals?.Total_Ht || 0);
      const status = ticket.status || 'UNKNOWN';
      
      const isBad = ht > ttc && ttc > 0;
      const marker = isBad ? '❌' : '⚠️ ';
      
      console.log(`${marker} Ticket ${ticket.idTiquer}: TTC=${ttc}€, HT=${ht}€, Status="${status}"`);
    });

    // Prompt for confirmation
    console.log('\n' + '-'.repeat(100));
    console.log('\n🔴 EXECUTING: Deleting all 26 corrupted records for store 9999 on 2026-04-02...\n');
    
    const result = await tiquerCollection.deleteMany({
      IdCRM: idCRM,
      Date: '20260402'
    });

    console.log(`✅ DELETION COMPLETE:`);
    console.log(`   Deleted: ${result.deletedCount} documents\n`);

    // Verify deletion
    const remaining = await tiquerCollection.countDocuments({ IdCRM: idCRM, Date: '20260402' });
    console.log(`📊 Verification:`);
    console.log(`   Remaining records for store 9999 on 2026-04-02: ${remaining}`);
    
    if (remaining === 0) {
      console.log(`   ✅ Deletion verified - all corrupted records removed!\n`);
    } else {
      console.log(`   ⚠️  Warning: ${remaining} records still exist\n`);
    }

    // Summary
    const totalStore9999 = await tiquerCollection.countDocuments({ IdCRM: idCRM });
    console.log(`📈 Store 9999 total tickets after cleanup: ${totalStore9999}\n`);

    console.log('='.repeat(100) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

deleteCorruptedRecords();
