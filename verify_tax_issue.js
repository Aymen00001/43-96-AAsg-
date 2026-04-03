const { MongoClient } = require("mongodb");

const mongoUri = 'mongodb+srv://maksebstatistique:Makseb123.@cluster0.7879moy.mongodb.net/statistiques?retryWrites=true&w=majority';
const client = new MongoClient(mongoUri);

async function verifyTaxIssue() {
  try {
    await client.connect();
    const db = client.db();
    
    console.log('\n' + '='.repeat(100));
    console.log('🔍 VERIFYING TAX ISSUE - Database Inspection');
    console.log('='.repeat(100));

    // Get from dashboard date range: 2026-02-04 to 2026-03-04
    const date1 = '20260204';
    const date2 = '20260304';
    const idCRM = '2264'; // From dashboard screenshot

    console.log(`\n📅 Querying for date range: ${date1} to ${date2}`);
    console.log(`🏪 Store ID (IdCRM): ${idCRM}`);

    // ===== CHECK LIVESTATS COLLECTION =====
    console.log('\n' + '='.repeat(100));
    console.log('1️⃣  CHECKING LIVESTATS COLLECTION (aggregated/closure data)');
    console.log('='.repeat(100));

    const livestatsCollection = db.collection('livestats');
    
    const livestatsData = await livestatsCollection.find({
      IdCRM: idCRM,
      date: { $gte: date1, $lte: date2 }
    }).toArray();

    console.log(`\n📊 Found ${livestatsData.length} livestats records`);
    
    if (livestatsData.length > 0) {
      console.log('\n📋 LIVESTATS Records Details:');
      livestatsData.forEach((record, idx) => {
        console.log(`\n  Record ${idx + 1}:`);
        console.log(`  ├─ Date: ${record.date}`);
        console.log(`  ├─ ChiffreAffaire:`);
        if (record.ChiffreAffaire) {
          console.log(`  │  ├─ Total_TTC: ${record.ChiffreAffaire.Total_TTC}`);
          console.log(`  │  ├─ Total_HT: ${record.ChiffreAffaire.Total_HT}`);
          console.log(`  │  └─ Total_TVA: ${record.ChiffreAffaire.Total_TVA || record.ChiffreAffaire.TVA}`);
        } else {
          console.log(`  │  └─ (No ChiffreAffaire field)`);
        }
        
        // Check the relationship
        if (record.ChiffreAffaire?.Total_TTC && record.ChiffreAffaire?.Total_HT) {
          const ttc = parseFloat(record.ChiffreAffaire.Total_TTC);
          const ht = parseFloat(record.ChiffreAffaire.Total_HT);
          const relationship = ttc > ht ? '✅ CORRECT (TTC > HT)' : '❌ WRONG (HT >= TTC)';
          console.log(`  │  └─ Relationship: ${relationship}`);
        }
      });

      // Calculate totals
      let totalTTC = 0;
      let totalHT = 0;
      let totalTVA = 0;

      livestatsData.forEach(record => {
        if (record.ChiffreAffaire) {
          totalTTC += parseFloat(record.ChiffreAffaire.Total_TTC || 0);
          totalHT += parseFloat(record.ChiffreAffaire.Total_HT || 0);
          totalTVA += parseFloat(record.ChiffreAffaire.Total_TVA || record.ChiffreAffaire.TVA || 0);
        }
      });

      console.log(`\n📈 LIVESTATS AGGREGATED TOTALS:`);
      console.log(`  ├─ Total_TTC (with tax): ${totalTTC.toFixed(2)}€`);
      console.log(`  ├─ Total_HT (without tax): ${totalHT.toFixed(2)}€`);
      console.log(`  ├─ Total_TVA (tax amount): ${totalTVA.toFixed(2)}€`);
      console.log(`  └─ Calculated Tax (TTC - HT): ${(totalTTC - totalHT).toFixed(2)}€`);

      if (totalTTC < totalHT) {
        console.log(`\n❌ ISSUE CONFIRMED: HT (${totalHT.toFixed(2)}€) is GREATER than TTC (${totalTTC.toFixed(2)}€)`);
        console.log(`   This creates NEGATIVE tax: ${(totalTTC - totalHT).toFixed(2)}€`);
      }
    } else {
      console.log('⚠️  No livestats records found - checking Tiquer collection...');
    }

    // ===== CHECK TIQUER COLLECTION =====
    console.log('\n' + '='.repeat(100));
    console.log('2️⃣  CHECKING TIQUER COLLECTION (raw transaction data)');
    console.log('='.repeat(100));

    const tiquerCollection = db.collection('Tiquer');
    
    const tiquerData = await tiquerCollection.find({
      IdCRM: idCRM,
      Date: { $gte: date1, $lte: date2 }
    }).limit(10).toArray();

    console.log(`\n📊 Found tickets (showing first 10):`);
    
    if (tiquerData.length > 0) {
      let totalTTC = 0;
      let totalHT = 0;
      let totalTVA = 0;
      let itemCount = 0;

      tiquerData.forEach((ticket, idx) => {
        console.log(`\n  Ticket ${idx + 1}:`);
        console.log(`  ├─ idTiquer: ${ticket.idTiquer}`);
        console.log(`  ├─ Date: ${ticket.Date}, Time: ${ticket.HeureTicket}`);
        console.log(`  ├─ TTC (from main field): ${ticket.TTC}`);
        
        if (ticket.Totals) {
          console.log(`  ├─ Totals object:`);
          console.log(`  │  ├─ Total_Ht: ${ticket.Totals.Total_Ht}`);
          console.log(`  │  ├─ Total_TVA: ${ticket.Totals.Total_TVA}`);
          console.log(`  │  └─ Total_TTC: ${ticket.Totals.Total_TTC}`);

          const ht = parseFloat(ticket.Totals.Total_Ht || 0);
          const ttc = parseFloat(ticket.TTC || ticket.Totals.Total_TTC || 0);
          const tva = parseFloat(ticket.Totals.Total_TVA || 0);

          const relationship = ttc > ht ? '✅ CORRECT' : '❌ WRONG';
          console.log(`  └─ Relationship (TTC > HT): ${relationship}`);

          totalTTC += ttc;
          totalHT += ht;
          totalTVA += tva;
          itemCount++;
        }
      });

      console.log(`\n📈 TIQUER RAW DATA TOTALS (${itemCount} tickets):`);
      console.log(`  ├─ Total TTC: ${totalTTC.toFixed(2)}€`);
      console.log(`  ├─ Total HT: ${totalHT.toFixed(2)}€`);
      console.log(`  ├─ Total TVA: ${totalTVA.toFixed(2)}€`);
      console.log(`  └─ Calculated Tax (TTC - HT): ${(totalTTC - totalHT).toFixed(2)}€`);

      if (totalTTC > 0 && totalTTC > totalHT) {
        console.log(`\n✅ Raw tickets data is CORRECT: TTC (${totalTTC.toFixed(2)}€) > HT (${totalHT.toFixed(2)}€)`);
      }
    } else {
      console.log('⚠️  No Tiquer records found');
    }

    // ===== DIAGNOSIS =====
    console.log('\n' + '='.repeat(100));
    console.log('🔬 DIAGNOSIS');
    console.log('='.repeat(100));

    if (livestatsData.length > 0) {
      let livestatsHasBadData = false;
      livestatsData.forEach(record => {
        if (record.ChiffreAffaire) {
          const ttc = parseFloat(record.ChiffreAffaire.Total_TTC || 0);
          const ht = parseFloat(record.ChiffreAffaire.Total_HT || 0);
          if (ht >= ttc && ttc > 0) {
            livestatsHasBadData = true;
          }
        }
      });

      if (livestatsHasBadData) {
        console.log('\n❌ CONCLUSION: livestats collection contains SWAPPED or INCORRECT values');
        console.log('   Total_HT and Total_TTC appear to be reversed or miscalculated');
        console.log('\n🔧 Possible causes:');
        console.log('   1. Livestats records were created with a bug that swapped HT ↔ TTC');
        console.log('   2. Historical data was imported with reversed values');
        console.log('   3. A previous aggregation calculation put values in wrong fields');
      } else {
        console.log('\n✅ livestats data appears CORRECT');
      }
    }

    console.log('\n' + '='.repeat(100) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

verifyTaxIssue();
