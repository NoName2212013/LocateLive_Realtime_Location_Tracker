const mongoose = require('mongoose');
const dbgr = require('debug')('development:mongoose');
const config = require("config");

mongoose.connect(config.get("MONGODB_URI"))
.then(()=>{
    dbgr("connected");
    console.log("Database Connected...");
})
.catch((err)=>{
    dbgr(err);
})

module.exports = mongoose.connection;