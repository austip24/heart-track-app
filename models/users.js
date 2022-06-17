let db = require("../db");

let userSchema = new db.Schema({
  email:          { type: String, required: true, unique: true },
  fullName:       { type: String, required: true },
  passwordHash:   String,
  dateRegistered: { type: Date, default: Date.now },
  lastAccess:     { type: Date, default: Date.now },
  userDevicesIDs:    [String],
  phys: String // this will be the physician's name
});

let User = db.model("User", userSchema);

module.exports = User;

