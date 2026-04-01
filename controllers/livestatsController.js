 const { connectToDatabase} = require('../config/dbConfig.js');
  const nodemailer = require('nodemailer');
  const fs = require('fs');
  const path = require('path');

// Multilingual Ticket Translations (restaurant-style labels)
const ticketTranslations = {
  en: {
    article: 'ARTICLE', pu: 'PU', total: 'TOTAL',
    paymentMethod: 'PAYMENT METHOD', amount: 'AMOUNT',
    subtotalHT: 'Subtotal (HT)', tax: 'Tax', totalLabel: 'TOTAL',
    servedBy: 'Served by', orderNo: 'Order No', category: 'CATEGORY',
    lines: 'Lines', items: 'Items', signature: 'Signature',
    copy: 'Copy', ticketNo: 'Ticket No', merchant: 'Merchant',
    cardType: 'Card Type', terminalId: 'Terminal', thankYou: 'THANK YOU FOR YOUR VISIT',
    category: 'CATEGORY', line: 'Line', item: 'item',
    dineIn: 'Dine-in', takeaway: 'Takeaway', delivery: 'Delivery'
  },
  es: {
    article: 'ARTÍCULO', pu: 'PU', total: 'TOTAL',
    paymentMethod: 'MÉTODO DE PAGO', amount: 'CANTIDAD',
    subtotalHT: 'Subtotal (ST)', tax: 'Impuesto', totalLabel: 'TOTAL',
    servedBy: 'Atendido por', orderNo: 'Pedido N°', category: 'CATEGORÍA',
    lines: 'Líneas', items: 'Artículos', signature: 'Firma',
    copy: 'Copia', ticketNo: 'Ticket N°', merchant: 'Comerciante',
    cardType: 'Tipo de Tarjeta', terminalId: 'Terminal', thankYou: 'GRACIAS POR SU VISITA',
    category: 'CATEGORÍA', line: 'Línea', item: 'artículo',
    dineIn: 'En sala', takeaway: 'Para llevar', delivery: 'Entrega'
  },
  ar: {
    article: 'المادة', pu: 'السعر', total: 'الإجمالي',
    paymentMethod: 'طريقة الدفع', amount: 'المبلغ',
    subtotalHT: 'الإجمالي الفرعي (قبل الضريبة)', tax: 'الضريبة', totalLabel: 'الإجمالي',
    servedBy: 'خدمة من', orderNo: 'رقم الطلب', category: 'الفئة',
    lines: 'الأسطر', items: 'العناصر', signature: 'التوقيع',
    copy: 'نسخة', ticketNo: 'رقم التذكرة', merchant: 'التاجر',
    cardType: 'نوع البطاقة', terminalId: 'الطرفية', thankYou: 'شكرا لزيارتك',
    category: 'الفئة', line: 'السطر', item: 'عنصر',
    dineIn: 'في المطعم', takeaway: 'للأخذ', delivery: 'التوصيل'
  },
  fr: {
    article: 'ARTICLE', pu: 'PU', total: 'TOTAL',
    paymentMethod: 'MODE DE PAIEMENT', amount: 'MONTANT',
    subtotalHT: 'Sous-total (HT)', tax: 'Taxe', totalLabel: 'TOTAL',
    servedBy: 'Servi par', orderNo: 'Commande N°', category: 'CATÉGORIE',
    lines: 'Lignes', items: 'Articles', signature: 'Signature',
    copy: 'Copie', ticketNo: 'Ticket N°', merchant: 'Commerçant',
    cardType: 'Type de Carte', terminalId: 'Terminal', thankYou: 'MERCI DE VOTRE VISITE',
    category: 'CATÉGORIE', line: 'Ligne', item: 'article',
    dineIn: 'Sur place', takeaway: 'À emporter', delivery: 'Livraison'
  }
};

const getTranslation = (lang, key) => {
  const language = ticketTranslations[lang] || ticketTranslations['en'];
  return language[key] || ticketTranslations['en'][key] || key;
};

const getTranslatedMode = (mode, lang) => {
  if (!mode) return getTranslation(lang, 'dineIn');
  const modeUpper = mode.toUpperCase();
  const modeMap = {
    'SUR PLACE': 'dineIn',
    'ON-SITE': 'dineIn',
    'ON SITE': 'dineIn',
    'EN SITIO': 'dineIn',
    'À EMPORTER': 'takeaway',
    'TAKEAWAY': 'takeaway',
    'PARA LLEVAR': 'takeaway',
    'LIVRAISON': 'delivery',
    'DELIVERY': 'delivery',
    'ENTREGA': 'delivery',
    'TO-GO': 'takeaway',
    'TAKE-AWAY': 'takeaway'
  };
  const key = modeMap[modeUpper] || 'dineIn';
  return getTranslation(lang, key);
};

