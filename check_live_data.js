const { MongoClient } = require("mongodb");

const mongoUri = 'mongodb+srv://maksebstatistique:Makseb123.@cluster0.7879moy.mongodb.net/statistiques?retryWrites=true&w=majority';
const client = new MongoClient(mongoUri);

async function checkLiveData() {
  try {
    await client.connect();
    const db = client.db();
    
    console.log('\n' + '='.repeat(100));
    console.log('🔍 ANALYZING LIVE DATA MODE - Tiquer Collection (Raw Tickets)');
    console.log('='.repeat(100));

    const idCRM = '2264';
    const tiquerCollection = db.collection('Tiquer');

    // Check April dates (since dashboard shows April 3 as current date with Live Data enabled)
    const aprilDates = ['20260402', '20260403'];
    
    for (const date of aprilDates) {
      console.log(`\n${'='.repeat(100)}`);
      console.log(`Checking Date: ${date} (April ${date.slice(6)}, 2026)`);
      console.log('='.repeat(100));

      const tickets = await tiquerCollection.find({
        IdCRM: idCRM,
        Date: date
      }).toArray();

      console.log(`Found ${tickets.length} tickets for this date`);

      if (tickets.length > 0) {
        console.log('\nTicket Details (first 5):');
        
        let totalTTC = 0;
        let totalHT = 0;
        let totalTVA = 0;

        tickets.slice(0, 5).forEach((ticket, idx) => {
          console.log(`\n  Ticket ${idx + 1}:`);
          console.log(`    ├─ idTiquer: ${ticket.idTiquer}`);
          console.log(`    ├─ Date: ${ticket.Date}, Time: ${ticket.HeureTicket}`);
          console.log(`    ├─ TTC (main field): ${ticket.TTC}`);
          console.log(`    ├─ Status: ${ticket.status || 'UNKNOWN'}`);
          
          if (ticket.Totals) {
            console.log(`    ├─ Totals:`);
            console.log(`    │  ├─ Total_Ht: ${ticket.Totals.Total_Ht}`);
            console.log(`    │  ├─ Total_TVA: ${ticket.Totals.Total_TVA}`);
            console.log(`    │  └─ Total_TTC: ${ticket.Totals.Total_TTC}`);
          } else {
            console.log(`    └─ Totals: MISSING!`);
          }

          // Check for issues
          const ttc = parseFloat(ticket.TTC || 0);
          const ht = parseFloat(ticket.Totals?.Total_Ht || 0);
          const tva = parseFloat(ticket.Totals?.Total_TVA || 0);
          
          if (ht > ttc && ttc > 0) {
            console.log(`    ❌ ISSUE: HT (${ht}) > TTC (${ttc})`);
          }

          totalTTC += ttc;
          totalHT += ht;
          totalTVA += tva;
        });

        console.log(`\n  📊 Totals for first 5 tickets:`);
        console.log(`    TTC: ${totalTTC.toFixed(2)}€`);
        console.log(`    HT: ${totalHT.toFixed(2)}€`);
        console.log(`    TVA: ${totalTVA.toFixed(2)}€`);
        console.log(`    Calculated Tax (TTC - HT): ${(totalTTC - totalHT).toFixed(2)}€`);
      }
    }

    // Check for ANY tickets with HT > TTC issue
    console.log(`\n${'='.repeat(100)}`);
    console.log(`SEARCHING FOR PROBLEMATIC TICKETS (HT > TTC)`);
    console.log('='.repeat(100));

    const badTickets = await tiquerCollection.find({
      IdCRM: idCRM,
      Date: { $gte: '20260402', $lte: '20260403' }
    }).toArray();

    let problematicCount = 0;
    const problematicExamples = [];

    badTickets.forEach(ticket => {
      const ttc = parseFloat(ticket.TTC || 0);
      const ht = parseFloat(ticket.Totals?.Total_Ht || 0);
      
      if (ht > ttc && ttc > 0) {
        problematicCount++;
        if (problematicExamples.length < 3) {
          problematicExamples.push({
            idTiquer: ticket.idTiquer,
            date: ticket.Date,
            time: ticket.HeureTicket,
            ttc,
            ht,
            tva: parseFloat(ticket.Totals?.Total_TVA || 0)
          });
        }
      }
    });

    console.log(`\n❌ Found ${problematicCount} problematic tickets where HT > TTC`);
    
    if (problematicExamples.length > 0) {
      console.log('\nExamples:');
      problematicExamples.forEach((ex, idx) => {
        console.log(`\n  ${idx + 1}. Ticket ${ex.idTiquer} (${ex.date} ${ex.time})`);
        console.log(`     TTC: ${ex.ttc}€, HT: ${ex.ht}€, TVA: ${ex.tva}€`);
      });
    }

    // Now check LAST CLOSURE DATE to understand the date range
    console.log(`\n${'='.repeat(100)}`);
    console.log(`CHECKING LAST CLOSURE (Z) FOR LIVE DATA CALCULATION`);
    console.log('='.repeat(100));

    const clotureCollection = db.collection('Cloture');
    const lastClosure = await clotureCollection.findOne(
      { IdCRM: idCRM },
      { sort: { IDCloture: -1 } }
    );

    if (lastClosure) {
      console.log(`\nLast Closure Found:`);
      console.log(`  IDCloture: ${lastClosure.IDCloture}`);
      console.log(`  Date_cloture: ${lastClosure.Date_cloture}`);
      console.log(`  HeureCloture: ${lastClosure.HeureCloture}`);
      
      // When "Live Data" is enabled, it uses dates AFTER this closure
      console.log(`\n📝 For Live Data mode:`);
      console.log(`  Data range: After ${lastClosure.Date_cloture} to NOW (April 3, 2026)`);
    } else {
      console.log('\n⚠️  No closure records found');
    }

    console.log('\n' + '='.repeat(100) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

checkLiveData();
