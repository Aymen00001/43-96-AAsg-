const express = require("express");
const path = require("path");
const livestatsController = require("../controllers/livestatsController.js");
const verifyToken = require("../utils/verifyToken.js");

const {updateLivestatForGetReglement,UpdateBaseDeDonne,GetBaseName,sendPdfInEmail,sendWelcomeEmail,generateTicketsHTML2,generateTicketsHTML,getTicketRestoById,getTiquerId,UpdateTiquer,getLivestatByIdandDate2,getAllCatInUploid,updateLivestat4,updateAllCatCripteInMongo,updateAllCatInUploid, getLivestatByIdandDate,   updateLivestat3,updateStatusStores ,GetLicence ,UpdateLicence} = livestatsController;
const { verifyAccessToken } = verifyToken;

const livestatsRoutes = express.Router();

// Sales statistics endpoints
livestatsRoutes.post("/update-live-stats", updateLivestat3);
livestatsRoutes.post("/update-transaction-data", updateLivestat4);
livestatsRoutes.post("/update-payment-settlement", updateLivestatForGetReglement);
livestatsRoutes.post("/update-ticket", UpdateTiquer);

// Email endpoints
livestatsRoutes.post("/send-welcome-email", sendWelcomeEmail);
livestatsRoutes.post("/send-pdf-email", sendPdfInEmail);

// Data retrieval endpoints
livestatsRoutes.get("/get-sales-summary", getLivestatByIdandDate);
livestatsRoutes.get("/get-detailed-sales-summary", getLivestatByIdandDate2);
livestatsRoutes.get("/get-tickets", getTiquerId);

// Store management endpoints
livestatsRoutes.post("/update-store-status", updateStatusStores);
livestatsRoutes.get("/get-license/:idCRM", GetLicence);
livestatsRoutes.get("/get-store-name/:idCRM", GetBaseName);
livestatsRoutes.get("/update-license/:idCRM/:action", UpdateLicence);
livestatsRoutes.get("/update-database/:idCRM/:action", UpdateBaseDeDonne);

// Category and image synchronization endpoints
livestatsRoutes.post("/sync-categories-to-folder", updateAllCatInUploid);
livestatsRoutes.post("/sync-categories-to-database", updateAllCatCripteInMongo);
livestatsRoutes.get("/get-product-images", getAllCatInUploid);

// Ticket display endpoints
livestatsRoutes.get("/display-tickets", generateTicketsHTML);
livestatsRoutes.get("/display-tickets-detailed", generateTicketsHTML2);
livestatsRoutes.get("/display-ticket-receipt/:idCRM/:date/:idTiquer", getTicketRestoById);

// API Documentation
livestatsRoutes.get("/help", (req, res) => {
  res.sendFile(path.join(__dirname, '../public/api-docs.html'));
});

module.exports = livestatsRoutes;
