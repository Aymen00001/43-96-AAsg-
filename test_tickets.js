const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:8002';
const STORE_ID = '1539874562';
const TODAY_DATE = '20260319'; // YYYYMMDD format

// Helper to create a ticket object
function createTicket(ticketNum, closureNumber) {
  return {
    IdCRM: STORE_ID,
    Date: TODAY_DATE,
    idTiquer: ticketNum.toString(),
    HeureTicket: `${String(8 + Math.floor(ticketNum / 3)).padStart(2, '0')}:${String((ticketNum % 60) * 2).padStart(2, '0')}`,
    TTC: Math.round((20 + Math.random() * 80) * 100) / 100,
    currency: '€',
    merchant_name: 'TEST RESTAURANT',
    merchant_address: '123 TEST STREET',
    SIRET: '12345678901234',
    Z: closureNumber, // Closure number / shift
    ConsumptionMode: ['Dine-in', 'Takeaway', 'Delivery'][ticketNum % 3],
    Menu: [
      {
        NameProduct: `MENU ${ticketNum}`,
        TTC: Math.round((15 + Math.random() * 50) * 100) / 100,
        QtyProduct: 1,
      }
    ],
    PaymentMethods: [
      {
        payment_method: ['CASH', 'CARD', 'CHECK'][ticketNum % 3],
        amount: Math.round((20 + Math.random() * 80) * 100) / 100,
      }
    ],
    Totals: {
      Total_Ht: Math.round((15 + Math.random() * 70) * 100) / 100,
      Total_TVA: Math.round((3 + Math.random() * 10) * 100) / 100,
      Total_TTC: Math.round((20 + Math.random() * 80) * 100) / 100,
    },
  };
}

// Main function
async function postTickets() {
  console.log('🎫 Starting ticket posting test...\n');
  console.log(`Store ID: ${STORE_ID}`);
  console.log(`Date: ${TODAY_DATE}`);
  console.log(`Creating 20 tickets with closure numbers 0-19\n`);

  const closureNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

  let successCount = 0;
  let failureCount = 0;
  const results = [];

  for (let i = 1; i <= 20; i++) {
    const closureNum = closureNumbers[i - 1];
    const ticket = createTicket(i, closureNum);

    try {
      console.log(`[${i}/20] Posting ticket ${i} (Closure: ${closureNum})...`);
      
      const response = await axios.post(`${API_BASE}/update-ticket`, ticket, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      console.log(`  ✅ Success - ID: ${response.data._id || 'N/A'}`);
      successCount++;
      results.push({
        ticketNum: i,
        closure: closureNum,
        status: 'success',
        amount: ticket.TTC,
      });
    } catch (error) {
      console.log(`  ❌ Failed - ${error.response?.data?.error || error.message}`);
      failureCount++;
      results.push({
        ticketNum: i,
        closure: closureNum,
        status: 'failed',
        error: error.response?.data?.error || error.message,
      });
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 TEST SUMMARY');
  console.log(`${'='.repeat(80)}`);
  console.log(`✅ Successful: ${successCount}/20`);
  console.log(`❌ Failed: ${failureCount}/20`);

  // Group by closure number
  const byShift = {};
  results.forEach(r => {
    if (!byShift[r.closure]) byShift[r.closure] = [];
    byShift[r.closure].push(r);
  });

  console.log(`\n📋 Breakdown by Shift:`);
  Object.keys(byShift).sort((a, b) => a - b).forEach(shift => {
    const shiftTickets = byShift[shift];
    const successInShift = shiftTickets.filter(t => t.status === 'success').length;
    console.log(`  Shift ${shift}: ${successInShift}/${shiftTickets.length} tickets`);
  });

  console.log(`\n${'='.repeat(80)}`);
  console.log('Test Complete! 🎉\n');
  console.log('Next Steps:');
  console.log('1. Navigate to Dashboard to see the new tickets');
  console.log('2. Use "Filter by Shift" dropdown to filter by closure number');
  console.log('3. Click "Shifts" in sidebar to see shift summary page');
  console.log('4. Check API: GET /get-tickets?idCRM=1539874562&date1=20260319&date2=20260319&closureNumber=0');
}

postTickets().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
