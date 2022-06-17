const mongoose = require("mongoose");
const mongo_username = process.env.MONGO_USERNAME;
const mongo_password = process.env.MONGO_PASSWORD;

const uri = `mongodb+srv://${mongo_username}:${mongo_password}@cluster0.uwqu7.gcp.mongodb.net/crmdb?retryWrites=true&w=majority`;
// Use this on AWS ec2 with locally installed MongoDB
// mongoose.connect("mongodb://localhost/mydb", { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });

// On repl.it with Mogno Atlas DB
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });

module.exports = mongoose;
