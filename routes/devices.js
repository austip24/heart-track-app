const express = require('express');
var Particle = require('particle-api-js');//particle api to send apikey to device!
let router = express.Router();
let jwt = require("jwt-simple");
let fs = require('fs');
let Device = require("../models/device");
let Data = require("../models/data");
// On Repl.it, add JWT_SECRET to the .env file, and use this code
let secret = process.env.JWT_SECRET

// On AWS ec2, you can use to store the secret in a separate file. 
// The file should be stored outside of your code directory. 
// let secret = fs.readFileSync(__dirname + '/../../jwtkey').toString();

// Function to generate a random apikey consisting of 32 characters
function getNewApikey() {
  let newApikey = "";
  let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
  for (let i = 0; i < 32; i++) {
    newApikey += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  return newApikey;
}

// gets the user's device information
router.get('/account', function(req, res, next) {
  let email = "";
  let decodedToken = jwt.decode(req.headers["x-auth"], secret);
  email = decodedToken.email;
  console.log("Devices List from " + email);
  Device.find({userEmail: email}, function(err, devices) {
    if (devices !== null) {
      console.log("Devices found successfully");
      console.log({'list': devices});
      return res.status(200).json({list: devices});
    }
    else{
      console.log("Update found error");
      return res.status(400)
    }
  });
});


// gets a device matching a specific id and sends the apikey for that device
// this endpoint is intended to be used by the webhook for the particle device,
// and facilitates any subsequent POST requests made by the particle device through
// the /data/ endpoint on the server
router.get('/byID', function(req, res, next) {
  console.log("Particle with id:");
  console.log(req.query.coreid);
  console.log("is requesting apikey.");
  let id = req.query.coreid; // default query parameter for device id
  Device.findOne({deviceId: id}, function(err, device) {
    console.log("Following Device requesting apikey from Particle: ");
    console.log(device);
    if (!device) {
      console.log("Device with id " + id + " not found.");
      res.status(400).json({message: "Not found"});
    }
    else {
      res.status(200).send(device.apikey + " " + device.measureTime[0] + " " + device.measureTime[1] + " " + device.measureFrequency);
    }
  });
});

router.post('/remove', function(req, res, next) {
  let email = "";
  let decodedToken = jwt.decode(req.headers["x-auth"], secret);
  email = decodedToken.email;
  console.log("Removing device from " + email);
  console.log("The device id from removing device is:" + req.body.id);
  Device.findOneAndRemove({deviceId: req.body.id}, function(err, device){
    if (device === null) {
      console.log("No device deleted");
      res.status(400);
    } 
    else {
        Data.remove({coreid:  req.body.id}, function(err){
        if(err){
          console.log("Error removing the data of the device.");
          consle.log(err);
        }
        console.log("Removed");
      });
      console.log("Removed device " + device);
      res.status(200);
    }
  });
});

router.post('/register', function(req, res, next) {//this needs to send created api
  let responseJson = {
    registered: false,
    message : "",
    apikey : "none",
    deviceId : "none"
  };
  let deviceExists = false;
  
  // Ensure the request includes the deviceId parameter
  if( !req.body.hasOwnProperty("deviceId")) {
    responseJson.message = "Missing deviceId.";
    return res.status(400).json(responseJson);
  }
 
  let email = "";
    
  // If authToken provided, use email in authToken 
  if (req.headers["x-auth"]) {
    try {
      let decodedToken = jwt.decode(req.headers["x-auth"], secret);
      email = decodedToken.email;
    }
    catch (ex) {
      responseJson.message = "Invalid authorization token.";
      return res.status(401).json(responseJson);
    }
  }
  else {
    // Ensure the request includes the email parameter
    if( !req.body.hasOwnProperty("email")) {
      responseJson.message = "Invalid authorization token or missing email address.";
      return res.status(401).json(responseJson);
    }
    email = req.body.email;
  }
    
  // See if device is already registered
  Device.findOne({ deviceId: req.body.deviceId }, function(err, device) {
    if (device !== null) {
      responseJson.message = "Device ID " + req.body.deviceId + " already registered.";
      return res.status(400).json(responseJson);
    }
    else {
      // Get a new apikey
	   deviceApikey = getNewApikey();

     //We need the password and email of the user's particle account to send api key
/////////////////////////////////////////////////////
 
	    // Create a new device with specified id, user email, and randomly generated apikey.
      let newDevice = new Device({
        deviceId: req.body.deviceId,
        token: req.body.particlePass,
        userEmail: email,
        apikey: deviceApikey
      });

      // Save device. If successful, return success. If not, return error message.
      newDevice.save(function(err, newDevice) {
        if (err) {
          responseJson.message = err;
          // This following is equivalent to: res.status(400).send(JSON.stringify(responseJson));
          return res.status(400).json(responseJson);
        }
        else {
          responseJson.registered = true;
          responseJson.apikey = deviceApikey;
          responseJson.deviceId = req.body.deviceId;
          responseJson.message = "Device ID " + req.body.deviceId + " was registered.";
          return res.status(201).json(responseJson);
        }
      });
    }
  });
});

router.post('/ping', function(req, res, next) {
  console.log(req.body.deviceId);//DEBUG
    let responseJson = {
        success: false,
        message : "",
    };
    let deviceExists = false;
    
    // Ensure the request includes the deviceId parameter
    if( !req.body.hasOwnProperty("deviceId")) {
        responseJson.message = "Missing deviceId.";
        return res.status(400).json(responseJson);
    }
    
    // If authToken provided, use email in authToken 
    try {
        let decodedToken = jwt.decode(req.headers["x-auth"], secret);
    }
    catch (ex) {
        responseJson.message = "Invalid authorization token.";
        return res.status(400).json(responseJson);
    }
    
    request({
       method: "POST",
       uri: "https://api.particle.io/v1/devices/" + req.body.deviceId + "/pingDevice",
       form: {
	       access_token : particleAccessToken,
	       args: "" + (Math.floor(Math.random() * 11) + 1)
        }
    });
            
    responseJson.success = true;
    responseJson.message = "Device ID " + req.body.deviceId + " pinged.";
    return res.status(200).json(responseJson);
});

router.put('/updateTime', function(req, res){
  console.log("In updateTime router for device:");
  console.log(req.body);
  console.log(req.body.deviceId);
  console.log(req.body.measureTime[0]);
  const update = {
  "$set": {
    "measureTime": [req.body.measureTime[0],req.body.measureTime[1]]
    }
  };
  Device.update({deviceId: req.body.deviceId}, update).then(updatedDocument => {
    if(updatedDocument) {
      console.log(`Successfully updated.`);
      return res.status(200).send("Successfully updated.");
    } else {
      console.log("No document matches the provided query.");
      return res.status(400).send("Fai updated.");
    }
    });
});

router.put('/updateFrequency', function(req, res){
  console.log("In updateFrequency router for device:");
  console.log(req.body.deviceId);
  const update = {
  "$set": {
    "measureFrequency": req.body.measureFrequency
    }
  };
  Device.update({deviceId: req.body.deviceId}, update).then(updatedDocument => {
    if(updatedDocument) {
      console.log(`Successfully updated.`);
      res.status(200).send("Successfully updated.");
    } else {
      console.log("No document matches the provided query.");
      res.status(400).send("Fai updated.");
    }
    });
});
module.exports = router;
