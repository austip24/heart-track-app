const express = require('express');
let router = express.Router();
let bcrypt = require("bcryptjs");
let jwt = require("jwt-simple");
let fs = require('fs');
let Devices = require('../models/device');
let Data = require('../models/data');
let User = require('../models/users');
let Physicians = require('../models/phys');

// FIXME: This is really bad practice to put an encryption key in code.
//let secret = "notasecretkeyyet";

// On Repl.it, add JWT_SECRET to the .env file, and use this code
let secret = process.env.JWT_SECRET;

/*
Gets all of the physicians stored in the database
*/
router.get('/', function(req, res) {
  Physicians.find({}, function(err, physicians) {
    if (err) {
      res.status(401).json({ success: false, message: "Can't connect to DB"});
    }
    else {
      res.status(200).json(physicians);
    }
  });
});

// Register a new physician
router.post('/register', function(req, res) {
  console.log("I should be registering a new phys!");
  bcrypt.hash(req.body.password, 10, function(err, hash) {
    if (err) {
      res.status(400).json({success : false, message : err.errmsg});  
    }
    else {
      let newPhys = new Physicians({
        email: req.body.email,
        fullName: req.body.fullName,
        passwordHash: hash
      });

      newPhys.save(function(err, phys) {
        if (err) {
          res.status(400).json({success: false,
                                message: err.errmsg});
        }
        else {
          res.status(201).json({success: true,
                                message: phys.fullName + " has been created."});
        }
      });
    }
  });    
});

// Physician sign-in
router.post('/signin', function(req, res) {
  Physicians.findOne({email: req.body.email}, function(err, phys) {
    if (err) {
      res.status(401).json({ success: false, message: "Can't connect to DB." });
    }
    else if (!phys) {
      res.status(401).json({ success: false, message: "Email or password invalid." });
    }
    else {
      bcrypt.compare(req.body.password, phys.passwordHash, function(err, valid) {
        if (err) {
          res.status(401).json({ success: false, message: "Error authenticating. Contact support." });
        }
        else if(valid) {
          let authToken = jwt.encode({email: req.body.email}, secret);
          res.status(201).json({ success: true, authToken: authToken });
        }
        else {
          res.status(401).json({ success: false, message: "Email or password invalid." });
        }
      });
    }
  });
});

// Return account information
router.get('/account', function(req, res) {
  if (!req.headers["x-auth"]) {
    res.status(401).json({ success: false, message: "No authentication token."});
    return;
  }

  let authToken = req.headers["x-auth"];
  let accountInfo = { };

  try {
     // Token decoded
     let decodedToken = jwt.decode(authToken, secret);

     Physicians.findOne({email: decodedToken.email}, function(err, phys) {
       if (err) {
         res.status(400).json({ success: false, message: "Error contacting DB. Please contact support."});
       }
       else {
         accountInfo["success"] = true;
         accountInfo["email"] = phys.email;
         accountInfo["fullName"] = phys.fullName;
         accountInfo["lastAccess"] = phys.lastAccess;
         accountInfo["id"] = phys._id;  
         res.status(200).json(accountInfo);
       }
     });
  }
  catch (ex) {
    // Token was invalid
    res.status(401).json({ success: false, message: "Invalid authentication token."});
  }
});

/*
This functions checks if a given date was recorded within the last 7 days.
Returns true if the date was recorded within the last 7 days, false otherwise.
*/
function dateIsValid(date) {
  return (Date.now() - date.getTime()) <= 7 * 8.64 * Math.pow(10, 7);
}

/*
This function calculates the average of an array.
*/
function calcAverageHeartRate(heartRates) {
  let sum = 0;
  for (let i = 0; i < heartRates.length; i++) {
    sum += heartRates[i] * 1.0;
  }
  return sum / heartRates.length;
}

/*
 The all patient's view will list all patients by name with their 7-day average, maximum, and minimum heart rate
*/

router.get('/allPatients', async function(req, res) {
  let physName = req.query.phys;
  let resObject = [];
  let heartRates = [];
  
  // find all users with the physician that was queried
  const userQuery = User.find({phys: physName});
  const patients = await userQuery.exec();
  /*
    if (err) { // an error occurred
      res.status(401).json({ success: false, message: "Can't connect to DB." });
      return;
    }
  */
    if (patients.length == 0) { // the physician has no patients
      //console.log("This physician has no patients");
      res.status(400).json({ success: false, message: "This physician has no patients" });
      return;
    }
    else {
      console.log("The physician has patient(s)...");
      // go through all patients of the physician
      for (let p of patients) {
        // patient has no devices
        if (p.userDevicesIDs.length == 0) {
          //console.log("Patient " + p.fullName + " does not have any devices registered.");
          resObject.push({name: p.fullName, message: "No devices registered."});
           
        }
        // patient has devices, need to check their data
        else {
          //console.log("patient " + p.fullName + " has devices, need to hekc their data - line 170");
          // check all devices
          for (let i = 0; i < p.userDevicesIDs.length; i++) {
            let id = p.userDevicesIDs[i];
            // find the data for each given device own by each user
            const dataQuery = Data.find({coreid: id}); 
            const result = await dataQuery.exec();

            //console.log("executed Data.find(({coreid: id}) - line 175");
              // if (err) { // an error occurred
              //   res.status(401).json({ success: false, message: "Can't connect to DB." });
              //   return;
              // }
             // console.log("In dataQuery callback for " + p.fullName);
              if (result.length == 0) { // the device doesn't have any data recorded
                //console.log("No data recorded for device " + id);
                resObject.push(JSON.stringify({name: p.fullName, deviceID: id, message: "No data recorded by " + p.fullName + "with device " + id}));
                // 
              }
              else { // data has been found
                // record all of the heart rates for the current device
                //console.log("Data found for " + p.fullName);
                for (let i = 0; i < result.length; i++) {
                  let date = new Date(result[i].published_at * 1.0);
                  if (dateIsValid(date)) { // data has been recorded within the past week
                    heartRates.push(result[i].data.bpm);
                  }
                }
                // at least one heart rate... perform calculates for min, max, and average over the past week
                //console.log("Heart Rates for " + p.fullName + ": " + heartRates);
                //console.log(heartRates.length > 0);
                if (heartRates.length > 0) {
                  resObject.push(JSON.stringify({
                    name: p.fullName,
                    deviceID: id,
                    avg: calcAverageHeartRate(heartRates),
                    max: heartRates.reduce((a,b) => {
                      return Math.max(a, b);
                    }),
                    min: heartRates.reduce((a,b) => {
                      return Math.min(a, b);
                    })
                  }));
                   
                }
                else {
                  resObject.push(JSON.stringify({name: p.fullName, message: "No data recorded by " + p.fullName + " with any devices in the last 7 days."}));
                   
                  //console.log("No data recorded for device " + id + " in the last 7 days.");
                }
                //console.log("response object: " + resObject);
                heartRates.length = 0; // empty the heartRates array for the next calculation
              }
            }
          }
        }
      }
      
      resObject = "["+resObject+"]";
      console.log("allPatients response: " + resObject);
      res.status(200).json(resObject);
});


/*
The patient's summary view is similar to the weekly summary view for a user, but also includes controls that allow the physician to adjust the frequency of measurement. 
*/
router.put('/summary', function(req, res) {

});

/*
The patient's detailed day view will present the same information as the detailed day view for the user. 
*/
router.get('/detailedDay', function(req, res) {

});

module.exports = router;