const transporter = nodemailer.createTransport({
  host: 'makseb.fr',
  port: 465,
  auth: {
    type: 'custom',
    user: 'commandes@makseb.fr',
    pass: 'Makseb2024',
  },
  tls: {
    rejectUnauthorized: false
}
});
const sendWelcomeEmail = (req, res) => {
  const { email, lien, name } = req.body;
  // Define the email template as a string
  const emailTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome Email</title>
    </head>
    <body>
      <p>Welcome to ${name}!</p>
      <p>Please find your ticket here: <a href="${lien}">click here</a></p>
      <p>If you have any questions or need further assistance, please don't hesitate to contact us.</p>
      <p>Best regards,</p>
      <p>${name}</p>
    </body>
    </html>
  `;
  const mailOptions = {
    from: 'commandes@makseb.fr',
    to: email,
    subject: 'Your Account Credentials',
    html: emailTemplate, // Set the email template as the HTML body
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ error: 'Error sending email.' });
    } else {
    
      return res.status(200).json({ message: 'Email sent successfully.' });
    }
  });
};
const sendPdfInEmail = (req, res) => {
  const { email, name,pdf } = req.body;
  // Define the email template as a string
  const emailTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome Email</title>
    </head>
    <body>
      <p>Welcome to ${name}!</p>
      <p>Please find your ticket attached: <a href="${lien}">click here</a></p>
      <p>If you have any questions or need further assistance, please don't hesitate to contact us.</p>
      <p>Best regards,</p>
      <p>${name}</p>
    </body>
    </html>
  `;
  const mailOptions = {
    from: 'commandes@makseb.fr',
    to: email,
    subject: 'Your Account Credentials',
    html: emailTemplate, // Set the email template as the HTML body
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ error: 'Error sending email.' });
    } else {
    
      return res.status(200).json({ message: 'Email sent successfully.' });
    }
  });
};
//cloturer work once : 
  const updateLivestat4 = async (req, res) => {
    const data = req.body;
  

    try {
      const db = await connectToDatabase();
      const collection = db.collection('livestats');
      

      
        const result = await collection.findOne({ IdCRM: data.IdCRM, date: data.date });
        const updateFields = {};
        for (const key in data) {

          updateFields[key] = data[key];
        }
        if (result) {


          await collection.updateOne(
            { _id: result._id },
            {
              $set: updateFields

            }
          );

          console.log("Updated successfully for IDCRM :",data.IdCRM);
        } else {
          console.log('No result found.');



          await collection.insertOne(updateFields);

          console.log("1 record inserted");
        }
      

      res.sendStatus(200);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  //cloturer getReglement : 
  const updateLivestatForGetReglement = async (req, res) => {
    const data = req.body;
  

    try {
      const db = await connectToDatabase();
      const collection = db.collection('livestats');
      
      const collection2 = db.collection('TempsReels');
      
     
     
        await collection2.deleteMany({ IdCRM: data.IdCRM });
     

      
        const result = await collection.findOne({ IdCRM: data.IdCRM, date: data.date });
        const updateFields = {};
        for (const key in data) {

          updateFields[key] = data[key];
        }
        if (result) {


          await collection.updateOne(
            { _id: result._id },
            {
              $set: updateFields

            }
          );

          console.log("Updated successfully for IDCRM :",data.IdCRM);
        } else {
          console.log('No result found.');



          await collection.insertOne(updateFields);

          console.log("1 record inserted");
        }
      

      // Emit real-time update event
      if (req.app && req.app.io) {
        console.log(`📡 [API_UPDATE] Emitting UpdateTempsReels${data.IdCRM} after updateLivestatForGetReglement`);
        req.app.io.emit(`UpdateTempsReels${data.IdCRM}`, { source: 'api_update', timestamp: new Date() });
      }

      res.sendStatus(200);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };



//GetReglement()
  const updateLivestat3 = async (req, res) => {
    const data = req.body;
 console.log(data)

    try {
      const db = await connectToDatabase();
      const collection = db.collection('TempsReels');
      
     
      for (const livestat of data) {
        await collection.deleteMany({ IdCRM: livestat.IdCRM });
      }

    
      for (const livestat of data) {
        const updateFields = {};
        for (const key in livestat) {
          updateFields[key] = livestat[key];
        }
        console.log(updateFields);
        await collection.insertOne(updateFields);
      }

      // Emit real-time update event
      if (req.app && req.app.io && data.length > 0) {
        const storeId = data[0].IdCRM;
        console.log(`📡 [API_UPDATE] Emitting UpdateTempsReels${storeId} after updateLivestat3`);
        req.app.io.emit(`UpdateTempsReels${storeId}`, { source: 'api_update', timestamp: new Date() });
      }
  
      res.sendStatus(200);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };







const UpdateTiquer = async (req, res) => {
    const data = req.body;
    
    // Allowed payment methods
    const ALLOWED_PAYMENT_METHODS = ['CASH', 'CARD', 'CHECK'];
    
    // Allowed consumption modes (ENGLISH ONLY)
    const ALLOWED_CONSUMPTION_MODES = ['Takeaway', 'Dine-in', 'Delivery'];

    try {
      // Validate required fields
      if (!data.IdCRM || !data.Date || !data.idTiquer || !data.HeureTicket || !data.Totals || !data.currency || !data.merchant_name || !data.merchant_address || !data.SIRET) {
        console.error("Missing required fields:", { IdCRM: data.IdCRM, Date: data.Date, idTiquer: data.idTiquer, HeureTicket: data.HeureTicket, Totals: data.Totals, currency: data.currency, merchant_name: data.merchant_name, merchant_address: data.merchant_address, SIRET: data.SIRET });
        return res.status(400).json({ error: "Missing required fields: IdCRM, Date, idTiquer, HeureTicket, Totals, currency, merchant_name, merchant_address, SIRET" });
      }

      // Validate Totals structure
      if (typeof data.Totals !== 'object' || !data.Totals.Total_Ht || !data.Totals.Total_TVA || !data.Totals.Total_TTC) {
        return res.status(400).json({ 
          error: "Invalid Totals object. Must include Total_Ht, Total_TVA, and Total_TTC"
        });
      }

      // Validate ConsumptionMode (ENGLISH ONLY - STRICT)
      if (data.ConsumptionMode) {
        if (!ALLOWED_CONSUMPTION_MODES.includes(data.ConsumptionMode)) {
          console.error(`Invalid ConsumptionMode: '${data.ConsumptionMode}'. Received value must be in English.`);
          return res.status(400).json({ 
            error: `Invalid ConsumptionMode: '${data.ConsumptionMode}'. Must be one of: ${ALLOWED_CONSUMPTION_MODES.join(', ')}`,
            allowed_values: ALLOWED_CONSUMPTION_MODES,
            note: "ConsumptionMode must be in English"
          });
        }
      }

      // Handle closure number (shift) from 'Z' field (Z can be 0, so check !== undefined)
      if (data.Z !== undefined && data.Z !== null) {
        data.closureNumber = String(data.Z).trim();
        console.log(`Closure number (shift) extracted: ${data.closureNumber}`);
      }

      // Validate and normalize payment methods
      if (data.PaymentMethods && Array.isArray(data.PaymentMethods)) {
        let totalPaymentAmount = 0;
        
        // Validate each payment method
        for (const payment of data.PaymentMethods) {
          if (!payment.payment_method || typeof payment.amount !== 'number') {
            return res.status(400).json({ 
              error: "Invalid payment method format. Each payment must have 'payment_method' and 'amount'" 
            });
          }
          
          // Validate payment method is in allowed list
          if (!ALLOWED_PAYMENT_METHODS.includes(payment.payment_method.toUpperCase())) {
            return res.status(400).json({ 
              error: `Invalid payment method: '${payment.payment_method}'. Allowed methods: ${ALLOWED_PAYMENT_METHODS.join(', ')}`,
              allowed_methods: ALLOWED_PAYMENT_METHODS
            });
          }
          
          totalPaymentAmount += payment.amount;
        }
        
        // Validate that payment amounts sum to ticket total
        const ticketTotal = parseFloat(data.TTC);
        const difference = Math.abs(totalPaymentAmount - ticketTotal);
        
        if (difference > 0.01) { // Allow for minor floating point differences
          return res.status(400).json({ 
            error: `Payment amount mismatch. Total paid: ${totalPaymentAmount}, Ticket total: ${ticketTotal}`,
            details: { total_paid: totalPaymentAmount, ticket_total: ticketTotal }
          });
        }
      }

      const db = await connectToDatabase();
      const collection = db.collection('Tiquer');
      
      // Normalize IdCRM to string for consistent storage and retrieval
      data.IdCRM = String(data.IdCRM);
      data.idTiquer = parseInt(data.idTiquer) || data.idTiquer;

      const query = { IdCRM: data.IdCRM, Date: data.Date, idTiquer: data.idTiquer, HeureTicket: data.HeureTicket };
      const result = await collection.findOne(query);
      
      if (result) {
        console.log("Ticket already exists for IdCRM:", data.IdCRM, "idTiquer:", data.idTiquer);
        return res.status(200).json({ message: "Ticket already exists", _id: result._id });
      }

      const insertResult = await collection.insertOne(data);
      
      if (!insertResult.insertedId) {
        console.error("Insert failed - no insertedId returned");
        return res.status(500).json({ error: "Failed to insert ticket" });
      }

      console.log("Ticket inserted successfully. InsertedId:", insertResult.insertedId, "IdCRM:", data.IdCRM, "idTiquer:", data.idTiquer);
      res.status(201).json({ message: "Ticket inserted successfully", _id: insertResult.insertedId });
    } catch (error) {
      console.error("Error in UpdateTiquer:", error);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  };









  const calculateSumsForEachLine = (objects, sumsForEachLine = {}) => {
    objects.forEach(obj => {
      for (const key in obj) {
        // Skip MongoDB _id field and buffer objects
        if (key === '_id' || obj[key]?.buffer) {
          continue;
        }
        
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          sumsForEachLine[key] = calculateSumsForEachLine([obj[key]], sumsForEachLine[key] || {});
        }
        if (typeof obj[key] === 'number') {
          // If the value is a number, add it to the sum
          const result = (sumsForEachLine[key] || 0) + obj[key];
          sumsForEachLine[key] = Math.round(result * 100) / 100;
        }
        if (typeof obj[key] === 'string') {
          if (key !== 'date' && key !== '_id') { 
            sumsForEachLine[key] = obj[key]; 
          }
        }
      }
    });

    return sumsForEachLine;
  };

  const getLivestatByIdandDate = async (req, res) => {
    const callId = Math.random().toString(36).substr(2, 9);
    const timestamp = new Date().toISOString();
    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`📍 [${callId}] 🔵 getLivestatByIdandDate ENDPOINT HIT`);
    console.log(`📅 Timestamp: ${timestamp}`);
    console.log(`📦 Full Query: ${JSON.stringify(req.query)}`);
    
    try {
      const idCRM = req.query.idCRM; 
      const startDateString = req.query.date1;
      const endDateString = req.query.date2;

      console.log(`\n✓ [${callId}] Parameters extracted:`);
      console.log(`  ├─ idCRM: "${idCRM}" (type: ${typeof idCRM}, length: ${idCRM?.length})`);
      console.log(`  ├─ date1: "${startDateString}" (type: ${typeof startDateString})`);
      console.log(`  └─ date2: "${endDateString}" (type: ${typeof endDateString})`);

      // Validation
      if (!idCRM || !startDateString || !endDateString) {
        console.log(`\n❌ [${callId}] VALIDATION FAILED`);
        console.log(`  ├─ idCRM present? ${!!idCRM}`);
        console.log(`  ├─ date1 present? ${!!startDateString}`);
        console.log(`  └─ date2 present? ${!!endDateString}`);
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      console.log(`\n⏳ [${callId}] Connecting to database...`);
      const db = await connectToDatabase();
      console.log(`✅ [${callId}] Database connected`);
      
      // First try to get data from livestats collection (closure/aggregated data)
      const livestatsCollection = db.collection('livestats');
      console.log(`\n🔍 [${callId}] Step 1: Querying livestats collection...`);
      console.log(`  Query: { IdCRM: "${idCRM}", date: { $gte: "${startDateString}", $lte: "${endDateString}" } }`);
      
      let livestats = await livestatsCollection.aggregate([
        {
          $match: {
            IdCRM: idCRM,
            date: { $gte: startDateString, $lte: endDateString }
          }
        },
      ]).toArray();

      console.log(`✅ [${callId}] livestats query completed - found ${livestats.length} records`);
      if (livestats.length > 0) {
        console.log(`  First record keys: ${Object.keys(livestats[0]).join(', ')}`);
      }

      // If livestats is empty, aggregate from Tiquer collection (live transactions)
      if (livestats.length === 0) {
        console.log(`\n⚠️  [${callId}] No closure data found, falling back to Tiquer...`);
        const tiquerCollection = db.collection('Tiquer');
        
        console.log(`\n🔍 [${callId}] Step 2: Querying Tiquer collection...`);
        console.log(`  Query: { IdCRM: "${idCRM}", Date: { $gte: "${startDateString}", $lte: "${endDateString}" } }`);
        
        const tiquerData = await tiquerCollection.find({
          IdCRM: idCRM,
          Date: { $gte: startDateString, $lte: endDateString }
        }).toArray();

        console.log(`✅ [${callId}] Tiquer query completed - retrieved ${tiquerData.length} tickets`);
        if (tiquerData.length > 0) {
          console.log(`  First ticket - idTiquer: ${tiquerData[0].idTiquer}, TTC: ${tiquerData[0].TTC}, Date: ${tiquerData[0].Date}`);
        }

        if (tiquerData.length === 0) {
          console.log(`\n❌ [${callId}] NO DATA FOUND - returning empty response`);
          const response = { msg: "Rien de statistique trouvé pour ces dates spécifiées", success: true, data: [] };
          console.log(`📤 [${callId}] Sending response:`, JSON.stringify(response, null, 2));
          console.log(`${'='.repeat(80)}\n`);
          return res.status(200).json(response);
        }

        console.log(`\n⚙️  [${callId}] Step 3: Building aggregated structure...`);
        
        // Normalization functions
        const normalizeConsumptionMode = (mode) => {
          if (!mode) return 'UNKNOWN';
          const normalized = mode.toUpperCase().trim();
          // Normalize variations of takeaway
          if (normalized.includes('EMPORTER') || normalized.includes('TAKEAWAY') || normalized.includes('TO-GO')) {
            return 'À Emporter';
          }
          // Normalize dine-in
          if (normalized.includes('SUR PLACE') || normalized.includes('ON-SITE') || normalized.includes('ON SITE') || normalized.includes('DINE-IN')) {
            return 'Sur Place';
          }
          // Normalize delivery
          if (normalized.includes('LIVRAISON') || normalized.includes('DELIVERY')) {
            return 'Livraison';
          }
          return mode; // Return original if no match
        };

        const normalizePaymentMethod = (method) => {
          if (!method) return 'UNKNOWN';
          const normalized = method.toUpperCase().trim();
          // Normalize cash variations
          if (normalized === 'CASH' || normalized === 'ESPECES' || normalized === 'ESPÈCES') {
            return 'CASH';
          }
          // Normalize card
          if (normalized === 'CARD' || normalized === 'CARTE' || normalized === 'CARTE_BANCAIRE') {
            return 'CARD';
          }
          return method; // Return original if no match
        };

        // Build aggregated structure matching frontend expectations
        const aggregated = {
          ChiffreAffaire: {
            Total_TTC: 0,
            Total_HT: 0,
            Total_TVA: 0
          },
          modePaiement: {},
          modeConsommation: {},
          ProduitDetailler: {},
          EtatTiquer: {
            Encaiser: 0,
            Annuler: 0,
            Rembourser: 0
          },
          devise: '€'
        };

        let ticketIdx = 0;
        // Process each ticket
        tiquerData.forEach((ticket, idx) => {
          ticketIdx++;
          console.log(`\n  Ticket ${idx + 1}/${tiquerData.length}:`);
          console.log(`    ├─ idTiquer: ${ticket.idTiquer}, Date: ${ticket.Date}, Time: ${ticket.HeureTicket}`);
          console.log(`    ├─ TTC: ${ticket.TTC}, HT: ${ticket.Totals?.Total_Ht}, TVA: ${ticket.Totals?.Total_TVA}`);
          console.log(`    ├─ Status: ${ticket.status}`);
          
          // Count by ticket status
          const status = ticket.status || 'Encaiser'; // Default to Encaiser if no status
          console.log(`    ├─ Status counting: "${status}"`);
          if (status === 'Encaiser' || status === 'Collected' || status === 'Paid') {
            aggregated.EtatTiquer.Encaiser++;
            console.log(`      → Counted as Encaiser (total: ${aggregated.EtatTiquer.Encaiser})`);
          } else if (status === 'Annuler' || status === 'Cancelled' || status === 'Cancel') {
            aggregated.EtatTiquer.Annuler++;
            console.log(`      → Counted as Annuler (total: ${aggregated.EtatTiquer.Annuler})`);
          } else if (status === 'Rembourser' || status === 'Refunded' || status === 'Refund') {
            aggregated.EtatTiquer.Rembourser++;
            console.log(`      → Counted as Rembourser (total: ${aggregated.EtatTiquer.Rembourser})`);
          } else {
            // Unknown status, count as collected
            aggregated.EtatTiquer.Encaiser++;
            console.log(`    ⚠️  Unknown status "${status}", counted as Encaiser`);
          }
          
          // Only include revenue and details from collected tickets
          if (status === 'Encaiser' || status === 'Collected' || status === 'Paid') {
            // Sum revenue
            aggregated.ChiffreAffaire.Total_TTC += parseFloat(ticket.TTC || 0);
            aggregated.ChiffreAffaire.Total_HT += parseFloat(ticket.Totals?.Total_Ht || 0);
            aggregated.ChiffreAffaire.Total_TVA += parseFloat(ticket.Totals?.Total_TVA || 0);
            console.log(`    └─ Running totals - TTC: ${aggregated.ChiffreAffaire.Total_TTC}, HT: ${aggregated.ChiffreAffaire.Total_HT}, TVA: ${aggregated.ChiffreAffaire.Total_TVA}`);

            // Process payment methods
            if (ticket.PaymentMethods && Array.isArray(ticket.PaymentMethods)) {
              console.log(`    Payment methods: ${ticket.PaymentMethods.length} found`);
              ticket.PaymentMethods.forEach((pm, pmIdx) => {
                const method = normalizePaymentMethod(pm.payment_method);
                const amount = pm.amount || 0;
                aggregated.modePaiement[method] = (aggregated.modePaiement[method] || 0) + amount;
                console.log(`      [${pmIdx}] ${pm.payment_method} → ${method}: ${amount} (total for method: ${aggregated.modePaiement[method]})`);
              });
            }

            // Process consumption mode (fulfillment)
            const rawConsumptionMode = ticket.ConsumptionMode || 'UNKNOWN';
            const consumptionMode = normalizeConsumptionMode(rawConsumptionMode);
            aggregated.modeConsommation[consumptionMode] = (aggregated.modeConsommation[consumptionMode] || 0) + (ticket.TTC || 0);
            console.log(`    Fulfillment - ${rawConsumptionMode} → ${consumptionMode}: ${ticket.TTC} (total: ${aggregated.modeConsommation[consumptionMode]})`);

            // Process products from Menu
            if (ticket.Menu && Array.isArray(ticket.Menu)) {
              console.log(`    Products: ${ticket.Menu.length} found`);
              ticket.Menu.forEach((menuItem, mIdx) => {
                const productName = menuItem.NameProduct || 'Unknown Product';
                const qty = menuItem.QtyProduct || 1;
                const ttc = parseFloat(menuItem.TTC || 0);
                if (!aggregated.ProduitDetailler[productName]) {
                  aggregated.ProduitDetailler[productName] = {
                    TotalTTC: 0,
                    Quantite: 0
                  };
                }
                aggregated.ProduitDetailler[productName].TotalTTC += ttc;
                aggregated.ProduitDetailler[productName].Quantite += qty;
                console.log(`      [${mIdx}] ${productName} - Qty: ${qty}, TTC: ${ttc}`);
              });
            }
          }
        });

        console.log(`\n💾 [${callId}] Rounding values...`);
        // Round values
        aggregated.ChiffreAffaire.Total_TTC = Math.round(aggregated.ChiffreAffaire.Total_TTC * 100) / 100;
        aggregated.ChiffreAffaire.Total_HT = Math.round(aggregated.ChiffreAffaire.Total_HT * 100) / 100;
        aggregated.ChiffreAffaire.Total_TVA = Math.round(aggregated.ChiffreAffaire.Total_TVA * 100) / 100;
        
        console.log(`  Final aggregated totals:`);
        console.log(`  ├─ Total_TTC: ${aggregated.ChiffreAffaire.Total_TTC}`);
        console.log(`  ├─ Total_HT: ${aggregated.ChiffreAffaire.Total_HT}`);
        console.log(`  ├─ Total_TVA: ${aggregated.ChiffreAffaire.Total_TVA}`);
        console.log(`  ├─ Payment methods: ${Object.keys(aggregated.modePaiement).length}`);
        console.log(`  ├─ Fulfillment modes: ${Object.keys(aggregated.modeConsommation).length}`);
        console.log(`  └─ Products: ${Object.keys(aggregated.ProduitDetailler).length}`);

        livestats = [aggregated];
      }

      if (livestats.length === 0) {
        console.log(`\n❌ [${callId}] NO DATA TO RETURN`);
        const response = { msg: "Rien de statistique trouvé pour ces dates spécifiées", success: true, data: livestats };
        console.log(`📤 [${callId}] Sending response:`, JSON.stringify(response, null, 2));
        console.log(`${'='.repeat(80)}\n`);
        return res.status(200).json(response);
      } else {
        console.log(`\n📊 [${callId}] Step 4: Processing aggregated data...`);
        const sumsForEachLine = calculateSumsForEachLine(livestats);
        
        console.log(`\n📤 [${callId}] Preparing response...`);
        console.log(`  Data keys: ${Object.keys(sumsForEachLine).join(', ')}`);
        if (sumsForEachLine.ChiffreAffaire) {
          console.log(`  ChiffreAffaire: ${JSON.stringify(sumsForEachLine.ChiffreAffaire)}`);
        }
        
        // Normalize response data to consistent structure
        const normalizeResponseData = (data) => {
          if (!data || typeof data !== 'object') return data;
          
          // Remove MongoDB _id field
          const { _id, ...normalized } = data;
          
          // Normalize ChiffreAffaire (handle both old and new formats)
          if (normalized.ChiffreAffaire) {
            const ca = normalized.ChiffreAffaire;
            // Handle old format with TVA instead of Total_TVA
            if (ca.TVA !== undefined && ca.Total_TVA === undefined) {
              normalized.ChiffreAffaire = {
                Total_TTC: ca.Total_TTC,
                Total_HT: ca.Total_HT,
                Total_TVA: ca.TVA
              };
            }
          }
          
          // Normalize ProduitDetailler (map Somme to TotalTTC, Qty to Quantite)
          if (normalized.ProduitDetailler && typeof normalized.ProduitDetailler === 'object') {
            const normalizedProducts = {};
            for (const [productName, product] of Object.entries(normalized.ProduitDetailler)) {
              if (productName === 'SommeTOTAL') continue; // Skip total row
              normalizedProducts[productName] = {
                TotalTTC: product.Somme !== undefined ? product.Somme : product.TotalTTC,
                Quantite: product.Qty !== undefined ? product.Qty : product.Quantite
              };
            }
            normalized.ProduitDetailler = normalizedProducts;
          }
          
          // Normalize modeConsommation keys (SurPlace → Sur Place, A_Emporter → À Emporter)
          if (normalized.modeConsommation && typeof normalized.modeConsommation === 'object') {
            const normalizedModes = {};
            for (const [mode, amount] of Object.entries(normalized.modeConsommation)) {
              let key = mode;
              if (mode === 'SurPlace') key = 'Sur Place';
              else if (mode === 'A_Emporter') key = 'À Emporter';
              else if (mode === 'Livraison') key = 'Livraison';
              normalizedModes[key] = amount;
            }
            normalized.modeConsommation = normalizedModes;
          }
          
          // Normalize modePaiement keys (CARTE_BANCAIRE → CARD, ESPECES → CASH)
          if (normalized.modePaiement && typeof normalized.modePaiement === 'object') {
            const normalizedPayments = {};
            for (const [method, amount] of Object.entries(normalized.modePaiement)) {
              let key = method;
              if (method === 'CARTE_BANCAIRE' || method === 'CARTE') key = 'CARD';
              else if (method === 'ESPECES' || method === 'ESPÈCES') key = 'CASH';
              normalizedPayments[key] = amount;
            }
            normalized.modePaiement = normalizedPayments;
          }
          
          return normalized;
        };
        
        const normalizedData = normalizeResponseData(sumsForEachLine);
        const response = { msg: "Des statistiques existent pour ces dates spécifiées", success: true, data: normalizedData };
        console.log(`\n✅ [${callId}] RESPONSE READY`);
        console.log(`📄 Response size: ${JSON.stringify(response).length} bytes`);
        console.log(`${'='.repeat(80)}\n`);
        res.status(200).json(response);
      }
    } catch (error) {
      console.error(`\n❌ [${callId}] ERROR in getLivestatByIdandDate:`);
      console.error(`  Message: ${error.message}`);
      console.error(`  Stack: ${error.stack}`);
      console.log(`${'='.repeat(80)}\n`);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  };

  const getLivestatByIdandDate2 = async (req, res) => {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] 🟣 getLivestatByIdandDate2 ENDPOINT HIT (Detailed Sales)`);
    console.log(`📦 Query params:`, req.query);
    
    try {
      const idCRM = req.query.idCRM; 
      const startDateString = req.query.date1;
      const endDateString = req.query.date2;

      console.log(`🔍 Parsed values:`);
      console.log(`   - idCRM: "${idCRM}"`);
      console.log(`   - date1: "${startDateString}"`);
      console.log(`   - date2: "${endDateString}"`);

      const db = await connectToDatabase();
      const tempsReelsCollection = db.collection('TempsReels');

      console.log(`📊 Querying TempsReels collection...`);

      let livestats = await tempsReelsCollection.aggregate([
        {
          $match: {
            IdCRM: idCRM,
            date: { $gte: startDateString, $lte: endDateString }
          }
        },
      ]).toArray();
      
      console.log(`✅ TempsReels query returned ${livestats.length} records`);
      
      // If TempsReels is empty, fall back to live Tiquer data
      if (livestats.length === 0) {
        console.log(`⚠️  No detailed data in TempsReels, falling back to live Tiquer data...`);
        const tiquerCollection = db.collection('Tiquer');
        
        livestats = await tiquerCollection.aggregate([
          {
            $match: {
              IdCRM: idCRM,
              Date: { $gte: startDateString, $lte: endDateString }
            }
          },
          { $sort: { Date: 1, HeureTicket: 1 } }
        ]).toArray();

        console.log(`📊 Aggregated ${livestats.length} live tickets from Tiquer collection`);
      }
      
      if (livestats.length === 0) {
        console.log(`⚠️  No detailed data found for idCRM="${idCRM}" in date range`);
        const response = { msg: "Rien de statistique trouvé pour ces dates spécifiées", success: true, data: livestats };
        console.log(`📤 Sending response with ${livestats.length} records`);
        return res.status(200).json(response);
      } else {
        console.log(`📈 Sample record:`, livestats[0]);
        const response = { msg: "Des statistiques existent pour ces dates spécifiées", success: true, data: livestats };
        console.log(`📤 Sending response with ${livestats.length} records`);
        res.status(200).json(response);
      }
    } catch (error) {
      console.error(`❌ ERROR in getLivestatByIdandDate2:`, error);
      console.error(`   Error message: ${error.message}`);
      console.error(`   Stack trace:`, error.stack);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  };




  const updateStatusStores = async (req, res) => {
    const data = req.body;
  console.log("updateStatusStores",data)
    try {
      const db = await connectToDatabase();
      const collection = db.collection('user');
  
      const response = await collection.findOne({ idCRM: data.IdCRM });
    
      if (response) {
        if (data.LastCommand != null) {
          await collection.updateOne(
            { _id: response._id },
            {
              $set: {
                Status: 'Activer', 
                LastCommand: data.LastCommand,
                lastInteraction: new Date() 
              }
            }
          );
          // console.log("Updated status and last interaction successfully");
        }
        else{ await collection.updateOne(
          { _id: response._id },
          {
            $set: {
              Status: 'Activer', 
              lastInteraction: new Date() 
            }
          }
        );
        // console.log("Updated status and last interaction successfully");
      }
      }
  
      res.sendStatus(200);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };



const updateStatus = async () => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('user');

    //10
    const fiveMinutesAgo  = new Date(Date.now() - 10 * 60 * 1000);
    //5
    // const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000); 

   
    await collection.updateMany(
      { lastInteraction: { $gt: fiveMinutesAgo } },
      { $set: { Status: 'Activer' } }
    );

    await collection.updateMany(
      { lastInteraction: { $lt: fiveMinutesAgo } },
      { $set: { Status: 'Désactiver' } }
    );

    console.log('updateStatus : Status for All user updated successfully');
  } catch (error) {
    console.error(error);
  }
};
  const GetLicence = async (req, res) => {

    try {
      const db = await connectToDatabase();
      const collection = db.collection('user');
      const idCRM = req.params.idCRM;
      const user = await collection.findOne({ idCRM: idCRM });

      let hasLicense = "EMakseb";
    
      if (user) {
        if(user.Licence==="Enable"){   hasLicense = "EMakseb";}
        else{hasLicense = "MaksebD";} 
      }
    
      res.json({ hasLicense });


    } catch (error) {
      console.error(error);

      res.status(500).json({ error: "Internal Server Error" });
    }
  };


  const GetBaseName = async (req, res) => {

    try {
      const db = await connectToDatabase();
      const collection = db.collection('user');
      const idCRM = req.params.idCRM;
      const data = req.body;
      const user = await collection.findOne({ idCRM: idCRM });
   const BaseName=user.BaseName
 
    
  if (user) {
       await collection.updateOne(
      { _id: user._id },
      {
        $set: {
          Status: 'Activer', 
          lastInteraction: new Date() 
        }
      }
    );  
      if ((BaseName==="BaseModeEcole")||(BaseName==="DefaultBase")||(BaseName==="BaseVierge") ){
        res.json({ BaseName });
      }else{
        BaseName="Vide"
        res.json({BaseName});}
      }
    } catch (error) {
      console.error(error);

      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  const UpdateLicence = async (req, res) => {

    try {
      const db = await connectToDatabase();
      const collection = db.collection('user');
      const idCRM = req.params.idCRM;
      const action = req.params.action;
      console.log("update Licence for :",idCRM,"new Licence :", action);

      if (action === '') {
        return res.status(400).json({ error: 'Invalid action' });
      }
      const response = await collection.findOne({ idCRM: idCRM });
      await collection.updateOne(
        { _id: response._id },
        {
          $set: {
            Licence: action

          }
        }
      );
      res.json({ success: true });
    } catch (error) {
      console.error(error);

      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  
  const UpdateBaseDeDonne = async (req, res) => {

    try {
      const db = await connectToDatabase();
      const collection = db.collection('user');
      const idCRM = req.params.idCRM;
      const action = req.params.action;
      console.log("update Base for :",idCRM," new Base is  :", action);

      if (action === '') {
        return res.status(400).json({ error: 'Invalid action' });
      }
      const response = await collection.findOne({ idCRM: idCRM });
      await collection.updateOne(
        { _id: response._id },
        {
          $set: {
            BaseName: action

          }
        }
      );
      res.json({ success: true });
    } catch (error) {
      console.error(error);

      res.status(500).json({ error: "Internal Server Error" });
    }
  };






  const updateAllCatInUploid = async (req, res) => {
    try {
      const data = req.body;

      const base64Data = data.image.replace(/^data:image\/\w+;base64,/, '');
      const decodedImage = Buffer.from(base64Data, 'base64');

      const parentFolderPath = path.join(__dirname, '..'); // Go up one directory level
      const folderPath = path.join(parentFolderPath, 'uploads', data.IdCRM);
    

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true }); 
      }

      const filename = `${data.Categories}.png`;

      fs.writeFileSync(path.join(folderPath, filename), decodedImage);

      res.sendStatus(200);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };



  const updateAllCatCripteInMongo = async (req, res) => {
    try {
      const data = req.body;
      
      const db = await connectToDatabase();
      const collection = db.collection('Images');
      console.log(" Get All image caisse and insert it in mngodb for :", data.IdCRM);

      const result = await collection.findOne({ IdCRM: data.IdCRM, Categories: data.Categories });



      if (result) {
        await collection.updateOne(
          { _id: result._id },
          { $set: data }
        );
        console.log("Updated Catégories");
      } else {
        console.log('No result found.');
        await collection.insertOne(data);
        console.log("1 Catégories inserted");
      }

      res.sendStatus(200);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };


  const getAllCatInUploid = async (req, res) => {
    try {
      const { IdCRM } = req.query; // Assuming IdCRM is sent as a query parameter

      const parentFolderPath = path.join(__dirname, '..'); // Go up one directory level
      const folderPath = path.join(parentFolderPath, 'uploads', IdCRM);

      if (!fs.existsSync(folderPath)) {
        return res.status(404).json({ error: "Folder not found" });
      }

      const files = fs.readdirSync(folderPath);

      // Filter out only the image files

      const imageNames = files.filter(file => fs.statSync(path.join(folderPath, file)).isFile())
                              .map(file => file.split('.')[0]);
      
      res.status(200).json({ imageNames  });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  /**
   * GET /get-tickets (renamed to /get-orders on frontend)
   * Supports optional search, filtering and pagination for better UX
   *
   * Query parameters:
   *   idCRM (string)           REQUIRED
   *   date1 (YYYYMMDD)         REQUIRED
   *   date2 (YYYYMMDD)         REQUIRED
   *   search (string)          optional keyword matching idTiquer, Signature, customerName etc.
   *   paymentMethod (string)   optional filter against PaymentMethods/ModePaiement
   *   fulfillmentMode (string) optional filter against ConsumptionMode
   *   page (number)            optional, default 1
   *   limit (number)           optional, default 50
   *
   * Response JSON:
   * {
   *   data: [<ticket>, ...],
   *   totalCount: <number>,
   *   page: <number>,
   *   limit: <number>
   * }
   */
  const getTiquerId = async (req, res) => {
    const callId = Math.random().toString(36).substr(2, 9);
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📍 [${callId}] 🟢 getTiquerId (get-tickets) ENDPOINT HIT`);
    console.log(`📦 Query: ${JSON.stringify(req.query)}`);
    
    try {
      const idCRMParam = req.query.idCRM || '';
      const startDateString = req.query.date1;
      const endDateString = req.query.date2;
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.max(parseInt(req.query.limit) || 50, 1);
      
      console.log(`\n✓ [${callId}] Parameters:`);
      console.log(`  ├─ idCRM: "${idCRMParam}"`);
      console.log(`  ├─ date1: "${startDateString}"`);
      console.log(`  ├─ date2: "${endDateString}"`);
      console.log(`  ├─ page: ${page}, limit: ${limit}`);
      
      if (!idCRMParam || !startDateString || !endDateString) {
        console.log(`❌ [${callId}] Validation failed`);
        return res.status(400).json({ error: 'idCRM, date1 and date2 are required' });
      }

      const idCRM = String(idCRMParam);
      const db = await connectToDatabase();
      const skip = (page - 1) * limit;

      // Normalization function for fulfillment modes
      const normalizeConsumptionMode = (mode) => {
        if (!mode) return null;
        const normalized = mode.toUpperCase().trim();
        if (normalized.includes('EMPORTER') || normalized.includes('TAKEAWAY') || normalized.includes('TO-GO')) {
          return 'À Emporter';
        }
        if (normalized.includes('SUR PLACE') || normalized.includes('ON-SITE') || normalized.includes('DINE-IN')) {
          return 'Sur Place';
        }
        if (normalized.includes('LIVRAISON') || normalized.includes('DELIVERY')) {
          return 'Livraison';
        }
        return null;
      };

      // Try Tiquer collection first
      const tiquerCollection = db.collection('Tiquer');
      console.log(`\n🔍 [${callId}] Querying Tiquer collection...`);
      
      const pipeline = [];
      const match = {
        IdCRM: idCRM,
        Date: { $gte: startDateString, $lte: endDateString }
      };
      
      const andConditions = [];
      
      console.log(`  Base match query: IdCRM=${idCRM}, Date range: ${startDateString} to ${endDateString}`);

      // apply text search
      const search = req.query.search;
      if (search && typeof search === 'string' && search.trim() !== '') {
        const regex = new RegExp(search.trim(), 'i');
        andConditions.push({
          $or: [
            { idTiquer: regex },
            { idCommande: regex },
            { Signature: regex },
            { customerName: regex }
          ]
        });
        console.log(`  Search filter applied: "${search}"`);
      }

      // filter by payment method
      const paymentMethod = req.query.paymentMethod;
      if (paymentMethod && typeof paymentMethod === 'string') {
        const pmRegex = new RegExp(paymentMethod, 'i');
        andConditions.push({
          $or: [
            { 'PaymentMethods.payment_method': pmRegex },
            { ModePaiement: pmRegex }
          ]
        });
        console.log(`  Payment method filter: "${paymentMethod}"`);
      }

      // filter by fulfillment mode - handle normalized variations
      const fulfillmentMode = req.query.fulfillmentMode;
      if (fulfillmentMode && typeof fulfillmentMode === 'string') {
        console.log(`  Fulfillment mode filter requested: "${fulfillmentMode}"`);
        const normalizedTarget = normalizeConsumptionMode(fulfillmentMode);
        if (normalizedTarget) {
          const consumptionOrConditions = [];
          // Create pattern to match all variations of this mode
          if (normalizedTarget === 'À Emporter') {
            consumptionOrConditions.push({ ConsumptionMode: /A\s*Emporter/i });
            consumptionOrConditions.push({ ConsumptionMode: /À\s*Emporter/i });
            consumptionOrConditions.push({ ConsumptionMode: /Takeaway/i });
            console.log(`    → Normalized to: "À Emporter", added regex filters`);
          } else if (normalizedTarget === 'Sur Place') {
            consumptionOrConditions.push({ ConsumptionMode: /Sur\s*Place/i });
            consumptionOrConditions.push({ ConsumptionMode: /On-Site/i });
            consumptionOrConditions.push({ ConsumptionMode: /On Site/i });
            console.log(`    → Normalized to: "Sur Place", added regex filters`);
          } else if (normalizedTarget === 'Livraison') {
            consumptionOrConditions.push({ ConsumptionMode: /Livraison/i });
            consumptionOrConditions.push({ ConsumptionMode: /Delivery/i });
            console.log(`    → Normalized to: "Livraison", added regex filters`);
          }
          if (consumptionOrConditions.length > 0) {
            andConditions.push({ $or: consumptionOrConditions });
          }
        }
      }

      // Build final match query with all AND conditions
      if (andConditions.length > 0) {
        match.$and = [{ IdCRM: idCRM, Date: { $gte: startDateString, $lte: endDateString } }, ...andConditions];
      }

      console.log(`  Final match query: ${JSON.stringify(match)}`);
      
      pipeline.push({ $match: match });
      pipeline.push({
        $facet: {
          results: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: 'count' }]
        }
      });

      console.log(`  Executing aggregation pipeline...`);
      let aggResult = await tiquerCollection.aggregate(pipeline).toArray();
      let results = (aggResult[0] && aggResult[0].results) || [];
      let totalCount = (aggResult[0] && aggResult[0].totalCount[0] && aggResult[0].totalCount[0].count) || 0;

      console.log(`✅ [${callId}] Query completed`);
      console.log(`  Results count: ${results.length}`);
      console.log(`  Total count: ${totalCount}`);
      
      if (totalCount === 0) {
        console.log(`⚠️  [${callId}] No tickets found in Tiquer collection for this date range`);
      } else if (results.length > 0) {
        console.log(`  First ticket: idTiquer=${results[0].idTiquer}, Date=${results[0].Date}, TTC=${results[0].TTC}`);
      }
      
      console.log(`\n📤 [${callId}] Sending response: ${totalCount} total records, ${results.length} on page ${page}`);
      console.log(`${'='.repeat(80)}\n`);
      res.json({ data: results, totalCount, page, limit });
    } catch (error) {
      console.error(`\n❌ [callId] ERROR in getTiquerId:`);
      console.error(`  Message: ${error.message}`);
      console.error(`  Stack:`, error.stack);
      console.log(`${'='.repeat(80)}\n`);
      res.status(500).json({ error: "Internal Server Error", detail: error.message });
    }
  };












const generateTicketsHTML = async (req, res) => {
  try{


  const data2 = JSON.parse(req.query.data);
  const db = await connectToDatabase();
  const collection = db.collection('Tiquer');
  const data = await collection.findOne({ IdCRM: data2.idCRM, HeureTicket: data2.HeureTicket, idTiquer: parseInt(data2.idTiquer) });


// console.log(data, data.Totals.Total_Ht)
let htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title> Ticket Restaurant</title>
  <!-- Bootstrap CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    /* Custom CSS for ticket */
    .ticket {

      width: 100%;
      margin: 0 auto;
      margin-top: 5px;
      margin-left: 5px;

      font-family: Arial, sans-serif;
      border: 1px solid #ccc;
      padding: 5px;
      border-radius: 10px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
    .ticket-header {
      text-align: center;
      margin-bottom: 5px;
      padding-top: 15px;
    }
    .TicketID{
        margin-top: -10px;  
        font-size: 1.6rem;
    }
    .Ligne1 {
      border-bottom: 1px dashed #ccc;
      margin-bottom: 18px;
    }
    .Ligne2{
      border-bottom: 1px solid #ccc;
      margin-right: 25px;
     
    }
    .StyledTable{
        width: 100%;
        margin-left: 10px;
    }
    .StyledTable2{
        width: 100%;
        margin-left: 25px;
    
    }
    .Fist{width: 68%;}
    .Fist2{width: 80%;}
 .ProductName{
    font-size: 0.8rem;
 }
 .GredientName{
    font-size: 0.7rem;
   
 }
 .Taux{
    font-size: 0.9rem;
   
 }
 .GredientTD{
 padding-left: 20px;
 padding-top: -10px;
 }
 .SuplimentTD{
  padding-left: 10px;
 padding-top: -10px;
 }
 .tabletva{
  align-items: center;

 }
 .totalText{
    padding-left: 150px;
    font-size: 1.4rem;
  
   }
 .HTtext{
  padding-left: 10px;
  font-size: 0.9rem;

 }
 .DivtotalText{
  padding-top: 10px;

 }
 .centered-text {
    text-align: center;
    margin-top: -16px;
    
  }
  .bold-text {
    font-weight: bold;
    font-size: 1.3rem;

  }
  .spacer {
    height: 7px;
   
}
.SignTEXT{
    height: 120px;
  }


  </style>
</head>
<body>
`;


const ticketDate = new Date(data.Date.substring(0, 4), parseInt(data.Date.substring(4, 6)) - 1, data.Date.substring(6, 8));
const formattedDate = ticketDate.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
});
htmlContent += `

    <div class="ticket">
    <!-- Ticket Header -->
    <div class="ticket-header">
      <h5>${data.NomSociete}</h5>
      <p>${data.sAdress}<BR>
      ${data.ville}</p>
      <div class="Ligne1"></div>
      <div>Suivi par : Admin Le ${formattedDate} / ${data.HeureTicket} </div>
      <div class="Ligne1"></div><div class="Ligne1"></div>
    </div>

  
    <h5 class="TicketID"><b>TICKET  : ${data.idTiquer}</b></h5><br>
    <div class="Ligne1"></div>

    <table class="StyledTable">
    <thead>
        <tr>
            <td class="Fist"><text class="ProductName"><b></b></text></td>

            <td><b>PU</b></td>
            <td><b>TTC</b></td>

        </tr>
        
    </thead>
</table>
    <div class="Ligne2"></div>
    `;
data.Menu.forEach(item => {


  if(item.TTC > 0){

    htmlContent += `

      <table class="StyledTable">
      <tbody>
          <tr>
              <td class="Fist"><text class="ProductName"><b>${item.QtyProduct}  ${item.NameProduct}</b></text></td>

              <td>${item.TTC > 0 ? item.TTC / item.QtyProduct : ''} </td>
              <td>${item.TTC > 0 ? item.TTC : ''} ${item.TTC > 0 ? data.devise : ''}</td>
          </tr>
          `;
          if (item.Gredient2 && item.Gredient2.length > 0) {
            item.Gredient2.forEach(option => {
                htmlContent += `
              <tr >
                  <td class="GredientTD" ><text class="GredientName"><b>(SANS) ${option.NameProduct}</b></text></td>
                  <td >${option.TTC > 0 ? option.TTC / option.QtyProduct : ''}</td>
                  <td >${option.TTC > 0 ? option.TTC : ''} ${option.TTC > 0 ? data.devise : ''}</td>
              </tr>
              `;
    
            });
        }
        htmlContent += `<tr class="spacer">
            <td></td>
            <td></td>
            <td></td>
            </tr>`;
    if (item.Gredient && item.Gredient.length > 0) {
        item.Gredient.forEach(option => {
            htmlContent += `
          <tr >
              <td class="GredientTD" ><text class="GredientName"><b>${option.QtyProduct} X  ${option.NameProduct}</b></text></td>
              <td >${option.TTC > 0 ? option.TTC / option.QtyProduct : ''}</td>
              <td >${option.TTC > 0 ? option.TTC : ''} ${option.TTC > 0 ? data.devise : ''}</td>
          </tr>
          `;

        });
    }
    htmlContent += `<tr class="spacer">
        <td></td>
        <td></td>
        <td></td>
        </tr>`;
    if (item.Sup && item.Sup.length > 0) {
        item.Sup.forEach(option => {
            htmlContent += `

        <tr >
          <td class="SuplimentTD" ><text class="GredientName"><b>${option.QtyProduct} X ${option.NameProduct}</b></text></td>
          <td >${option.TTC > 0 ? option.TTC / option.QtyProduct : ''}</td>
          <td >${option.TTC > 0 ? option.TTC : ''} ${option.TTC > 0 ? data.devise : ''}</td>
      </tr>
      `;
        });
    }
  }else{
      htmlContent += `

      <table class="StyledTable">
      <tbody>
          <tr>
              <td class="Fist"><text class="ProductName"><b>${item.QtyProduct}  ${item.NameProduct}</b></text></td>

              <td>${item.TTC > 0 ? item.TTC / item.QtyProduct : ''} </td>
              <td>${item.TTC > 0 ? item.TTC : ''} ${item.TTC > 0 ? data.devise : ''}</td>
          </tr>
          `;

          htmlContent += `<tr class="spacer">
          <td></td>
          <td></td>
          <td></td>
          </tr>`;

            htmlContent += `

        <tr >
          <td class="SuplimentTD" ><text class="GredientName"><b>${item.Sup[0].QtyProduct} X ${item.Sup[0].NameProduct}</b></text></td>
          <td >${item.Sup[0].TTC > 0 ? item.Sup[0].TTC / item.Sup[0].QtyProduct : ''}</td>
          <td >${item.Sup[0].TTC > 0 ? item.Sup[0].TTC : ''} ${item.Sup[0].TTC > 0 ? data.devise : ''}</td>
      </tr>
      `;
      if (item.Gredient2 && item.Gredient2.length > 0) {
        item.Gredient2.forEach(option => {
            htmlContent += `
          <tr >
              <td class="GredientTD" ><text class="GredientName"><b>(SANS) ${option.NameProduct}</b></text></td>
              <td >${option.TTC > 0 ? option.TTC / option.QtyProduct : ''}</td>
              <td >${option.TTC > 0 ? option.TTC : ''} ${option.TTC > 0 ? data.devise : ''}</td>
          </tr>
          `;

        });
    }
    htmlContent += `<tr class="spacer">
        <td></td>
        <td></td>
        <td></td>
        </tr>`;
      if (item.Gredient && item.Gredient.length > 0) {
          item.Gredient.forEach(option => {
              htmlContent += `
            <tr >
                <td class="GredientTD" ><text class="GredientName"><b>${option.QtyProduct} X  ${option.NameProduct}</b></text></td>
                <td >${option.TTC > 0 ? option.TTC / option.QtyProduct : ''}</td>
                <td >${option.TTC > 0 ? option.TTC : ''} ${option.TTC > 0 ? data.devise : ''}</td>
            </tr>
            `;

          });
      }
      htmlContent += `<tr class="spacer">
          <td></td>
          <td></td>
          <td></td>
          </tr>`;
        
    
      if (item.Sup && item.Sup.length > 1) { // Ensure there are at least two items
          for (let i = 1; i < item.Sup.length; i++) { // Start from the second item
              const option = item.Sup[i];
              htmlContent += `
        
              <tr>
                <td class="SuplimentTD"><text class="GredientName"><b>${option.QtyProduct} X ${option.NameProduct}</b></text></td>
                <td>${option.TTC > 0 ? option.TTC / option.QtyProduct : ''}</td>
                <td>${option.TTC > 0 ? option.TTC : ''} ${option.TTC > 0 ? data.devise : ''}</td>
              </tr>
              `;
          }
      }
  }




    htmlContent += `
      </tbody>
  </table>  <div class="Ligne2"></div>`;
});

htmlContent += `
<div class="Ligne2"></div>
<br><div>
<text class="HTtext">Subtotal (HT) : ${data.Totals.Total_Ht ? data.Totals.Total_Ht : ''} ${data.devise} *** *** Tax : ${data.Totals.Total_TVA ? data.Totals.Total_TVA : ''} ${data.devise}  </text></div>
<div class="DivtotalText">
  <text class="totalText"><b>TOTAL : ${data.Totals.Total_TTC ? data.Totals.Total_TTC : ''}  ${data.devise}</b> </text>
</div>

<div class="Ligne2"></div>

 
<table  class="StyledTable" >
  <tbody>
  `;
const paymentMethods = data.PaymentMethods || data.ModePaiement;
if (paymentMethods && Array.isArray(paymentMethods)) {
  paymentMethods.forEach(payment => {
    const method = payment.payment_method || payment.ModePaimeent || 'Unknown';
    const amount = payment.amount || payment.totalwithMode || 0;
    htmlContent += `
      <tr >
          <td class="Fist" ><text class="Taux"><b>${method}</b></text></td>

          <td ><text class="Taux"><b>${amount} ${data.devise}</b></text></td>
      </tr>
      `;
  });
}
htmlContent += `

    
  </tbody>
</table>
<div class="Ligne1"></div><div class="Ligne1"></div>


<table  class="StyledTable2" >
<tbody>
<tr >
<td ><text class="Taux"><b>CATEGORY</b></text></td>
  <td  ><text class="Taux"><b>Subtotal</b></text></td>
  <td ><text class="Taux"><b>Tax</b></text></td>
  <td ><text class="Taux"><b>Total</b></text></td>
</tr>
`;
for (const key in data.TotalsDetailler) {
    if (data.TotalsDetailler.hasOwnProperty(key)) {
        const Chiffre = data.TotalsDetailler[key];
        htmlContent += `
    <tr >
      <td ><text class="Taux"><b>${Chiffre.Taux}</b></text></td>
        <td  ><text class="Taux"><b>${Chiffre.HT}</b></text></td>
        <td ><text class="Taux"><b>${Chiffre.TVA}</b></text></td>
        <td ><text class="Taux"><b>${Chiffre.TTC}</b></text></td>
    </tr>
    `;
    }
}
htmlContent += `
</tbody>
</table>

<div class="Ligne1"></div><div class="Ligne1"></div>

<div class="centered-text">
<text class="bold-text ConsumptionMode">${(data.ConsumptionMode || 'SUR PLACE').toUpperCase()}</text>
</div>
<div class="Ligne1"></div><div class="Ligne1"></div>
<div class="centered-text">
<text >MERCI DE VOTRE VISITE <br> A TRES BIENTOT </text>
</div><br>
<div class="SignTEXT">${data.sign}</div>

</div>      
</body>
</html>  `;

res.send(htmlContent.replace(/undefined/g, ''));
}catch(err){
      console.log(err);
}
};




















  const getTicketRestoById = async (req, res) => {
    try {
      const idCRM = String(req.params.idCRM);
      const date = req.params.date;
      const idTiquer = String(req.params.idTiquer); // Keep as string to match database storage
      const lang = (req.query.lang || 'en').toLowerCase(); // Get language from query param
      const t = (key) => getTranslation(lang, key); // Translation function

      const db = await connectToDatabase();
      const collection = db.collection('Tiquer');

      // Build tolerant query for common variations (string/number, date formats)
      const idCRMVariants = [idCRM];
      const numericIdCRM = Number(idCRM);
      if (!Number.isNaN(numericIdCRM)) idCRMVariants.push(numericIdCRM);

      const idTiquerVariants = [idTiquer];
      const numericIdTiquer = Number(idTiquer);
      if (!Number.isNaN(numericIdTiquer)) idTiquerVariants.push(numericIdTiquer);

      const dateVariants = [date];
      const dateHyphen = date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
      if (dateHyphen !== date) dateVariants.push(dateHyphen);
      const datePlain = date.replace(/-/g, '');
      if (datePlain !== date) dateVariants.push(datePlain);

      console.log(`[getTicketRestoById] Querying ticket with IdCRM in [${idCRMVariants.join(', ')}], Date in [${dateVariants.join(', ')}], idTiquer in [${idTiquerVariants.join(', ')}]`);

      const ticket = await collection.findOne({
        IdCRM: { $in: idCRMVariants },
        Date: { $in: dateVariants },
        idTiquer: { $in: idTiquerVariants }
      });

      if (!ticket) {
        return res.status(404).send(`<html><body>Ticket not found. Query attempted: IdCRM=${idCRM}, Date=${date}, idTiquer=${idTiquer}</body></html>`);
      }

      tickets = [ticket];
      let htmlContent = `
      <!DOCTYPE html>
      <html lang="${lang === 'ar' ? 'ar' : lang}${lang === 'ar' ? ' dir="rtl"' : ''}">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tickets</title>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
          <style>
              @font-face {
                  font-family: 'Dina';
                  src: url('/Dina.fon');
              }
              @font-face {
                  font-family: 'Amiri';
                  src: url('/Amiri-Regular.ttf');
              }
              * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
              }
              body {
                  font-family: ${lang === 'ar' ? "'Amiri', " : ""}  'Dina', monospace;
                  background: #f5f5f5;
                  padding: 8px;
                  ${lang === 'ar' ? "direction: rtl; text-align: right;" : ""}
              }
              .button-container {
                  display: flex;
                  justify-content: ${lang === 'ar' ? 'flex-start' : 'flex-end'};
                  gap: 8px;
                  margin-bottom: 0;
                  position: sticky;
                  top: 8px;
                  z-index: 100;
                  padding-${lang === 'ar' ? 'left' : 'right'}: 8px;
                  flex-wrap: wrap;
              }
              .action-btn {
                  background: transparent;
                  border: none;
                  border-radius: 0;
                  cursor: pointer;
                  padding: 0;
                  transition: all 0.2s ease;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  width: 40px;
                  height: 40px;
              }
              .action-btn img {
                  width: 32px;
                  height: 32px;
                  display: block;
              }
              .action-btn:hover {
                  opacity: 0.7;
              }
              .action-btn:active {
                  transform: scale(0.98);
              }
              .lang-btn {
                  background: white;
                  border: 1px solid #ddd;
                  padding: 6px 10px;
                  font-size: 12px;
                  font-weight: bold;
                  border-radius: 3px;
                  cursor: pointer;
                  transition: all 0.2s ease;
              }
              .lang-btn.active {
                  background: #333;
                  color: white;
                  border-color: #333;
              }
              .lang-btn:hover {
                  opacity: 0.8;
              }
              .ticket {
                  background: white;
                  margin: 12px auto 8px;
                  padding: 12px;
                  border: none;
                  border-radius: 1px;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                  max-width: 350px;
                  font-family: ${lang === 'ar' ? "'Amiri', " : ""}'Dina', monospace;
                  font-size: 12px;
                  line-height: 1.4;
                  ${lang === 'ar' ? "direction: rtl; text-align: right;" : ""}
              }
              .ticket-details {
                  margin-bottom: 12px;
                  text-align: center;
                  padding-bottom: 8px;
                  border-bottom: 1px solid #ddd;
              }
              .ticket-details p {
                  margin: 2px 0;
                  word-break: break-word;
              }
              .ticket-details h1 {
                  font-size: 16px;
                  margin: 8px 0 0;
                  font-weight: bold;
              }
              .items-list {
                  margin: 8px 0;
              }
              .items-list table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 2px 0;
              }
              .items-list td {
                  padding: 2px 2px;
                  border-bottom: 1px dotted #ddd;
              }
              .item {
                  margin: 2px 0;
              }
              .items {
                  padding-left: 8px;
              }
              .payment-details {
                  margin-top: 8px;
              }
              .payment-details table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 4px 0;
              }
              .payment-details td {
                  padding: 2px;
              }
              .closing-note {
                  text-align: center;
                  margin-top: 12px;
                  padding-top: 8px;
                  border-top: 1px solid #ddd;
              }
              .closing-note p {
                  margin: 2px 0;
              }
              .header-info {
                  font-size: 10px;
                  text-align: left;
                  margin-bottom: 8px;
                  padding-bottom: 4px;
                  border-bottom: 1px solid #ddd;
              }
              .header-info p {
                  margin: 1px 0;
                  ${lang === 'ar' ? "text-align: right;" : ""}
              }
              .footer-info {
                  text-align: center;
                  font-size: 10px;
                  margin-top: 8px;
                  padding-top: 4px;
                  border-top: 1px solid #ddd;
              }
              .footer-info p {
                  margin: 1px 0;
              }
              .card-details {
                  font-size: 10px;
                  margin-top: 8px;
                  padding-top: 8px;
                  border-top: 1px dashed #ddd;
              }
              .card-details p {
                  margin: 1px 0;
              }
              .card-label {
                  font-weight: bold;
                  display: inline-block;
                  width: 120px;
              }
              tr {
                  height: auto;
              }
              @media (max-width: 480px) {
                  body {
                      padding: 4px;
                  }
                  .ticket {
                      max-width: 100%;
                      padding: 8px;
                      font-size: 11px;
                  }
                  .action-btn {
                      padding: 8px 12px;
                      font-size: 12px;
                  }
              }
          </style>
      </head>
      <body>
      <div class="button-container">
        <button class="action-btn" id="download-pdf" onclick="downloadPDF()" title="Download PDF"><img src="/pdf.png" alt="PDF"></button>
        <div style="display: flex; gap: 4px;">
          <button class="lang-btn ${lang === 'en' ? 'active' : ''}" onclick="changeLanguage('en')">EN</button>
          <button class="lang-btn ${lang === 'es' ? 'active' : ''}" onclick="changeLanguage('es')">ES</button>
          <button class="lang-btn ${lang === 'ar' ? 'active' : ''}" onclick="changeLanguage('ar')">AR</button>
          <button class="lang-btn ${lang === 'fr' ? 'active' : ''}" onclick="changeLanguage('fr')">FR</button>
        </div>
      </div>
      <div id="ticket-content">
      `;
      
      if (tickets) {
        tickets.forEach(ticket => {
          const ticketDate = new Date(ticket.Date.substring(0, 4), parseInt(ticket.Date.substring(4, 6)) - 1, ticket.Date.substring(6, 8));
          const formattedDate = ticketDate.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          });
          htmlContent += `
          <div class="ticket">
              <div class="merchant-info" style="text-align: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #333; font-weight: bold;">
                  <p style="margin: 0;">${ticket.merchant_name || ''}</p>
                  <p style="margin: 4px 0;">${ticket.merchant_address || ''}</p>
                  <p style="margin: 4px 0;">SIRET: ${ticket.SIRET || ''}</p>
                  ${ticket.TVA_intra ? `<p style="margin: 4px 0;">INTRA TVA: ${ticket.TVA_intra}</p>` : ''}
                  ${ticket.NAF_code ? `<p style="margin: 4px 0;">NAF: ${ticket.NAF_code}</p>` : ''}
              </div>
              <div class="header-info">
                  ${(ticket.copy_type || ticket.copy_number) ? `<p>Copy${ticket.copy_type ? ` ${ticket.copy_type}` : ''}${ticket.copy_number ? ` N° : ${ticket.copy_number}` : ''}</p>` : ''}
                  <p>Ticket N°: ${ticket.idTiquer}</p>
              </div>
              <div class="ticket-details">
                  <p style='margin-top: 4px;'>${formattedDate || ''} ${ticket.HeureTicket || ''}</p>
                  <p>${t('servedBy')}: ADMIN</p>
                  ${ticket.Order_number ? `<p style="margin-top: 4px;">${t('orderNo')}: ${ticket.Order_number}</p>` : ''}
              </div>
              <div class="items-list">
                  <table>
                      <thead>
                          <tr>
                              <td style="text-align: left;">${t('article')}</td>
                              <td style="text-align: right;">${t('pu')}</td>
                              <td style="text-align: right;">${t('total')}</td>
                          </tr>
                      </thead>
                  </table>
              `;
          let totalHT = ticket.Totals?.Total_Ht || 0;
          let totalTVA = ticket.Totals?.Total_TVA || 0;
          if (ticket.Menu && Array.isArray(ticket.Menu)) {
            ticket.Menu.forEach(item => {
            htmlContent += `
                  <table>
                      <tbody>
                          <tr>
                              <td>${(item.QtyProduct || 0)}x ${(item.NameProduct || '')}</td>
                              <td style="text-align: right;">${(item.TTC > 0) ? ((item.TTC || 0) + ' ' + (ticket.currency || ticket.devise || '')) : ''}</td>
                              <td style="text-align: right;">${(item.TTC > 0) ? (((item.QtyProduct || 0) * (item.TTC || 0)).toFixed(2) + ' ' + (ticket.currency || ticket.devise || '')) : ''}</td>
                          </tr>
                      </tbody>
                  </table>
            `;
            if (item.Gredient && item.Gredient.length > 0) {
              item.Gredient.forEach(option => {
                if (option.NameProduct) {
                  htmlContent += `
                      <table>
                          <tbody>
                              <tr>
                                  <td style="padding-left: 12px;">• ${(option.NameProduct || '')}</td>
                                  <td style="text-align: right;">${(option.TTC > 0) ? (((option.TTC || 0) + ' ' + (ticket.currency || ticket.devise || '')) || '') : ''}</td>
                                  <td style="text-align: right;">${(option.TTC > 0) ? ((((option.TTC || 0) * (option.QtyProduct || 0)).toFixed(2) + ' ' + (ticket.currency || ticket.devise || '')) || '') : ''}</td>
                              </tr>
                          </tbody>
                      </table>
                  `;
                }
              });
            }
            if (item.Gredient2 && item.Gredient2.length > 0) {
              item.Gredient2.forEach(option => {
                if (option.NameProduct && option.TTC > 0) {
                  htmlContent += `
                      <table>
                          <tbody>
                              <tr>
                                  <td style="padding-left: 12px;">• ${(option.NameProduct || '')}</td>
                                  <td style="text-align: right;">${((option.TTC || 0) + ' ' + (ticket.currency || ticket.devise || '')) || ''}</td>
                                  <td style="text-align: right;">${((((option.TTC || 0) * (option.QtyProduct || 0)).toFixed(2) + ' ' + (ticket.currency || ticket.devise || '')) || '')}</td>
                              </tr>
                          </tbody>
                      </table>
                  `;
                }
              });
            }
            if (item.Sup && item.Sup.length > 0) {
              item.Sup.forEach(option => {
                htmlContent += `
                      <table>
                          <tbody>
                              <tr>
                                  <td style="padding-left: 12px;">+ ${((option.QtyProduct > 0) ? ((option.QtyProduct || 0) + 'x ') : '')}${(option.NameProduct || '')}</td>
                                  <td style="text-align: right;">${(option.TTC > 0) ? ((option.TTC || 0) + ' ' + (ticket.currency || ticket.devise || '')) : ''}</td>
                                  <td style="text-align: right;">${(option.TTC > 0) ? ((((option.TTC || 0) * (option.QtyProduct || 0)).toFixed(2) + ' ' + (ticket.currency || ticket.devise || '')) || '') : ''}</td>
                              </tr>
                          </tbody>
                      </table>
                `;
              });
            }
          });
          }
          htmlContent += `
              </div>
              <div class="payment-details">
                  <table>
                      <tbody>
                          <tr>
                              <td>${t('subtotalHT')}</td>
                              <td style="text-align: right;">${totalHT.toFixed(2)} ${ticket.currency || ticket.devise || ''}</td>
                          </tr>
                          <tr>
                              <td>${t('tax')}</td>
                              <td style="text-align: right;">${totalTVA.toFixed(2)} ${ticket.currency || ticket.devise || ''}</td>
                          </tr>
                          <tr style="font-weight: bold; border-top: 1px solid #333;">
                              <td>${t('totalLabel')}</td>
                              <td style="text-align: right;">${(ticket.Totals?.Total_TTC || 0).toFixed(2)} ${ticket.currency || ticket.devise || ''}</td>
                          </tr>
                      </tbody>
                  </table>
          `;
          const paymentMethods = ticket.PaymentMethods || ticket.ModePaiement;
          if (paymentMethods && Array.isArray(paymentMethods)) {
            htmlContent += `
                  <table style="margin-top: 12px; border-top: 2px solid #333; padding-top: 8px;">
                      <tbody>
                          <tr style="font-weight: bold;">
                              <td>${t('paymentMethod')}</td>
                              <td style="text-align: right;">${t('amount')}</td>
                          </tr>
            `;
            paymentMethods.forEach(payment => {
              const method = (payment.payment_method || payment.ModePaimeent || 'Unknown') || '';
              const amount = (payment.amount || payment.totalwithMode || 0) || 0;
              htmlContent += `
                          <tr>
                              <td>${method}</td>
                              <td style="text-align: right;">${amount} ${(ticket.currency || ticket.devise || '')}</td>
                          </tr>
              `;
            });
            htmlContent += `
                      </tbody>
                  </table>
            `;
          }
          
          // Calculate line and item counts
          let lineCount = 0;
          let itemCount = 0;
          if (ticket.Menu && Array.isArray(ticket.Menu)) {
            lineCount = ticket.Menu.length;
            ticket.Menu.forEach(item => {
              itemCount += item.QtyProduct || 1;
            });
          }
          
          htmlContent += `
              </div>
                <div class="closing-note">
                    <p>${ticket.ConsumptionMode ? getTranslatedMode(ticket.ConsumptionMode, lang) : t('dineIn')}</p>
                  </div>
          `;
          
          // Add footer info
          if (lineCount > 0 || itemCount > 0) {
            htmlContent += `
              <div class="footer-info">
            `;
            if (lineCount > 0 || itemCount > 0) {
              htmlContent += `
                  <p>${t('lines')}: ${lineCount} | ${t('items')}: ${itemCount}</p>
              `;
            }
            if (ticket.Signature) {
              htmlContent += `
                  <p style="margin-top: 8px; border-top: 1px solid #ddd; padding-top: 4px;">${t('signature')}: ${ticket.Signature}</p>
            `;
            }
            htmlContent += `
              </div>
            `;
          }
          
          // Add card payment details if applicable
          if (ticket.PaymentMethods && Array.isArray(ticket.PaymentMethods)) {
            const cardPayment = ticket.PaymentMethods.find(p => 
              (p.payment_method || p.ModePaimeent || '').toUpperCase() === 'CARD'
            );
            if (cardPayment && ticket.CardDetails) {
              const cd = ticket.CardDetails;
              htmlContent += `
              <div class="card-details">
                  ${cd.merchant_name ? `<p><span class="card-label">Merchant:</span> ${cd.merchant_name}</p>` : ''}
                  ${cd.transaction_type ? `<p><span class="card-label">Type:</span> ${cd.transaction_type}</p>` : ''}
                  ${cd.date_time ? `<p><span class="card-label">DateTime:</span> ${cd.date_time}</p>` : ''}
                  ${cd.terminal_id || cd.merchant_id ? `<p><span class="card-label">Terminal:</span> ${cd.terminal_id || 'N/A'} / ${cd.merchant_id || 'N/A'}</p>` : ''}
                  ${cd.card_scheme ? `<p><span class="card-label">Card:</span> ${cd.card_scheme}</p>` : ''}
                  ${cd.AID ? `<p><span class="card-label">AID:</span> ${cd.AID}</p>` : ''}
                  ${cd.masked_pan ? `<p><span class="card-label">PAN:</span> ${cd.masked_pan}</p>` : ''}
                  ${cd.authorization_number ? `<p><span class="card-label">Auth:</span> ${cd.authorization_number}</p>` : ''}
                  ${cd.total_amount ? `<p><span class="card-label">Amount:</span> ${cd.total_amount}</p>` : ''}
                  ${cd.receipt_type ? `<p><span class="card-label">Receipt:</span> ${cd.receipt_type}</p>` : ''}
                  ${cd.sequence_number ? `<p><span class="card-label">Sequence:</span> ${cd.sequence_number}</p>` : ''}
              </div>
            `;
            }
          }
          
          htmlContent += `
              <div style="text-align: center; margin-top: 12px; padding-top: 8px; border-top: 1px solid #ddd; font-size: 10px;">
                  <p>${t('thankYou')}</p>
              </div>
              ${ticket.NF525 ? `<div style="text-align: center; margin-top: 12px; padding-top: 8px; font-size: 9px; color: #333;">
                  <p>NF525: ${ticket.NF525}</p>
              </div>` : ''}
              <div style="text-align: center; margin-top: 12px; padding-top: 8px; font-size: 9px; color: #333;">
                  <p>RAMACAISSE Version logiciel : ${ticket.software_version || 'N/A'}</p>
                  <p>Conforme à la loi anti-fraude TVA (BOI-TVA-DECLA-30-10-30)</p>
              </div>
          </div>
          `;
        });
      }
      htmlContent += `
      </div>
      </body>
      <script>
      function downloadPDF() {
        const element = document.getElementById('ticket-content');
        const timestamp = new Date().getTime();
        const opt = {
          margin: 5,
          filename: 'ticket-' + timestamp + '.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { orientation: 'portrait', unit: 'mm', format: [80, 200] }
        };
        html2pdf().set(opt).from(element).save();
      }
      function changeLanguage(lang) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('lang', lang);
        window.location.search = urlParams.toString();
      }
      </script>
      </html>
      `;
      res.send(htmlContent.replace(/undefined/g, ''));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  const generateTicketsHTML2 = async (req, res) => {
    const idCRM = req.query.idCRM;
    const HeureTicket = req.query.HeureTicket;
    const idTiquer = req.query.idTiquer;
 
    const db = await connectToDatabase();
    const collection = db.collection('Tiquer');
    const livestats = await collection.aggregate([
      {
        $match: {
          IdCRM: idCRM,
          HeureTicket: HeureTicket,
          idTiquer: parseInt(idTiquer)
        }
      },
    ]).toArray();
    
    tickets = livestats;
    let htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tickets</title>
        <style>
            /* Define your CSS styles here */
            body {
                font-family: Arial, sans-serif;
            }
            .ticket {
                margin: 20px;
                padding: 10px;
                border: 1px solid #ccc;
                borderRadius: 8px;
                padding: 10px;
                margin: 10px;
                marginBottom: 10px;
                width: 507px;
            }
            .ticket-details {
                margin-bottom: 10px;
            }
            .items-list {
                margin-top: 10px;
            }
            .item {
                margin-bottom: 5px;
            }
            .items {
              margin-left: 30px;
          }
            .payment-details {
                margin-top: 10px;
            }
            .test{
              margin:100px
            }
            /* Add more styles as needed */
        </style>
    </head>
    <body>
    `;
    if (tickets) {
      tickets.forEach(ticket => {
        const ticketDate = new Date(ticket.Date.substring(0, 4), parseInt(ticket.Date.substring(4, 6)) - 1, ticket.Date.substring(6, 8));
        const formattedDate = ticketDate.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
        htmlContent += `
        <div class="ticket">
            <div class="ticket-details">
                <p>ALIZETH DIGITAL EL MAY DJERBA 4175 DJERBA</p>
                <p style='padding-left: 220px;'>${formattedDate} ${ticket.HeureTicket}</p>
                <p>Servi par: ADMIN</p>
            </div>
            <div class="items-list">
                <ul>
                <table>
    <tbody>
    <tr>
    <td>     <div ><span style='padding: 10px; padding-left: 300px;'>PU</span> TTC</div></td>
    </tr>
    </tbody>
  </table>
        `;
        let totalHT = 0;
        let totalTVA = 0;
        ticket.Menu.forEach(item => {
          totalHT += item.HT * item.QtyProduct;
          totalTVA += item.TVA * item.QtyProduct;
          htmlContent += `
          ---------------------------------------------------------------------------------------
          <table border=0>
          <tbody>
            <tr>
              <td style='width: 280px;'>
                <div class="item">${item.QtyProduct}. ${item.NameProduct}:</div>
              </td>
              <td >
                <div '><span  style='padding: 10px;'>${item.TTC} </span>${item.QtyProduct * item.TTC} ${ticket.devise}</div>
              </td>
            </tr>
          </tbody>
        </table>
          `;
          if (item.Gredient && item.Gredient.length > 0) {
            item.Gredient.forEach(option => {
              if (option.TTC != 0) {
                totalHT += option.HT * option.QtyProduct;
                const optionTVA = option.TVA;
                totalTVA += optionTVA * option.QtyProduct;
                htmlContent += `
                <table border=0>
                  <tr>
                    <td style='width: 280px;'>
                      <div class="items">${option.NameProduct}:</div>
                    </td>
                    <td >
                      <div '><span  style='padding: 10px;'>${option.TTC} </span>   ${option.TTC * option.QtyProduct} ${ticket.devise}</div>
                    </td>
                  </tr>
                    `;
              } else {
                totalHT += option.HT * option.QtyProduct;
                const optionTVA = option.TVA;
                totalTVA += optionTVA * option.QtyProduct;
                htmlContent += `
                <tr>
                <td style='width: 280px;'>
                <p   class="items">${option.NameProduct} </p>
                </td>
                </tr>
              </table>
                `;
              }
            });
          }
          if (item.Sup && item.Sup.length > 0) {
            item.Sup.forEach(option => {
              totalHT += option.HT * option.QtyProduct;
                const optionTVA = option.TVA;
                totalTVA += optionTVA * option.QtyProduct;
              htmlContent += `
              <table border=0>
              <tbody>
                <tr>
                  <td style='width: 280px;'>
                    <div class="items">${option.QtyProduct}. ${option.NameProduct}:</div>
                  </td>
                  <td >
                    <div '><span  style='padding: 10px;'>${option.TTC} </span>   ${option.TTC * option.QtyProduct} ${ticket.devise}</div>
                  </td>
                </tr>
              </tbody>
            </table>
              `;
            });
          }
        });
        htmlContent += `
            </div>
            <div class="payment-details">
            -----------------------------------------------------------------------------------------------
        `;
      htmlContent += `
          <table border=0>
          <tbody>
            <tr>
              <td style='width: 280px;'>
              MONTANT  HT:  ${totalHT.toFixed(1)}${ticket.devise}
              </td>
              <td >
                <div '><span  style='padding: 10px;'>TOTAL: </span> ${ticket.TTC} ${ticket.devise}</div>
              </td>
            </tr>
            <tr >
            <td style='width: 280px;'>
              </td>
            <td >
            <div '><span  style='padding: 10px;'>Tax:  </span>  ${totalTVA.toFixed(1)}${ticket.devise}</div>
          </td>
            </tr>
          </tbody>
        </table>
          -----------------------------------------------------------------------------------------------
          `;
        const paymentMethods2 = ticket.PaymentMethods || ticket.ModePaiement;
        if (paymentMethods2 && Array.isArray(paymentMethods2)) {
          paymentMethods2.forEach(payment => {
            const method = payment.payment_method || payment.ModePaimeent || 'Unknown';
            const amount = payment.amount || payment.totalwithMode || 0;
            htmlContent += `
          <table border=0>
          <tbody>
            <tr>
              <td style='width: 280px;'>
                <div class="items">${method}:</div>
              </td>
              <td >
                <div '><span  style='padding: 20px;'> </span> ${amount} ${ticket.devise}</div>
              </td>
            </tr>
          </tbody>
        </table>
          -----------------------------------------------------------------------------------------------
          `;
          });
        }
        htmlContent += `
            </div>
            <div class="closing-note">
                <p style='padding-left: 180px;'>${ticket.ConsumptionMode ? ticket.ConsumptionMode.toUpperCase() : 'SUR PLACE'}</p>
                -----------------------------------------------------------------------------------------------
                <p style='padding-left: 80px;'>THANK YOU FOR YOUR VISIT, SEE YOU SOON</p>
            </div>
        </div>
        `;
      });
    }
    htmlContent += `
    </body>
    </html>
    `;
    res.send(htmlContent.replace(/undefined/g, ''));
  };

  // New endpoint: Get payment statistics and aggregation
  const getPaymentStatistics = async (req, res) => {
    try {
      const idCRM = req.query.idCRM;
      const date1 = req.query.date1;
      const date2 = req.query.date2;

      if (!idCRM || !date1 || !date2) {
        return res.status(400).json({ 
          error: "Missing required parameters: idCRM, date1, date2" 
        });
      }

      const db = await connectToDatabase();
      const collection = db.collection('Tiquer');

      // Fetch all tickets in date range
      const tickets = await collection.find({
        IdCRM: idCRM,
        Date: { $gte: date1, $lte: date2 }
      }).toArray();

      if (!tickets || tickets.length === 0) {
        return res.status(404).json({ error: "No tickets found for this period" });
      }

      // Aggregate payment statistics
      const paymentStats = {
        total_revenue: 0,
        total_transactions: 0,
        payment_methods: {},
        payment_breakdown: []
      };

      tickets.forEach(ticket => {
        paymentStats.total_revenue += parseFloat(ticket.TTC) || 0;
        paymentStats.total_transactions += 1;

        // Support both new and legacy payment method formats
        const paymentMethods = ticket.PaymentMethods || ticket.ModePaiement;
        
        if (paymentMethods && Array.isArray(paymentMethods)) {
          paymentMethods.forEach(payment => {
            const method = payment.payment_method || payment.ModePaimeent || 'Unknown';
            const amount = parseFloat(payment.amount || payment.totalwithMode || 0);

            // Aggregate by payment method
            if (!paymentStats.payment_methods[method]) {
              paymentStats.payment_methods[method] = {
                total_amount: 0,
                transaction_count: 0,
                average_transaction: 0
              };
            }

            paymentStats.payment_methods[method].total_amount += amount;
            paymentStats.payment_methods[method].transaction_count += 1;
          });
        }
      });

      // Calculate averages and format payment breakdown
      Object.keys(paymentStats.payment_methods).forEach(method => {
        const stats = paymentStats.payment_methods[method];
        stats.average_transaction = stats.total_amount / stats.transaction_count;
        paymentStats.payment_breakdown.push({
          payment_method: method,
          total_amount: parseFloat(stats.total_amount.toFixed(2)),
          transaction_count: stats.transaction_count,
          average_amount: parseFloat(stats.average_transaction.toFixed(2)),
          percentage_of_total: parseFloat(((stats.total_amount / paymentStats.total_revenue) * 100).toFixed(2))
        });
      });

      // Sort by total amount descending
      paymentStats.payment_breakdown.sort((a, b) => b.total_amount - a.total_amount);

      // Add summary
      paymentStats.total_revenue = parseFloat(paymentStats.total_revenue.toFixed(2));
      paymentStats.date_range = { start: date1, end: date2 };

      res.status(200).json({
        status: "success",
        data: paymentStats,
        message: "Payment statistics retrieved successfully"
      });

    } catch (error) {
      console.error("Error in getPaymentStatistics:", error);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  };

  /**
   * GET /get-tickets-by-z/:idCRM/:zId
   * Returns all tickets between the requested Z and the previous Z
   *
   * URL parameters:
   *   idCRM (string)           REQUIRED - Store identifier
   *   zId (number)             REQUIRED - Z ID (IDCloture)
   *
   * Query parameters:
   *   search (string)          optional keyword matching idTiquer, Signature, customerName etc.
   *   paymentMethod (string)   optional filter against PaymentMethods/ModePaiement
   *   fulfillmentMode (string) optional filter against ConsumptionMode
   *   page (number)            optional, default 1
   *   limit (number)           optional, default 50
   *
   * Response JSON:
   * {
   *   data: [<ticket>, ...],
   *   totalCount: <number>,
   *   page: <number>,
   *   limit: <number>,
   *   zInfo: {
   *     currentZ: <z_object>,
   *     previousZ: <z_object>,
   *     dateRange: { start: <datetime>, end: <datetime> }
   *   }
   * }
   */
  const getTicketsByZ = async (req, res) => {
    const callId = Math.random().toString(36).substr(2, 9);
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📍 [${callId}] 🟢 getTicketsByZ ENDPOINT HIT`);
    console.log(`📦 Params: idCRM=${req.params.idCRM}, zId=${req.params.zId}`);
    console.log(`📦 Query: ${JSON.stringify(req.query)}`);

    try {
      const idCRM = req.params.idCRM;
      const zId = parseInt(req.params.zId);
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.max(parseInt(req.query.limit) || 50, 1);

      if (!idCRM || isNaN(zId)) {
        console.log(`❌ [${callId}] Validation failed - missing idCRM or invalid zId`);
        return res.status(400).json({ error: 'idCRM and valid zId are required' });
      }

      const db = await connectToDatabase();
      const clotureCollection = db.collection('Cloture');
      const tiquerCollection = db.collection('Tiquer');

      // Find the requested Z
      console.log(`\n🔍 [${callId}] Finding Z with IDCloture=${zId} for IdCRM=${idCRM}`);
      const currentZ = await clotureCollection.findOne({
        IDCloture: zId,
        IdCRM: idCRM
      });

      if (!currentZ) {
        console.log(`❌ [${callId}] Z not found`);
        return res.status(404).json({ error: 'Z not found' });
      }

      console.log(`✅ [${callId}] Current Z found:`, {
        IDCloture: currentZ.IDCloture,
        Date_cloture: currentZ.Date_cloture,
        HeureCloture: currentZ.HeureCloture
      });

      // Find the previous Z (ordered by Date_cloture DESC, HeureCloture DESC)
      console.log(`\n🔍 [${callId}] Finding previous Z for IdCRM=${idCRM}`);
      const previousZ = await clotureCollection.findOne({
        IdCRM: idCRM,
        $or: [
          { Date_cloture: { $lt: currentZ.Date_cloture } },
          {
            Date_cloture: currentZ.Date_cloture,
            HeureCloture: { $lt: currentZ.HeureCloture }
          }
        ]
      }, {
        sort: { Date_cloture: -1, HeureCloture: -1 }
      });

      console.log(`✅ [${callId}] Previous Z:`, previousZ ? {
        IDCloture: previousZ.IDCloture,
        Date_cloture: previousZ.Date_cloture,
        HeureCloture: previousZ.HeureCloture
      } : 'None (first Z)');

      // Create date range for ticket filtering
      let startDateTime, endDateTime;

      if (previousZ) {
        // Tickets from previous Z timestamp to current Z timestamp
        startDateTime = new Date(`${previousZ.Date_cloture.toISOString().split('T')[0]}T${previousZ.HeureCloture}`);
        endDateTime = new Date(`${currentZ.Date_cloture.toISOString().split('T')[0]}T${currentZ.HeureCloture}`);
      } else {
        // First Z - tickets from beginning of current Z date to Z timestamp
        const zDate = currentZ.Date_cloture.toISOString().split('T')[0];
        startDateTime = new Date(`${zDate}T00:00:00`);
        endDateTime = new Date(`${zDate}T${currentZ.HeureCloture}`);
      }

      console.log(`📅 [${callId}] Ticket date range: ${startDateTime.toISOString()} to ${endDateTime.toISOString()}`);

      // Build ticket query
      const skip = (page - 1) * limit;
      const match = {
        IdCRM: idCRM,
        Date: {
          $gte: startDateTime.toISOString().split('T')[0].replace(/-/g, ''), // Convert to YYYYMMDD format
          $lte: endDateTime.toISOString().split('T')[0].replace(/-/g, '')    // Convert to YYYYMMDD format
        }
      };

      // Add time filtering (more precise than just date)
      // Note: Since MongoDB Date fields might not include time, we'll use date range primarily
      // and rely on the Z timestamps for logical separation

      console.log(`  Base match query: ${JSON.stringify(match)}`);

      // Apply additional filters (search, payment method, fulfillment mode)
      const search = req.query.search;
      if (search && typeof search === 'string' && search.trim() !== '') {
        const regex = new RegExp(search.trim(), 'i');
        match.$or = [
          { idTiquer: regex },
          { idCommande: regex },
          { Signature: regex },
          { customerName: regex }
        ];
        console.log(`  Search filter applied: "${search}"`);
      }

      // Filter by payment method
      const paymentMethod = req.query.paymentMethod;
      if (paymentMethod && typeof paymentMethod === 'string') {
        const pmRegex = new RegExp(paymentMethod, 'i');
        match.$or = match.$or || [];
        match.$or.push({ 'PaymentMethods.payment_method': pmRegex });
        match.$or.push({ ModePaiement: pmRegex });
        console.log(`  Payment method filter: "${paymentMethod}"`);
      }

      // Filter by fulfillment mode
      const fulfillmentMode = req.query.fulfillmentMode;
      if (fulfillmentMode && typeof fulfillmentMode === 'string') {
        console.log(`  Fulfillment mode filter requested: "${fulfillmentMode}"`);
        const normalizedTarget = normalizeConsumptionMode(fulfillmentMode);
        if (normalizedTarget) {
          match.$or = match.$or || [];
          if (normalizedTarget === 'À Emporter') {
            match.$or.push({ ConsumptionMode: /A\s*Emporter/i });
            match.$or.push({ ConsumptionMode: /À\s*Emporter/i });
            match.$or.push({ ConsumptionMode: /Takeaway/i });
          } else if (normalizedTarget === 'Sur Place') {
            match.$or.push({ ConsumptionMode: /Sur\s*Place/i });
            match.$or.push({ ConsumptionMode: /On-Site/i });
            match.$or.push({ ConsumptionMode: /On Site/i });
          } else if (normalizedTarget === 'Livraison') {
            match.$or.push({ ConsumptionMode: /Livraison/i });
            match.$or.push({ ConsumptionMode: /Delivery/i });
          }
          console.log(`    → Added fulfillment mode filters`);
        }
      }

      console.log(`  Final match query: ${JSON.stringify(match)}`);

      // Execute aggregation
      const pipeline = [
        { $match: match },
        {
          $facet: {
            results: [{ $skip: skip }, { $limit: limit }],
            totalCount: [{ $count: 'count' }]
          }
        }
      ];

      console.log(`  Executing aggregation pipeline...`);
      const aggResult = await tiquerCollection.aggregate(pipeline).toArray();
      const results = (aggResult[0] && aggResult[0].results) || [];
      const totalCount = (aggResult[0] && aggResult[0].totalCount[0] && aggResult[0].totalCount[0].count) || 0;

      console.log(`✅ [${callId}] Query completed`);
      console.log(`  Results count: ${results.length}`);
      console.log(`  Total count: ${totalCount}`);

      // Prepare Z info for response
      const zInfo = {
        currentZ: {
          IDCloture: currentZ.IDCloture,
          Date_cloture: currentZ.Date_cloture,
          HeureCloture: currentZ.HeureCloture,
          User: currentZ.User,
          RECETTE: currentZ.RECETTE
        },
        previousZ: previousZ ? {
          IDCloture: previousZ.IDCloture,
          Date_cloture: previousZ.Date_cloture,
          HeureCloture: previousZ.HeureCloture,
          User: previousZ.User,
          RECETTE: previousZ.RECETTE
        } : null,
        dateRange: {
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString()
        }
      };

      console.log(`\n📤 [${callId}] Sending response: ${totalCount} total records, ${results.length} on page ${page}`);
      console.log(`${'='.repeat(80)}\n`);

      res.json({
        data: results,
        totalCount,
        page,
        limit,
        zInfo
      });

    } catch (error) {
      console.error(`\n❌ [${callId}] ERROR in getTicketsByZ:`);
      console.error(`  Message: ${error.message}`);
      console.error(`  Stack:`, error.stack);
      console.log(`${'='.repeat(80)}\n`);
      res.status(500).json({ error: "Internal Server Error", detail: error.message });
    }
  };

  /**
   * POST /z
   * Create a new Z (Cloture) record
   *
   * Request body:
   * {
   *   IDCloture: <number>,
   *   Date_cloture: <date>,
   *   RETRAIT: <decimal>,
   *   ajout: <decimal>,
   *   HeureCloture: <time>,
   *   User: <string>,
   *   RECETTE: <decimal>,
   *   IdCRM: <string>
   * }
   */
  const createZ = async (req, res) => {
    try {
      const db = await connectToDatabase();
      const clotureCollection = db.collection('Cloture');

      const zData = {
        IDCloture: req.body.IDCloture,
        Date_cloture: new Date(req.body.Date_cloture),
        RETRAIT: req.body.RETRAIT || 0,
        ajout: req.body.ajout || 0,
        HeureCloture: req.body.HeureCloture,
        User: req.body.User,
        RECETTE: req.body.RECETTE || 0,
        IdCRM: req.body.IdCRM
      };

      // Check if Z already exists
      const existingZ = await clotureCollection.findOne({
        IDCloture: zData.IDCloture,
        IdCRM: zData.IdCRM
      });

      if (existingZ) {
        return res.status(409).json({ error: 'Z with this IDCloture already exists for this store' });
      }

      const result = await clotureCollection.insertOne(zData);

      // Emit socket event for real-time updates
      if (req.app.io) {
        req.app.io.emit(`UpdateZ${zData.IdCRM}`, {
          type: 'Z_CREATED',
          zData: zData
        });
      }

      res.status(201).json({
        message: 'Z created successfully',
        data: { ...zData, _id: result.insertedId }
      });

    } catch (error) {
      console.error('Error creating Z:', error);
      res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
  };

  /**
   * GET /z/:idCRM
   * Get all Z records for a store
   */
  const getZByIdCRM = async (req, res) => {
    try {
      const db = await connectToDatabase();
      const clotureCollection = db.collection('Cloture');

      const zRecords = await clotureCollection
        .find({ IdCRM: req.params.idCRM })
        .sort({ Date_cloture: -1, HeureCloture: -1 })
        .toArray();

      res.json({
        data: zRecords,
        count: zRecords.length
      });

    } catch (error) {
      console.error('Error fetching Z records:', error);
      res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
  };

  /**
   * PUT /z/:idCRM/:zId
   * Update a Z record
   */
  const updateZ = async (req, res) => {
    try {
      const db = await connectToDatabase();
      const clotureCollection = db.collection('Cloture');

      const updateData = {};
      if (req.body.RETRAIT !== undefined) updateData.RETRAIT = req.body.RETRAIT;
      if (req.body.ajout !== undefined) updateData.ajout = req.body.ajout;
      if (req.body.RECETTE !== undefined) updateData.RECETTE = req.body.RECETTE;
      if (req.body.User !== undefined) updateData.User = req.body.User;

      const result = await clotureCollection.updateOne(
        { IDCloture: parseInt(req.params.zId), IdCRM: req.params.idCRM },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Z not found' });
      }

      // Emit socket event for real-time updates
      if (req.app.io) {
        req.app.io.emit(`UpdateZ${req.params.idCRM}`, {
          type: 'Z_UPDATED',
          zId: req.params.zId,
          updateData: updateData
        });
      }

      res.json({ message: 'Z updated successfully' });

    } catch (error) {
      console.error('Error updating Z:', error);
      res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
  };

  /**
   * DELETE /z/:idCRM/:zId
   * Delete a Z record
   */
  const deleteZ = async (req, res) => {
    try {
      const db = await connectToDatabase();
      const clotureCollection = db.collection('Cloture');

      const result = await clotureCollection.deleteOne({
        IDCloture: parseInt(req.params.zId),
        IdCRM: req.params.idCRM
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Z not found' });
      }

      // Emit socket event for real-time updates
      if (req.app.io) {
        req.app.io.emit(`UpdateZ${req.params.idCRM}`, {
          type: 'Z_DELETED',
          zId: req.params.zId
        });
      }

      res.json({ message: 'Z deleted successfully' });

    } catch (error) {
      console.error('Error deleting Z:', error);
      res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
  };

  // Get all closures (Z records) for a store
  const getClosuresByIdCRM = async (req, res) => {
    const callId = Math.random().toString(36).substr(2, 9);
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📍 [${callId}] 🟢 getClosuresByIdCRM ENDPOINT HIT`);
    
    try {
      const idCRM = req.params.idCRM;
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.max(parseInt(req.query.limit) || 50, 1);
      const date1 = req.query.date1;
      const date2 = req.query.date2;

      if (!idCRM) {
        console.log(`❌ [${callId}] Validation failed - missing idCRM`);
        return res.status(400).json({ error: 'idCRM is required' });
      }

      const db = await connectToDatabase();
      const clotureCollection = db.collection('Cloture');

      console.log(`📦 [${callId}] Fetching closures for IdCRM=${idCRM}, page=${page}, limit=${limit}`);
      if (date1 || date2) {
        console.log(`   Date filter: ${date1} to ${date2}`);
      }

      // Build match query
      const match = { IdCRM: idCRM };
      
      // Add date range filter if provided
      if (date1 || date2) {
        match.Date_cloture = {};
        if (date1) {
          // Parse YYYYMMDD format to Date
          const year = parseInt(date1.substring(0, 4));
          const month = parseInt(date1.substring(4, 6)) - 1;
          const day = parseInt(date1.substring(6, 8));
          match.Date_cloture.$gte = new Date(year, month, day);
          console.log(`   Date GTE: ${match.Date_cloture.$gte.toISOString()}`);
        }
        if (date2) {
          // Parse YYYYMMDD format to Date (end of day)
          const year = parseInt(date2.substring(0, 4));
          const month = parseInt(date2.substring(4, 6)) - 1;
          const day = parseInt(date2.substring(6, 8));
          const endDate = new Date(year, month, day + 1); // Next day, so it includes all of the specified day
          match.Date_cloture.$lte = endDate;
          console.log(`   Date LTE: ${match.Date_cloture.$lte.toISOString()}`);
        }
      }

      // Build the aggregation pipeline
      const pipeline = [
        { $match: match },
        { $sort: { Date_cloture: -1, HeureCloture: -1 } },
        {
          $facet: {
            results: [{ $skip: (page - 1) * limit }, { $limit: limit }],
            totalCount: [{ $count: 'count' }]
          }
        }
      ];

      const aggResult = await clotureCollection.aggregate(pipeline).toArray();
      const results = (aggResult[0] && aggResult[0].results) || [];
      const totalCount = (aggResult[0] && aggResult[0].totalCount[0] && aggResult[0].totalCount[0].count) || 0;

      console.log(`✅ [${callId}] Found ${totalCount} closures (${results.length} on page ${page})`);

      res.json({
        success: true,
        data: results,
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      });

    } catch (error) {
      console.error('Error fetching closures:', error);
      res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
  };

  module.exports = {updateLivestatForGetReglement,GetBaseName,sendPdfInEmail,updateStatus,sendWelcomeEmail ,generateTicketsHTML2,generateTicketsHTML,getTicketRestoById,getTiquerId,UpdateTiquer, getLivestatByIdandDate2,getAllCatInUploid,updateAllCatCripteInMongo, updateAllCatInUploid, UpdateLicence,UpdateBaseDeDonne,updateLivestat3,updateLivestat4, getLivestatByIdandDate, updateStatusStores, GetLicence, getPaymentStatistics, getTicketsByZ, getClosuresByIdCRM, createZ, getZByIdCRM, updateZ, deleteZ };
