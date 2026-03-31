#!/usr/bin/env node

/**
 * Seed test data for idCRM "9999"
 * Creates 100+ test tickets across the date range March 1-30, 2026
 * For testing get-tickets endpoint
 */

const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
dotenv.config();

const mongoUri = 'mongodb+srv://maksebstatistique:Makseb123.@cluster0.7879moy.mongodb.net/statistiques?retryWrites=true&w=majority';
const client = new MongoClient(mongoUri);

// Payment methods - English keys
const PAYMENT_METHODS = ['CARD', 'CASH', 'MEAL_VOUCHER', 'CHECK'];

// Consumption modes
const CONSUMPTION_MODES = ['Sur Place', 'À Emporter', 'Livraison'];

// Sample products (Poke-style restaurant)
const PRODUCTS = [
  { name: 'POKE_SIGNATURE', price: 12.50, qty: 1 },
  { name: 'POKE_A_COMPOSER_', price: 13.25, qty: 1 },
  { name: 'FORMULES_', price: 15.00, qty: 1 },
  { name: 'SANDWICH_', price: 8.90, qty: 1 },
  { name: 'BOISSON_PAYANTE_', price: 1.42, qty: 1 },
  { name: 'BOISSON', price: 2.00, qty: 1 },
  { name: 'DESSERT', price: 2.90, qty: 1 },
];

