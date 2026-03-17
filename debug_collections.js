const { connectToDatabase, client } = require('./config/dbConfig.js');

async function investigateCollections() {
  try {
    console.log('\n========================================');
    console.log('MONGODB DATABASE INVESTIGATION');
    console.log('========================================\n');

    const db = await connectToDatabase();
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(`📚 TOTAL COLLECTIONS IN DATABASE: ${collections.length}\n`);
    
    console.log('Collection Names:');
    collections.forEach((col, idx) => {
      console.log(`  ${idx + 1}. ${col.name}`);
    });

    console.log('\n========================================\n');
    
    // Target idCRM values to search for
    const targetIdCRMs = ['2264', 2264, '2435', 2435];
    
    // Check each collection for target idCRM data
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const collection = db.collection(collectionName);
      
      console.log(`\n🔍 Analyzing collection: "${collectionName}"`);
      console.log('─'.repeat(50));
      
      // Get total document count
      const totalDocs = await collection.countDocuments();
      console.log(`   Total documents: ${totalDocs}`);
      
      // Check for each target idCRM
      for (const idCRM of targetIdCRMs) {
        // Try different field names for idCRM
        const idCRMFieldNames = ['idCRM', 'IdCRM', 'ID_CRM', 'id_crm'];
        
        for (const fieldName of idCRMFieldNames) {
          const query = {};
          query[fieldName] = idCRM;
          const count = await collection.countDocuments(query);
          
          if (count > 0) {
            console.log(`   ✅ Found ${count} document(s) with ${fieldName}=${idCRM}`);
            
            // Get sample document
            const sample = await collection.findOne(query);
            if (sample) {
              console.log(`   📋 Sample document keys: ${Object.keys(sample).join(', ')}`);
              
              // Show relevant fields
              console.log(`   Sample data:`);
              console.log(`     - _id: ${sample._id}`);
              console.log(`     - ${fieldName}: ${sample[fieldName]}`);
              
              // Show date/Date field if exists
              if (sample.date) console.log(`     - date: ${sample.date}`);
              if (sample.Date) console.log(`     - Date: ${sample.Date}`);
              
              // Show other interesting fields
              if (sample.idTiquer) console.log(`     - idTiquer: ${sample.idTiquer}`);
              if (sample.Totals) console.log(`     - Totals: ${JSON.stringify(sample.Totals)}`);
              if (sample.EtatTiquer) console.log(`     - EtatTiquer: ${sample.EtatTiquer}`);
              if (sample.TTC) console.log(`     - TTC: ${sample.TTC}`);
            }
          }
        }
      }
    }

    console.log('\n========================================');
    console.log('DETAILED QUERY RESULTS FOR idCRM=2264');
    console.log('========================================\n');

    // Now do detailed searches for 2264
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const collection = db.collection(collectionName);
      
      // Try to find idCRM 2264
      const idCRMFieldNames = ['idCRM', 'IdCRM', 'ID_CRM', 'id_crm'];
      
      for (const fieldName of idCRMFieldNames) {
        const query = {};
        query[fieldName] = '2264';  // Try string
        let docs = await collection.find(query).toArray();
        
        if (docs.length === 0) {
          query[fieldName] = 2264;  // Try number
          docs = await collection.find(query).toArray();
        }
        
        if (docs.length > 0) {
          console.log(`\n📊 "${collectionName}" collection (field: ${fieldName}):`);
          console.log(`   Count: ${docs.length} documents`);
          
          if (docs.length > 0) {
            console.log(`\n   First document:`);
            console.log(`   ${JSON.stringify(docs[0], null, 2)}`);
          }
          
          if (docs.length > 1) {
            console.log(`\n   Second document (first 500 chars):`);
            const secondStr = JSON.stringify(docs[1], null, 2).substring(0, 500);
            console.log(`   ${secondStr}...`);
          }
          
          if (docs.length > 5) {
            console.log(`\n   ... and ${docs.length - 2} more documents`);
          }
        }
      }
    }

    console.log('\n========================================\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

investigateCollections();
