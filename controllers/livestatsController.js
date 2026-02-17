 const { connectToDatabase} = require('../config/dbConfig.js');
  const nodemailer = require('nodemailer');
  const fs = require('fs');
  const path = require('path');

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
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          sumsForEachLine[key] = calculateSumsForEachLine([obj[key]], sumsForEachLine[key] || {});
        }
        if (typeof obj[key] === 'number') {
          // If the value is a number, add it to the sum
          const result = (sumsForEachLine[key] || 0) + obj[key];
          sumsForEachLine[key] = Math.round(result * 100) / 100;
        }
        if (typeof obj[key] === 'string') {
          if (key != 'date') { sumsForEachLine[key] = obj[key]; }
        }
      }
    });

    return sumsForEachLine;
  };

  const getLivestatByIdandDate = async (req, res) => {
    try {
      const idCRM = req.query.idCRM; 
      const startDateString = req.query.date1;
      const endDateString = req.query.date2;

      const db = await connectToDatabase();
      const collection = db.collection('livestats');

      const livestats = await collection.aggregate([
        {
          $match: {
            IdCRM: idCRM,
            date: { $gte: startDateString, $lte: endDateString }
          }
        },
      ]).toArray();

      if (livestats.length === 0) {
    
        return res.status(200).json({ msg: "Rien de statistique trouvé pour ces dates spécifiées", success: true ,data:livestats});
      } else {
        const sumsForEachLine = calculateSumsForEachLine(livestats);
        res.status(200).json({ msg:"Des statistiques existent pour ces dates spécifiées", success: true ,data:sumsForEachLine});
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  const getLivestatByIdandDate2 = async (req, res) => {
    try {
      const idCRM = req.query.idCRM; 
      const startDateString = req.query.date1;
      const endDateString = req.query.date2;

      const db = await connectToDatabase();
      const collection = db.collection('TempsReels');

      const livestats = await collection.aggregate([
        {
          $match: {
            IdCRM: idCRM,
            date: { $gte: startDateString, $lte: endDateString }
          }
        },
      ]).toArray();
      if (livestats.length === 0) {
        return res.status(200).json({ msg: "Rien de statistique trouvé pour ces dates spécifiées", success: true ,data:livestats});
      } else {
        const sumsForEachLine = calculateSumsForEachLine(livestats);
        res.status(200).json({ msg:"Des statistiques existent pour ces dates spécifiées", success: true ,data:sumsForEachLine});
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
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

  const getTiquerId = async (req, res) => {
    try {
      const idCRM = req.query.idCRM; 
      const startDateString = req.query.date1;
      const endDateString = req.query.date2;

      const db = await connectToDatabase();
      const collection = db.collection('Tiquer');

      const livestats = await collection.aggregate([
        {
          $match: {
            idCRM: idCRM,
            Date: { $gte:  startDateString, $lte: endDateString }
          }
        },
      ]).toArray();
   
      if (livestats.length === 0) {
        return res.status(404).json({ error: "Livestats not found within the specified date range" });
      } else {
      
        res.json(livestats);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
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
    <div style="page-break-before: always;"></div>

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
<text class="HTtext">Subtotal (HT) : ${data.Totals.Total_Ht ? data.Totals.Total_Ht : ''} ${data.devise} *** *** Tax (VAT) : ${data.Totals.Total_TVA ? data.Totals.Total_TVA : ''} ${data.devise}  </text></div>
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
      const idCRM = req.params.idCRM;
      const date = req.params.date;
      const idTiquer = req.params.idTiquer;
      const db = await connectToDatabase();
      const collection = db.collection('Tiquer');
      const ticket = await collection.findOne({ IdCRM: idCRM, Date: date, idTiquer: parseInt(idTiquer) });
      
      if (!ticket) {
        return res.status(404).send('<html><body>Ticket not found</body></html>');
      }
      
      tickets = [ticket];
      let htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
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
              * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
              }
              body {
                  font-family: 'Dina', monospace;
                  background: #f5f5f5;
                  padding: 8px;
              }
              .button-container {
                  display: flex;
                  justify-content: flex-end;
                  margin-bottom: 0;
                  position: sticky;
                  top: 8px;
                  z-index: 100;
                  padding-right: 8px;
              }
              .download-btn {
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
              .download-btn img {
                  width: 32px;
                  height: 32px;
                  display: block;
              }
              .download-btn:hover {
                  opacity: 0.7;
              }
              .download-btn:active {
                  transform: scale(0.98);
              }
              .ticket {
                  background: white;
                  margin: 12px auto 8px;
                  padding: 12px;
                  border: none;
                  border-radius: 1px;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                  max-width: 350px;
                  font-family: 'Dina', monospace;
                  font-size: 12px;
                  line-height: 1.4;
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
                  .download-btn {
                      padding: 8px 12px;
                      font-size: 12px;
                  }
              }
          </style>
      </head>
      <body>
      <div class="button-container">
        <button class="download-btn" onclick="downloadPDF()"><img src="/pdf.png" alt="Download PDF" title="Download PDF"></button>
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
                  <p style="margin: 4px 0;">Ticket N°: ${ticket.idTiquer}</p>
              </div>
              <div class="header-info">
                  ${ticket.NF525 ? `<p>NF525: ${ticket.NF525}</p>` : ''}
                  ${ticket.TVA_intra ? `<p>TVA: ${ticket.TVA_intra}</p>` : ''}
                  ${ticket.NAF_code ? `<p>NAF: ${ticket.NAF_code}</p>` : ''}
                  ${(ticket.copy_type || ticket.copy_number) ? `<p>Copy${ticket.copy_type ? ` ${ticket.copy_type}` : ''}${ticket.copy_number ? ` N° : ${ticket.copy_number}` : ''}</p>` : ''}
                  ${ticket.Order_number ? `<p>Order N°: ${ticket.Order_number}</p>` : ''}
              </div>
              <div class="ticket-details">
                  <p style='margin-top: 4px;'>${formattedDate || ''} ${ticket.HeureTicket || ''}</p>
                  <p>Servi par: ADMIN</p>
              </div>
              <div class="items-list">
                  <table>
                      <thead>
                          <tr>
                              <td style="text-align: left;">ARTICLE</td>
                              <td style="text-align: right;">PU</td>
                              <td style="text-align: right;">TOTAL</td>
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
                              <td>Subtotal (HT)</td>
                              <td style="text-align: right;">${totalHT.toFixed(2)} ${ticket.currency || ticket.devise || ''}</td>
                          </tr>
                          <tr>
                              <td>Tax (VAT)</td>
                              <td style="text-align: right;">${totalTVA.toFixed(2)} ${ticket.currency || ticket.devise || ''}</td>
                          </tr>
                          <tr style="font-weight: bold; border-top: 1px solid #333;">
                              <td>TOTAL</td>
                              <td style="text-align: right;">${ticket.TTC} ${ticket.currency || ticket.devise || ''}</td>
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
                              <td>PAYMENT METHOD</td>
                              <td style="text-align: right;">AMOUNT</td>
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
                  <p>${ticket.ConsumptionMode ? ticket.ConsumptionMode.toUpperCase() : 'SUR PLACE'}</p>
              </div>
          `;
          
          // Add footer info
          if (lineCount > 0 || itemCount > 0) {
            htmlContent += `
              <div class="footer-info">
                  <p>Lines: ${lineCount} | Items: ${itemCount}</p>
            `;
            if (ticket.Signature) {
              htmlContent += `
                  <p style="margin-top: 8px; border-top: 1px solid #ddd; padding-top: 4px;">Signature: ${ticket.Signature}</p>
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
                  <p>MERCI DE VOTRE VISITE</p>
              </div>
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
            <div '><span  style='padding: 10px;'>Tax (VAT):  </span>  ${totalTVA.toFixed(1)}${ticket.devise}</div>
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

  module.exports = {updateLivestatForGetReglement,GetBaseName,sendPdfInEmail,updateStatus,sendWelcomeEmail ,generateTicketsHTML2,generateTicketsHTML,getTicketRestoById,getTiquerId,UpdateTiquer, getLivestatByIdandDate2,getAllCatInUploid,updateAllCatCripteInMongo, updateAllCatInUploid, UpdateLicence,UpdateBaseDeDonne,updateLivestat3,updateLivestat4, getLivestatByIdandDate, updateStatusStores, GetLicence, getPaymentStatistics };
