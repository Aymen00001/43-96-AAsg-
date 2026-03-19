#!/usr/bin/env node

/**
 * Seed test data with new payment methods system
 * Creates 50 test tickets with various payment methods
 * Updated: March 19, 2026 - Uses English payment method keys
 */

const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
dotenv.config();

const mongoUri = 'mongodb+srv://maksebstatistique:Makseb123.@cluster0.7879moy.mongodb.net/statistiques?retryWrites=true&w=majority';
const client = new MongoClient(mongoUri);

// Payment methods - English keys with amounts for rotation
const PAYMENT_METHODS = ['CARD', 'CASH', 'MEAL_VOUCHER', 'CHECK', 'FIDELITY_POINTS', 'STORE_CREDIT', 'CORPORATE_ACCOUNT'];

// Consumption modes
const CONSUMPTION_MODES = ['Dine-in', 'Takeaway', 'Delivery'];

// Sample products
const PRODUCTS = [
  { name: 'Burger Classique', price: 12.50, category: 'Plat Principal' },
  { name: 'Sandwich Végétal', price: 10.00, category: 'Plat Principal' },
  { name: 'Salade Méditerranée', price: 9.50, category: 'Salade' },
  { name: 'Frites', price: 3.00, category: 'Accompagnement' },
  { name: 'Boisson Coca', price: 2.50, category: 'Boisson' },
  { name: 'Jus Frais', price: 3.50, category: 'Boisson' },
  { name: 'Dessert Chocolat', price: 5.00, category: 'Dessert' },
  { name: 'Crème Brûlée', price: 6.00, category: 'Dessert' }
];

function generateTestTicket(index, idCRM, date) {
  const ticketNumber = 2000 + index;
  const shift = Math.floor(index / 7) % 10; // Distribute shifts 0-9
  const paymentMethod = PAYMENT_METHODS[index % PAYMENT_METHODS.length];
  const consumptionMode = CONSUMPTION_MODES[index % CONSUMPTION_MODES.length];
  
  // Generate random products (2-4 items per ticket)
  const itemCount = 2 + Math.floor(Math.random() * 3);
  const items = [];
  let totalHT = 0;
  
  for (let i = 0; i < itemCount; i++) {
    const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    const quantity = 1 + Math.floor(Math.random() * 2);
    const subtotal = product.price * quantity;
    totalHT += subtotal;
    
    items.push({
      name: product.name,
      quantity,
      unite: 'pc',
      PrixUnitaire: product.price,
      TotalArticle: subtotal,
      categorie: product.category
    });
  }
  
  // Calculate taxes (20% VAT)
  const tax = parseFloat((totalHT * 0.20).toFixed(2));
  const totalTTC = parseFloat((totalHT + tax).toFixed(2));
  
  // Create payment methods array with new English keys
  const paymentMethods = [{
    payment_method: paymentMethod,
    amount: totalTTC
  }];
  
  // Generate time (format: HH:MM:SS)
  const hours = String(Math.floor(Math.random() * 24)).padStart(2, '0');
  const minutes = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  const seconds = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  const time = `${hours}:${minutes}:${seconds}`;
  
  return {
    _id: new (require('mongodb').ObjectId)(),
    IdCRM: idCRM,
    idTiquer: ticketNumber,
    idCommande: `CMD-${date}-${ticketNumber}`,
    Date: date,
    HeureTicket: time,
    Z: shift,
    closureNumber: shift.toString(),
    TTC: totalTTC,
    Montant_HT: totalHT,
    TVA: tax,
    Signature: `Server_${(index % 5) + 1}`,
    customerName: `Customer_${ticketNumber}`,
    ModeConsomation: consumptionMode,
    ConsumptionMode: consumptionMode,
    Articles: items,
    
    // Legacy format for compatibility
    ModePaiement: paymentMethod,
    
    // New format (recommended)
    PaymentMethods: paymentMethods,
    
    // Additional fields
    Totals: {
      Total_HT: totalHT,
      Total_TVA: tax,
      Total_TTC: totalTTC
    },
    
    status: 'completed',
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

async function seedTestData() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    const db = client.db('statistiques');
    const collection = db.collection('Tiquer');

    const idCRM = '1539874562';
    const date = '20260319'; // Today's date in YYYYMMDD format
    
    console.log('\n📋 Generating test data...');
    console.log(`  Store ID (idCRM): ${idCRM}`);
    console.log(`  Date: ${date}`);
    console.log(`  Payment Methods: ${PAYMENT_METHODS.join(', ')}`);
    console.log(`  Consumption Modes: ${CONSUMPTION_MODES.join(', ')}`);

    // Generate 50 test tickets
    const ticketsToSeed = [];
    for (let i = 0; i < 50; i++) {
      ticketsToSeed.push(generateTestTicket(i, idCRM, date));
    }

    console.log(`\n📊 Generated ${ticketsToSeed.length} test tickets`);

    // Insert tickets
    console.log('💾 Inserting tickets into database...');
    const result = await collection.insertMany(ticketsToSeed);

    console.log(`\n✅ Successfully inserted ${result.insertedIds.length} tickets`);
    console.log(`\n📈 Seed data summary:`);
    console.log(`  - Total tickets: ${ticketsToSeed.length}`);
    console.log(`  - Payment methods distribution:`);
    
    const methodCounts = {};
    PAYMENT_METHODS.forEach(method => {
      methodCounts[method] = ticketsToSeed.filter(t => t.PaymentMethods[0].payment_method === method).length;
      console.log(`    • ${method}: ${methodCounts[method]} tickets`);
    });
    
    console.log(`  - Shift distribution:`);
    for (let shift = 0; shift < 10; shift++) {
      const shiftCount = ticketsToSeed.filter(t => t.Z === shift).length;
      if (shiftCount > 0) {
        console.log(`    • Shift ${shift}: ${shiftCount} tickets`);
      }
    }
    
    console.log(`\n🎯 Test store ID: ${idCRM}`);
    console.log(`✨ Seed complete!`);

  } catch (error) {
    console.error('\n❌ Error seeding data:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✔️ Connection closed');
  }
}

seedTestData();
