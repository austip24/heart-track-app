const express = require('express');
let router = express.Router();
let bcrypt = require("bcryptjs");
let jwt = require("jwt-simple");
let fs = require('fs');
let User = require('../models/users');
let Data = require('../models/data');

// FIXME: This is really bad practice to put an encryption key in code.
//let secret = "notasecretkeyyet";

// On Repl.it, add JWT_SECRET to the .env file, and use this code
let secret = process.env.JWT_SECRET;

// On AWS ec2, you can use to store the secret in a separate file. 
// The file should be stored outside of your code directory. 
// let secret = fs.readFileSync(__dirname + '/../../jwtkey').toString();
//asdasdasd
// Register a new user
router.post('/register', function(req, res) {
  bcrypt.hash(req.body.password, 10, function(err, hash) {
    if (err) {
      res.status(400).json({success : false, message : err.errmsg});  
    }
    else {
      let newUser = new User({
        email: req.body.email,
        fullName: req.body.fullName,
        passwordHash: hash
      });

      newUser.save(function(err, user) {
        if (err) {
          res.status(400).json({success: false,
                                message: err.errmsg});
        }
        else {
          res.status(201).json({success: true,
                                message: user.fullName + " has been created."});
        }
      });
    }
  });    
});

// Authenticate a user
router.post('/signin', function(req, res) {
  User.findOne({email: req.body.email}, function(err, user) {
    if (err) {
      res.status(401).json({ success: false, message: "Can't connect to DB." });
    }
    else if (!user) {
      res.status(401).json({ success: false, message: "Email or password invalid." });
    }
    else {
      bcrypt.compare(req.body.password, user.passwordHash, function(err, valid) {
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

     User.findOne({email: decodedToken.email}, function(err, user) {
       if (err) {
         res.status(400).json({ success: false, message: "Error contacting DB. Please contact support."});
       }
       else {
         accountInfo["success"] = true;
         accountInfo["email"] = user.email;
         accountInfo["fullName"] = user.fullName;
         accountInfo["lastAccess"] = user.lastAccess;
         accountInfo["id"] = user._id; //Added this line to update user
         accountInfo['devices'] =  user.userDevicesIDs;   // Array of devices
         accountInfo['phys'] = user.phys;
         console.log("User devices: ");
         console.log(accountInfo['devices']);

         res.status(200).json(accountInfo);
       }
     });
  }
  catch (ex) {
    // Token was invalid
    res.status(401).json({ success: false, message: "Invalid authentication token."});
  }
});

router.put('/update', function(req, res){
  bcrypt.hash(req.body.password, 10, function(err, hash) {
    if (err) {
      console.log("Update Failure because hashing")
      res.status(402).json({success: false, message: 'Update Failure'});
    }
    else{
      User.findById(req.body.id, function(err, user) {
        if (user === null) {
          console.log("Update Failure because Id not found");
          res.status(402).json({success: false, message: 'Update Failure'});
        }
        else {
          user.fullName = req.body.name;
          user.passwordHash = hash;
          user.save(function(err, user) {
            res.status(200).json({success: true, message: 'Update successful'});
          });
        }
      });
    }
  });
});

router.put('/addDevice', function(req, res){
    let theID = req.body.userID; 
    console.log("This is the device id: " + req.body.deviceID);
    User.findById(theID, function(err, user) {
      if (user === null) {
        res.status(402).json({success: false, message: 'Update failure'});
        console.log("'Update failure");
      }
      else {
        console.log("Before");
        console.log(user.userDevicesIDs);
        user.userDevicesIDs.push(req.body.deviceID);
        console.log("After");
        console.log(user.userDevicesIDs);
        user.save(function(err, user) {
          res.status(200).json({success: true, message: 'Update successful'});
          console.log("'Update successful");
        });
      }
    });
});

router.put('/removeDevice', function(req, res){
  let theID = req.body.userId;
  console.log("The user " + theID);
  console.log("Is removing device:" + req.body.deviceId)
  User.findById(theID, function(err, user) {
    if (user === null) {
      res.status(402).json({success: false, message: 'Removing Device failure'});
      console.log("Removing Device failure");
    }
    else {
      console.log("Before");
      console.log(user.userDevicesIDs);
      let newArray = [];
      for (let deviceId of user.userDevicesIDs) {
        if(deviceId != req.body.deviceId){
          newArray.push(deviceId);
        }
      }
      user.userDevicesIDs = newArray;
      console.log("After");
      console.log(user.userDevicesIDs);
      user.save(function(err, user) {
        res.status(200).json({success: true, message: 'Removing Device successful'});
        console.log("Removing Device successful");
      });
    }
  });
});

/*
This function updates the user's physician.
*/
router.put('/choosePhysician', function(req, res) {
  let physName = req.body.phys;
  User.findById(req.body.id, function(err, user) {
        if (user === null) {
          console.log("User ID not found");
          res.status(402).json({success: false, message: 'Failed to choose physician'});
        }
        else {
          user.phys = physName;
          user.save(function(err, user) {
            res.status(200).json({success: true, name: physName, message: 'Physician ' + physName + ' chosen.'});
          });
        }
    });
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
Responds with the weekly summary view that shows the user's average, minimum, and
maximum heart rate for the past 7 days.
*/
router.get('/weeklySummary', async function(req, res) {
  if (!req.headers["x-auth"]) {
    res.status(401).json({ success: false, message: "No authentication token."});
    return;
  }

  let resObject = [];
  let heartRates = [];
  let authToken = req.headers["x-auth"];

  try {
    // Token decoded
    let decodedToken = jwt.decode(authToken, secret);
    const userQuery = User.findOne({email: decodedToken.email});
    const userResult = await userQuery.exec();

    // there does not exist a user with the email sent in the request
    if (!userResult) {
      console.log("User with email does not exist.");
      res.status(400).json({ success: false, message: "User with email does not exist." });
    }
    else if (userResult.userDevicesIDs.length == 0) {
      console.log("User " + userResult.fullName + " has no devices registered.");
      res.status(400).json({ success: false, name: userResult.fullName, message: "No devices registered."})
    }
    else {
      for (let i = 0; i < userResult.userDevicesIDs.length; i++) {
        let id = userResult.userDevicesIDs[i];

        // perform query for finding device's data
        const dataQuery = Data.find({coreid: id});
        const dataResult = await dataQuery.exec();

        // determine if the device's data has been recorded in the past 7 days
        // if so, then add the bpm recording to the heartRates array
        for (let j = 0; j < dataResult.length; j++) {
          let date = new Date(dataResult[j].published_at * 1.0);
          if (dateIsValid(date)) {
            heartRates.push(dataResult[j].data.bpm);
          }
        }
        // user has recorded data with this device in the past 7 days
        // perform calculations or avg, min, and max
        if (heartRates.length > 0) {
          resObject.push(JSON.stringify({
                      name: userResult.fullName,
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
        // user has not recorded data with this device in the past 7 days
        else {
          resObject.push(JSON.stringify({name: userResult.fullName, message: "No data recorded by " + p.fullName + " with  device " + id + " in the last 7 days."}));
          console.log("No data recorded for device " + id + " in the last 7 days.");
        }
        heartRates.length = 0; // clear heartRates array for next calculation
      }
      console.log(resObject);
      res.status(200).json(resObject); // send 200 response and resObject to client
    }
  }
  catch (ex) {
    // Token was invalid
    res.status(401).json({ success: false, message: "Invalid authentication token."});
  }
});

module.exports = router;
