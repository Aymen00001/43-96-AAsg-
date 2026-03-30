#!/usr/bin/env node

/**
 * Seed Cloture (closure/Z records) test data for idCRM "9999"
 * Creates closure records for testing shift management
 */

const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
dotenv.config();

const mongoUri = 'mongodb+srv://maksebstatistique:Makseb123.@cluster0.7879moy.mongodb.net/statistiques?retryWrites=true&w=majority';
const client = new MongoClient(mongoUri);

function generateTimeString() {
  const hours = String(Math.floor(Math.random() * 24)).padStart(2, '0');
  const minutes = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  const seconds = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

async function seedClotureData() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    const db = client.db('statistiques');
    const collection = db.collection('Cloture');

    const idCRM = '9999';
    
    console.log('\n📋 Generating Cloture (closure/Z) test data for idCRM "9999"...');
    console.log(`  Store ID: ${idCRM}`);
    console.log(`  Date Range: March 1-30, 2026`);

    const closuresToSeed = [];
    
    // Generate 10 closures spread across the date range
    // Each closure represents approximately ~12-13 tickets
    for (let i = 1; i <= 10; i++) {
      const day = Math.ceil((i / 10) * 30); // Spread across 30 days
      const dateStr = `202603${String(day).padStart(2, '0')}`;
      
      // Parse date for Date_cloture
      const year = 2026;
      const month = 3;
      const dayNum = day;
      const closureDate = new Date(year, month - 1, dayNum);
      
      // Random time between 17:00 and 23:00 (typical closing times)
      const hour = 17 + Math.floor(Math.random() * 6);
      const minute = Math.floor(Math.random() * 60);
      const second = Math.floor(Math.random() * 60);
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
      
      // Approximate sales per closure (based on 124 tickets total ÷ 10 closures ≈ 12.4 tickets per closure)
      // Average ticket is €16.65, so ~€206 per closure, let's vary it
      const baseRecette = 206;
      const variance = 50 + Math.floor(Math.random() * 100); // ±€50-100
      const recette = Math.round((baseRecette + variance) * 100) / 100;
      
      const closure = {
        IDCloture: i,
        Date_cloture: closureDate,
        HeureCloture: timeStr,
        User: `Cashier_${(i % 3) + 1}`,
        RECETTE: recette,
        RETRAIT: Math.round((recette * 0.1) * 100) / 100, // 10% withdrawal
        ajout: 0,
        IdCRM: idCRM,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      closuresToSeed.push(closure);
    }

    console.log(`\n📊 Generated ${closuresToSeed.length} closure records`);

    // Delete existing closures for this store first
    console.log(`\n🗑️  Removing existing closure records for store ${idCRM}...`);
    const deleteResult = await collection.deleteMany({ IdCRM: idCRM });
    console.log(`  Deleted ${deleteResult.deletedCount} existing closure records`);

    // Insert new closures
    console.log('\n💾 Inserting closure records into database...');
    const result = await collection.insertMany(closuresToSeed);

    console.log(`\n✅ Successfully inserted ${result.insertedIds.length} closure records`);
    
    console.log(`\n📈 Cloture data summary:`);
    
    const totalRecette = closuresToSeed.reduce((sum, c) => sum + c.RECETTE, 0);
    const totalRetrait = closuresToSeed.reduce((sum, c) => sum + c.RETRAIT, 0);
    
    console.log(`  - Total closures: ${closuresToSeed.length}`);
    console.log(`  - Date range: 20260301 to 20260330 (30 days)`);
    console.log(`  - Total RECETTE (sales): €${totalRecette.toFixed(2)}`);
    console.log(`  - Total RETRAIT (withdrawals): €${totalRetrait.toFixed(2)}`);
    console.log(`  - Average per closure: €${(totalRecette / closuresToSeed.length).toFixed(2)}`);
    
    console.log(`\n📝 Closure details:`);
    closuresToSeed.forEach((c, idx) => {
      console.log(`  Z ${c.IDCloture}: ${c.Date_cloture.toDateString()} @ ${c.HeureCloture} - €${c.RECETTE.toFixed(2)} (${c.User})`);
    });

    console.log('\n✨ Cloture seed completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding Cloture data:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedClotureData();
