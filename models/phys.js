let db = require("../db");

let physSchema = new db.Schema({
  email:          { type: String, required: true, unique: true },
  fullName:       { type: String, required: true },
  passwordHash:   String,
  dateRegistered: { type: Date, default: Date.now },
  lastAccess:     { type: Date, default: Date.now }
  });

let Phys = db.model("Phys", physSchema);

module.exports = Phys;

