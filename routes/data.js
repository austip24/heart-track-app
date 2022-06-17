const express = require('express');
let router = express.Router();
let jwt = require("jwt-simple");
let fs = require('fs');
let Data = require("../models/data");
let Device = require("../models/device");

// On Repl.it, add JWT_SECRET to the .env file, and use this code
let secret = process.env.JWT_SECRET

/* POST: Add data. */


router.post('/', function(req, res, next) {
  var responseJson = { 
    status : "",
    message : ""
  };
  var reqJSON;
  console.log("I am in data route!");//DEBUG
  console.log(req.body);//DEBUG
  //req.body.data = JSON.parse(req.body.data) //Depeding on how the WebHook is set, you might need to parse through the data.
  // Ensure the POST data include propert data. Ensure data includes bpm, spO2, time, and apikey
  if( !req.body.hasOwnProperty("data") ) {
    responseJson.status = "ERROR";
    responseJson.message = "Request is missing data!";
    return res.status(400).send(JSON.stringify(responseJson));
  }
  else{
    console.log("I MADE IT THIS FAR");//DEBUG
    reqJSON = JSON.parse(req.body.data);
    //reqJSON = req.body.data;
    console.log("Can I make it past this?");//DEBUG
    // previous condition: !req.body.data.hasOwnProperty("apikey")
    // for all these if statements, replace  reqJSON with req.body.data
    if( !reqJSON.hasOwnProperty("apikey") ) {
      responseJson.status = "ERROR";
      responseJson.message = "Request missing API key, please register your device!";
      return res.status(400).send(JSON.stringify(responseJson));
    }
    
    if( !reqJSON.hasOwnProperty("bpm") ) {
      responseJson.status = "ERROR";
      responseJson.message = "Request missing bpm parameter.";
      return res.status(400).send(JSON.stringify(responseJson));
    }

    if( !reqJSON.hasOwnProperty("spO2") ) {
      responseJson.status = "ERROR";
      responseJson.message = "Request missing spO2 parameter.";
      return res.status(400).send(JSON.stringify(responseJson));
    }

    // if( !reqJSON.hasOwnProperty("time") ) {
    //   responseJson.status = "ERROR";
    //   responseJson.message = "Request missing time parameter.";
    //   return res.status(201).send(JSON.stringify(responseJson));
    // }
  }
  // Find the device and verify the apikey
  console.log("Finding Device");
  Device.findOne({ deviceId: req.body.coreid }, function(err, device) {
    console.log("This is the device found:");
    console.log(device);
    let apikey = reqJSON.apikey.trim();
    if (device !== null) {
      if (device.apikey.trim() != apikey) {//make sure device is registered by checking apikey
        responseJson.status = "ERROR";
        responseJson.message = "Invalid apikey for device id " + req.body.coreid + ". Please register your device with HeartTrack.";
        return res.status(400).send(JSON.stringify(responseJson));
      }
      else {//this forward only occurs if device is registered and provided apikey
        // Create a new data point
        var newData = new Data({
          event:     req.body.event,
          data:    reqJSON,
          coreid:    req.body.coreid,
          published_at: req.body.published_at
        });

        // Save device. If successful, return success. If not, return error message.                          
        newData.save(function(err, newData) {
          if (err) {
            responseJson.status = "ERROR";
            responseJson.message = "Error saving data in db.";
            return res.status(500).send(JSON.stringify(responseJson));
          }
          else {
            responseJson.status = "OK";
            responseJson.message = "Data saved in db with object ID " + newData._id + ".";
            return res.status(201).send(JSON.stringify(responseJson));
          }
        });
      }
    } 
    else {
      responseJson.status = "ERROR";
      responseJson.message = "Device ID " + req.body.coreid + " not registered.";
      // change to 400 (bad request) ?
      return res.status(400).send(JSON.stringify(responseJson));    
    }
  });
  
});

// GET: Sensor data
router.get('/data', function(req, res, next) {
   // TODO: Get the desired sensor data from db based on req
  console.log("Getting data from sensor");
  // console.log(req);
  console.log(req.query.deviceId);
  resObject = [];
  Data.find({ coreid: req.query.deviceId }, function(err, allData) {
    if (err) { // an error occurred
      res.status(401).json({ success: false, message: "Can't connect to DB." });
    }
    else if (allData.length == 0) { // no devices were found with the given id
      console.log("No data for this device.");
      res.status(400).json({ success: false, message: "No data for this device." });
    }
    else {
      console.log("allData is valid...");
      for (let each of allData) {
        resObject.push({
          avgBPM: each.data.bpm, // recommend changing data.data to data.avgBPM at some point
          spO2: each.data.spO2,
          hour: each.data.hour,    //time that data is recorded
	        minute: each.data.minute
          //bloodOxygen:
          //I figured out data
        });
      }
      console.log(resObject);
      res.status(200).json(resObject);
    }
  });
});


module.exports = router;