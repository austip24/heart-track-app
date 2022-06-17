let db = require("../db");

let deviceSchema = new db.Schema({
    apikey:       String,
    token:        String,//this is so that the device may be accessed from the web application
    deviceId:     String,
    userEmail:    String,
    lastContact:  { type: Date, default: Date.now },
    measureTime: {type: [String], default: ['6', '22']}, //Default 6AM to 10PM
    measureFrequency: {type: String, default: '30'} //Default 30 minutes betw
});

var Device = db.model("Device", deviceSchema);

module.exports = Device;
