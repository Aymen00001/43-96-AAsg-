#!/usr/bin/env node

/**
 * Delete all tickets with idCRM 1539874562
 * Usage: node delete-test-tickets.js
 */

const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
dotenv.config();

const mongoUri = 'mongodb+srv://maksebstatistique:Makseb123.@cluster0.7879moy.mongodb.net/statistiques?retryWrites=true&w=majority';
const client = new MongoClient(mongoUri);

async function deleteTestTickets() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    const db = client.db('statistiques');
    const collection = db.collection('Tiquer');

    console.log('🔍 Finding tickets with idCRM: 1539874562...');
    const query = { IdCRM: '1539874562' };
    const count = await collection.countDocuments(query);

    if (count === 0) {
      console.log('ℹ️  No tickets found with idCRM 1539874562');
      return;
    }

    console.log(`📊 Found ${count} tickets to delete`);
    console.log('⚠️  Deleting tickets...');

    const result = await collection.deleteMany(query);

    console.log(`✅ Successfully deleted ${result.deletedCount} tickets`);
    console.log(`📋 Details:
  - Matched: ${result.deletedCount}
  - Deleted: ${result.deletedCount}`);

    // Verify deletion
    const remaining = await collection.countDocuments(query);
    console.log(`✔️ Verification: ${remaining} tickets remaining with idCRM 1539874562`);

  } catch (error) {
    console.error('❌ Error deleting tickets:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('✨ Connection closed');
  }
}

deleteTestTickets();