function generateTestTicket(index, idCRM, date, time) {
  const ticketNumber = 1000 + index;
  const paymentMethod = PAYMENT_METHODS[index % PAYMENT_METHODS.length];
  const consumptionMode = CONSUMPTION_MODES[index % CONSUMPTION_MODES.length];
  
  // Add some cancelled and refunded tickets for testing
  let status = 'Encaiser';
  if (index % 20 === 0) status = 'Annuler';  // Every 20th ticket is cancelled
  if (index % 25 === 0) status = 'Rembourser';  // Every 25th ticket is refunded
  
  // Generate 1-3 items per ticket
  const itemCount = 1 + Math.floor(Math.random() * 3);
  const items = [];
  let totalHT = 0;
  
  for (let i = 0; i < itemCount; i++) {
    const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    const quantity = product.qty;
    const subtotal = product.price * quantity;
    totalHT += subtotal;
    
    items.push({
      name: product.name,
      Quantite: quantity,
      Prix: product.price,
      Total: subtotal
    });
  }
  
  // Calculate taxes (10% VAT for simplicity)
  const tax = parseFloat((totalHT * 0.10).toFixed(2));
  const totalTTC = parseFloat((totalHT + tax).toFixed(2));
  
  const paymentMethods = [{
    payment_method: paymentMethod,
    amount: totalTTC
  }];
  
  return {
    _id: new (require('mongodb').ObjectId)(),
    IdCRM: idCRM,
    idTiquer: String(ticketNumber),
    idCommande: `ORD-${date}-${ticketNumber}`,
    Date: date,
    HeureTicket: time,
    TTC: totalTTC,
    Montant_HT: totalHT,
    TVA: tax,
    Signature: `Cashier_${(index % 3) + 1}`,
    customerName: `Customer_${index}`,
    ModeConsomation: consumptionMode,
    ConsumptionMode: consumptionMode,
    Articles: items,
    
    // Payment info
    ModePaiement: paymentMethod,
    PaymentMethods: paymentMethods,
    
    // Totals
    Totals: {
      Total_HT: totalHT,
      Total_TVA: tax,
      Total_TTC: totalTTC
    },
    
    status: status,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function generateTimeString() {
  const hours = String(Math.floor(Math.random() * 24)).padStart(2, '0');
  const minutes = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  const seconds = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

async function seedTestData() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    const db = client.db('statistiques');
    const collection = db.collection('Tiquer');

    const idCRM = '9999';
    
    console.log('\n📋 Generating test data for idCRM "9999"...');
    console.log(`  Store ID: ${idCRM}`);
    console.log(`  Date Range: 20260301 to 20260330`);
    console.log(`  Payment Methods: ${PAYMENT_METHODS.join(', ')}`);
    console.log(`  Consumption Modes: ${CONSUMPTION_MODES.join(', ')}`);
    console.log(`  Note: Z (shift/closure) field removed - managed separately in Cloture collection`);

    const ticketsToSeed = [];
    let ticketIndex = 0;

    // Generate tickets for each day (March 1-30, 2026)
    for (let day = 1; day <= 30; day++) {
      const dateStr = `202603${String(day).padStart(2, '0')}`;
      
      // Generate 3-5 tickets per day
      const ticketsPerDay = 3 + Math.floor(Math.random() * 3);
      
      for (let t = 0; t < ticketsPerDay; t++) {
        const time = generateTimeString();
        ticketsToSeed.push(generateTestTicket(ticketIndex, idCRM, dateStr, time));
        ticketIndex++;
      }
    }

    console.log(`\n📊 Generated ${ticketsToSeed.length} test tickets`);

    // Delete existing tickets for this store first
    console.log(`\n🗑️  Removing existing tickets for store ${idCRM}...`);
    const deleteResult = await collection.deleteMany({ IdCRM: idCRM });
    console.log(`  Deleted ${deleteResult.deletedCount} existing tickets`);

    // Insert new tickets
    console.log('\n💾 Inserting tickets into database...');
    const result = await collection.insertMany(ticketsToSeed);

    console.log(`\n✅ Successfully inserted ${result.insertedIds.length} tickets`);
    
    console.log(`\n📈 Seed data summary:`);
    console.log(`  - Total tickets: ${ticketsToSeed.length}`);
    console.log(`  - Date range: 20260301 to 20260330 (30 days)`);
    console.log(`  - Average tickets per day: ${(ticketsToSeed.length / 30).toFixed(1)}`);
    
    console.log(`\n  Payment method distribution:`);
    const methodCounts = {};
    PAYMENT_METHODS.forEach(method => {
      methodCounts[method] = ticketsToSeed.filter(t => t.PaymentMethods[0].payment_method === method).length;
      const percentage = ((methodCounts[method] / ticketsToSeed.length) * 100).toFixed(1);
      console.log(`    • ${method}: ${methodCounts[method]} tickets (${percentage}%)`);
    });
    
    console.log(`\n  Z (shift) distribution:`);
    const zCounts = {};
    for (let z = 1; z <= 20; z++) {
      const count = ticketsToSeed.filter(t => t.Z === z).length;
      if (count > 0) {
        zCounts[z] = count;
      }
    }
    Object.entries(zCounts).forEach(([z, count]) => {
      console.log(`    • Z ${z}: ${count} tickets`);
    });
    
    console.log(`\n  Consumption mode distribution:`);
    CONSUMPTION_MODES.forEach(mode => {
      const count = ticketsToSeed.filter(t => t.ConsumptionMode === mode).length;
      const percentage = ((count / ticketsToSeed.length) * 100).toFixed(1);
      console.log(`    • ${mode}: ${count} tickets (${percentage}%)`);
    });

    // Calculate total sales
    const totalSales = ticketsToSeed.reduce((sum, t) => sum + t.TTC, 0);
    const totalHT = ticketsToSeed.reduce((sum, t) => sum + t.Montant_HT, 0);
    const totalTax = ticketsToSeed.reduce((sum, t) => sum + t.TVA, 0);
    
    console.log(`\n  Financial summary:`);
    console.log(`    • Total Sales (TTC): €${totalSales.toFixed(2)}`);
    console.log(`    • Total HT: €${totalHT.toFixed(2)}`);
    console.log(`    • Total Tax: €${totalTax.toFixed(2)}`);
    console.log(`    • Average transaction: €${(totalSales / ticketsToSeed.length).toFixed(2)}`);

    console.log(`\n🎯 Test store: idCRM = "9999"`);
    console.log(`📍 Ready to test:`);
    console.log(`   GET http://localhost:8002/get-tickets?idCRM=9999&date1=20260301&date2=20260330&page=1&limit=25`);
    console.log(`   GET http://localhost:8002/get-sales-summary?idCRM=9999&date1=20260301&date2=20260330`);
    console.log(`\n✨ Seed complete!`);

  } catch (error) {
    console.error('\n❌ Error seeding data:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✔️ Connection closed');
  }
}

seedTestData();
