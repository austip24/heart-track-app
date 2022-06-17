let db = require("../db");

let dataSchema = new db.Schema({

    event:      String,
    data:     {
        bpm: String,  //heartrate
        spO2: String,   //blood oxygen level
        apikey: String,  //API key, should be stored on device when it is registered
        hour: String,    //time that data is recorded
	      minute: String,  
	      date: String
    },
    coreid:    String,//this is just device id
    published_at: String//time that data is sent to webhook
});

var Data = db.model("Data", dataSchema);

module.exports = Data;



