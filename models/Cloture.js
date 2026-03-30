const mongoose = require("mongoose");

const clotureSchema = new mongoose.Schema({
  IDCloture: {
    type: Number,
    required: true,
    unique: true
  },
  Date_cloture: {
    type: Date,
    required: true
  },
  RETRAIT: {
    type: mongoose.Types.Decimal128,
    default: 0
  },
  ajout: {
    type: mongoose.Types.Decimal128,
    default: 0
  },
  HeureCloture: {
    type: String, // TIME type, stored as string
    required: true
  },
  User: {
    type: String,
    maxlength: 50
  },
  RECETTE: {
    type: mongoose.Types.Decimal128,
    default: 0
  },
  IdCRM: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
clotureSchema.index({ IdCRM: 1, Date_cloture: 1 });
clotureSchema.index({ IdCRM: 1, IDCloture: 1 });

const Cloture = mongoose.model("Cloture", clotureSchema);

module.exports = Cloture;