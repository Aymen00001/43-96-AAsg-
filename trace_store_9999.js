const { MongoClient } = require("mongodb");

const mongoUri = 'mongodb+srv://maksebstatistique:Makseb123.@cluster0.7879moy.mongodb.net/statistiques?retryWrites=true&w=majority';
const client = new MongoClient(mongoUri);

async function traceStore9999() {
  try {
    await client.connect();
    const db = client.db();
    
    console.log('\n' + '='.repeat(100));
    console.log('🔍 TRACING STORE 9999 - From Database');
    console.log('='.repeat(100));

    const idCRM = '9999';

    // 1. Check livestats for store 9999
    console.log('\n1️⃣  LIVESTATS COLLECTION (Aggregated Data)');
    console.log('-'.repeat(100));

    const livestatsCollection = db.collection('livestats');
    const livestatsRecords = await livestatsCollection.find({ IdCRM: idCRM })
      .sort({ date: -1 })
      .limit(10)
      .toArray();

    console.log(`Found ${livestatsRecords.length} records for IdCRM='9999'\n`);

    if (livestatsRecords.length > 0) {
      console.log('Most Recent 10 Records:');
      
      let hasNegativeTax = false;
      
      livestatsRecords.forEach((record, idx) => {
        console.log(`\n  Record ${idx + 1} - Date: ${record.date}`);
        
        if (record.ChiffreAffaire) {
          const ttc = record.ChiffreAffaire.Total_TTC || 0;
          const ht = record.ChiffreAffaire.Total_HT || 0;
          let tva = record.ChiffreAffaire.Total_TVA || record.ChiffreAffaire.TVA || 0;
          
          const calculatedTax = ttc - ht;
          
          console.log(`    ChiffreAffaire:`);
          console.log(`    ├─ Total_TTC: ${ttc}`);
          console.log(`    ├─ Total_HT: ${ht}`);
          console.log(`    ├─ Total_TVA/TVA field: ${tva}`);
          console.log(`    └─ Calculated Tax (TTC - HT): ${calculatedTax.toFixed(2)}€`);
          
          if (calculatedTax < 0) {
            console.log(`    ❌ NEGATIVE TAX DETECTED!`);
            hasNegativeTax = true;
          }
        } else {
          console.log(`    ❌ NO ChiffreAffaire field!`);
        }

        // Show other breakdown data
        if (record.modePaiement) {
          console.log(`    Payment methods: ${JSON.stringify(record.modePaiement)}`);
        }
        if (record.modeConsommation) {
          console.log(`    Fulfillment modes: ${JSON.stringify(record.modeConsommation)}`);
        }
      });

      if (hasNegativeTax) {
        console.log(`\n⚠️  FOUND RECORDS WITH NEGATIVE TAX FOR STORE 9999!`);
      }
    } else {
      console.log('❌ No livestats records found for store 9999');
    }

    // 2. Check Tiquer collection for store 9999
    console.log('\n\n2️⃣  TIQUER COLLECTION (Raw Tickets)');
    console.log('-'.repeat(100));

    const tiquerCollection = db.collection('Tiquer');
    const tiquerCount = await tiquerCollection.countDocuments({ IdCRM: idCRM });
    
    console.log(`Total tickets for IdCRM='9999': ${tiquerCount}`);

    if (tiquerCount > 0) {
      const tiquerSamples = await tiquerCollection.find({ IdCRM: idCRM })
        .sort({ Date: -1 })
        .limit(5)
        .toArray();

      console.log(`\nRecent tickets (showing 5 most recent):\n`);

      let problemCount = 0;
      
      tiquerSamples.forEach((ticket, idx) => {
        console.log(`  Ticket ${idx + 1}:`);
        console.log(`    ├─ idTiquer: ${ticket.idTiquer}`);
        console.log(`    ├─ Date: ${ticket.Date}, Time: ${ticket.HeureTicket}`);
        console.log(`    ├─ TTC (main): ${ticket.TTC}`);

        if (ticket.Totals) {
          const ht = parseFloat(ticket.Totals.Total_Ht || 0);
          const ttc = parseFloat(ticket.TTC || ticket.Totals.Total_TTC || 0);
          const tva = parseFloat(ticket.Totals.Total_TVA || 0);
          
          console.log(`    ├─ Totals:`);
          console.log(`    │  ├─ Total_Ht: ${ht}`);
          console.log(`    │  ├─ Total_TVA: ${tva}`);
          console.log(`    │  └─ Total_TTC: ${ticket.Totals.Total_TTC}`);
          
          if (ht > ttc && ttc > 0) {
            console.log(`    │  ❌ PROBLEM: HT (${ht}) > TTC (${ttc})`);
            problemCount++;
          }
        } else {
          console.log(`    ├─ Totals: MISSING`);
        }
        
        console.log(`    └─ Status: ${ticket.status || 'UNKNOWN'}`);
      });

      if (problemCount > 0) {
        console.log(`\n⚠️  Found ${problemCount} tickets with HT > TTC (indicates field swap)`);
      }
    }

    // 3. Check Cloture/Z records
    console.log('\n\n3️⃣  CLOTURE (Closure/Z Records)');
    console.log('-'.repeat(100));

    const clotureCollection = db.collection('Cloture');
    const closures = await clotureCollection.find({ IdCRM: idCRM })
      .sort({ IDCloture: -1 })
      .limit(5)
      .toArray();

    console.log(`Found ${closures.length} closure records\n`);
    
    if (closures.length > 0) {
      closures.forEach((closure, idx) => {
        console.log(`  Closure ${idx + 1}:`);
        console.log(`    ├─ IDCloture: ${closure.IDCloture}`);
        console.log(`    ├─ Date: ${closure.Date_cloture}`);
        console.log(`    ├─ Time: ${closure.HeureCloture}`);
        console.log(`    ├─ RECETTE: ${closure.RECETTE}`);
        console.log(`    ├─ RETRAIT: ${closure.RETRAIT}`);
        console.log(`    └─ User: ${closure.User}`);
      });
    }

    // 4. Calculate aggregates
    console.log('\n\n4️⃣  AGGREGATED ANALYSIS FOR STORE 9999');
    console.log('-'.repeat(100));

    const allLivestatData = await livestatsCollection.find({ IdCRM: idCRM }).toArray();
    
    if (allLivestatData.length > 0) {
      let totalTTC = 0;
      let totalHT = 0;
      let totalTVA = 0;

      allLivestatData.forEach(record => {
        if (record.ChiffreAffaire) {
          totalTTC += parseFloat(record.ChiffreAffaire.Total_TTC || 0);
          totalHT += parseFloat(record.ChiffreAffaire.Total_HT || 0);
          totalTVA += parseFloat(record.ChiffreAffaire.Total_TVA || record.ChiffreAffaire.TVA || 0);
        }
      });

      console.log(`\nTotal across ${allLivestatData.length} livestats records:\n`);
      console.log(`  Total_TTC: ${totalTTC.toFixed(2)}€`);
      console.log(`  Total_HT: ${totalHT.toFixed(2)}€`);
      console.log(`  Total_TVA: ${totalTVA.toFixed(2)}€`);
      console.log(`  Calculated Tax (TTC - HT): ${(totalTTC - totalHT).toFixed(2)}€`);
      
      const calculatedTax = totalTTC - totalHT;
      
      if (calculatedTax < 0) {
        console.log(`\n❌ NEGATIVE TAX CONFIRMED for StorE 9999!`);
        console.log(`   The livestats records have HT > TTC`);
        console.log(`   This suggests the fields were swapped during aggregation`);
      } else if (Math.abs(calculatedTax - totalTVA) > 0.5) {
        console.log(`\n⚠️  Mismatch between calculated tax and TVA field:`);
        console.log(`   Calculated: ${calculatedTax.toFixed(2)}€`);
        console.log(`   TVA field: ${totalTVA.toFixed(2)}€`);
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

traceStore9999();
