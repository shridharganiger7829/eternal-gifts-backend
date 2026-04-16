const express = require("express");
const router = express.Router();

// Simple test route
router.get("/", (req, res) => {
  res.json([{ message: "Test orders working" }]);
});

router.post("/", (req, res) => {
  res.json({ message: "Order created", data: req.body });
});

module.exports = router;
