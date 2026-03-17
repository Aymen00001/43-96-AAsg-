const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
dotenv.config();

const mongoUri = 'mongodb+srv://maksebstatistique:Makseb123.@cluster0.7879moy.mongodb.net/statistiques?retryWrites=true&w=majority';
const client = new MongoClient(mongoUri);

async function checkDates() {
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection('Tiquer');

    const idCRM = 2435;

    console.log("\n╔════════════════════════════════════════════════════════╗");
    console.log("║     Checking Tiquer Collection for IdCRM = 2435      ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");

    // Count total documents for this IdCRM
    const totalCount = await collection.countDocuments({ IdCRM: String(idCRM) });
    console.log(`📊 Total tickets for IdCRM ${idCRM}: ${totalCount}\n`);

    // Find min and max dates using aggregation
    const dateStats = await collection.aggregate([
      { $match: { IdCRM: String(idCRM) } },
      {
        $group: {
          _id: null,
          minDate: { $min: "$Date" },
          maxDate: { $max: "$Date" }
        }
      }
    ]).toArray();

    if (dateStats.length > 0 && dateStats[0].minDate) {
      const minDate = dateStats[0].minDate;
      const maxDate = dateStats[0].maxDate;
      console.log(`📅 Date Range:`);
      console.log(`   Min: ${minDate} (${formatDate(minDate)})`);
      console.log(`   Max: ${maxDate} (${formatDate(maxDate)})\n`);
    }

    // Get all distinct dates
    const distinctDates = await collection.distinct("Date", { IdCRM: String(idCRM) });
    const sortedDates = distinctDates.sort();
    console.log(`📆 Total distinct dates: ${sortedDates.length}`);
    console.log(`   Dates: ${sortedDates.map(d => formatDate(d)).join(", ")}\n`);

    // Sample 3 tickets
    console.log("🎫 Sample 3 Tickets:\n");
    const samples = await collection.find({ IdCRM: String(idCRM) })
      .project({
        IdCRM: 1,
        Date: 1,
        idTiquer: 1,
        HeureTicket: 1,
        NomSociete: 1,
        Totals: 1
      })
      .limit(3)
      .toArray();

    samples.forEach((ticket, index) => {
      console.log(`   Ticket ${index + 1}:`);
      console.log(`   ├─ IdCRM: ${ticket.IdCRM}`);
      console.log(`   ├─ Date: ${ticket.Date} (${formatDate(ticket.Date)})`);
      console.log(`   ├─ idTiquer: ${ticket.idTiquer}`);
      console.log(`   ├─ HeureTicket: ${ticket.HeureTicket}`);
      console.log(`   ├─ NomSociete: ${ticket.NomSociete || 'N/A'}`);
      console.log(`   └─ Total: ${ticket.Totals ? ticket.Totals.Total_TTC : 'N/A'}`);
      console.log();
    });

    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║                    Query Complete                    ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.close();
  }
}

function formatDate(dateStr) {
  if (!dateStr || dateStr.length !== 8) return dateStr;
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return `${day}/${month}/${year}`;
}

checkDates();
