const { MongoClient } = require("mongodb");

const mongoUri = 'mongodb+srv://maksebstatistique:Makseb123.@cluster0.7879moy.mongodb.net/statistiques?retryWrites=true&w=majority';
const client = new MongoClient(mongoUri);

async function analyzeTicketStatus() {
  try {
    await client.connect();
    const db = client.db();
    
    console.log('\n' + '='.repeat(100));
    console.log('🔍 ANALYZING TICKET STATUS & FALLBACK LOGIC');
    console.log('='.repeat(100));

    const tiquerCollection = db.collection('Tiquer');
    const tickets = await tiquerCollection.find({ IdCRM: '9999', Date: '20260402' }).toArray();

    console.log(`\nFound ${tickets.length} tickets for store 9999 on 2026-04-02\n`);

    const statusMap = {};

    tickets.forEach((ticket, idx) => {
      const ttc = parseFloat(ticket.TTC || 0);
      const ht = parseFloat(ticket.Totals?.Total_Ht || 0);
      const tva = parseFloat(ticket.Totals?.Total_TVA || 0);
      const status = (ticket.status || 'UNKNOWN').toLowerCase().trim();

      // Track status distribution
      statusMap[status] = (statusMap[status] || 0) + 1;

      // Check if ticket would be counted as collected
      const isCollected = ['encaiser', 'collected', 'paid'].includes(status);
      const isCancelled = ['annuler', 'cancelled', 'cancel', 'cancled', 'canceled'].includes(status);
      const isRefunded = ['rembourser', 'refunded', 'refund'].includes(status);

      // Check fallback condition
      const sum = ht + tva;
      const difference = Math.abs(ttc - sum);
      const threshold = Math.max(0.05, ttc * 0.03);
      const wouldTriggerFallback = ttc > 0 && difference > threshold;

      console.log(`Ticket ${ticket.idTiquer}:`);
      console.log(`  Status: "${ticket.status || 'UNKNOWN'}" → normalized: "${status}"`);
      console.log(`  isCollected: ${isCollected}, isCancelled: ${isCancelled}, isRefunded: ${isRefunded}`);
      console.log(`  Financial:`);
      console.log(`    TTC: ${ttc}€`);
      console.log(`    HT: ${ht}€ (from Totals.Total_Ht)`);
      console.log(`    TVA: ${tva}€`);
      console.log(`  Fallback logic check:`);
      console.log(`    Sum (HT + TVA): ${sum}€`);
      console.log(`    Difference from TTC: ${difference.toFixed(3)}€`);
      console.log(`    Threshold: ${threshold.toFixed(3)}€`);
      console.log(`    Would trigger fallback? ${wouldTriggerFallback ? '✅ YES' : '❌ NO'}`);
      
      if (wouldTriggerFallback) {
        const inferredHT = ttc / 1.1;
        const inferredTVA = ttc - inferredHT;
        console.log(`    → Would use inferred: HT=${inferredHT.toFixed(3)}€, TVA=${inferredTVA.toFixed(3)}€`);
      } else {
        console.log(`    → Would NOT use fallback, uses actual: HT=${ht}€, TVA=${tva}€`);
        if (ht > ttc && ttc > 0) {
          console.log(`    ❌ PROBLEM: Uses corrupted data where HT > TTC!`);
        }
      }

      console.log();
    });

    console.log('\n' + '='.repeat(100));
    console.log('STATUS DISTRIBUTION:');
    console.log('='.repeat(100));
    Object.entries(statusMap).forEach(([status, count]) => {
      const normalized = 
        ['encaiser', 'collected', 'paid'].includes(status) ? 'COLLECTED' :
        ['annuler', 'cancelled', 'cancel', 'cancled', 'canceled'].includes(status) ? 'CANCELLED' :
        ['rembourser', 'refunded', 'refund'].includes(status) ? 'REFUNDED' :
        'UNKNOWN';
      
      console.log(`  "${status}" (${count} tickets) → Counted as: ${normalized}`);
    });

    console.log('\n' + '='.repeat(100) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

analyzeTicketStatus();
