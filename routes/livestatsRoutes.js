const express = require("express");
const livestatsController = require("../controllers/livestatsController.js");
const verifyToken = require("../utils/verifyToken.js");

const {updateLivestatForGetReglement,UpdateBaseDeDonne,GetBaseName,sendPdfInEmail,sendWelcomeEmail,generateTicketsHTML2,generateTicketsHTML,getTicketRestoById,getTiquerId,UpdateTiquer,getLivestatByIdandDate2,getAllCatInUploid,updateLivestat4,updateAllCatCripteInMongo,updateAllCatInUploid, getLivestatByIdandDate,   updateLivestat3,updateStatusStores ,GetLicence ,UpdateLicence} = livestatsController;
const { verifyAccessToken } = verifyToken;

const livestatsRoutes = express.Router();

livestatsRoutes.post("/Update3", updateLivestat3);
livestatsRoutes.post("/Update4", updateLivestat4);
livestatsRoutes.post("/UpdateGetReglement", updateLivestatForGetReglement);
livestatsRoutes.post("/UpdateTiquer", UpdateTiquer);
livestatsRoutes.post("/sendemail", sendWelcomeEmail);
livestatsRoutes.post("/sendPdfInemail", sendPdfInEmail);



livestatsRoutes.get("/SumData", getLivestatByIdandDate);
livestatsRoutes.get("/SumData2", getLivestatByIdandDate2);

livestatsRoutes.get("/GetTiquer", getTiquerId);

livestatsRoutes.post("/statusStores", updateStatusStores);

livestatsRoutes.get("/GetLicence/:idCRM", GetLicence);
livestatsRoutes.get("/GetBaseName/:idCRM", GetBaseName);
livestatsRoutes.get("/UpdateLicence/:idCRM/:action", UpdateLicence);
livestatsRoutes.get("/UpdateBaseDeDonne/:idCRM/:action", UpdateBaseDeDonne);

livestatsRoutes.post("/updateAllCatInFolder", updateAllCatInUploid);
livestatsRoutes.post("/updateAllCatInMongobd", updateAllCatCripteInMongo);
livestatsRoutes.get("/GetImages", getAllCatInUploid);


livestatsRoutes.get("/AfficheTicket", generateTicketsHTML);
livestatsRoutes.get("/AfficheTicket2", generateTicketsHTML2);
livestatsRoutes.get("/AfficheTicketResto/:idTiquer", getTicketRestoById);

module.exports = livestatsRoutes;
