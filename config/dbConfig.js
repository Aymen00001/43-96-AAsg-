const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
dotenv.config();

const mongoUri ='mongodb+srv://maksebstatistique:Makseb123.@cluster0.7879moy.mongodb.net/statistiques?retryWrites=true&w=majority';


const client = new MongoClient(mongoUri);

async function connectToDatabase() {
  try {
    await client.connect();
   
    return client.db(); // return the MongoDB database object
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    throw error;
  }
}

module.exports = { connectToDatabase, client };
