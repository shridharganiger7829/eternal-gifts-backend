const mongoose = require("mongoose");

console.log("Testing MongoDB connection...");

mongoose.connect("mongodb://127.0.0.1:27017/ecommerce")
  .then(() => {
    console.log("✅ MongoDB Connection Test: SUCCESS");
    process.exit(0);
  })
  .catch(err => {
    console.log("❌ MongoDB Connection Test: FAILED", err);
    process.exit(1);
  });
