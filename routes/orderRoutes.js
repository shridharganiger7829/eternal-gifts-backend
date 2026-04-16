const express = require("express");
const Order = require("../models/Order.js");

const router = express.Router();

// CREATE ORDER
router.post("/", (req, res) => {
  try {
    const order = Order.create(req.body);
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error creating order", error });
  }
});

// GET ALL ORDERS
router.get("/", (req, res) => {
  try {
    const orders = Order.find().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error });
  }
});

// UPDATE STATUS
router.put("/:id", (req, res) => {
  try {
    const updated = Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status }
    );
    if (updated) {
      res.json(updated);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error updating order", error });
  }
});

// DELETE ORDER
router.delete("/:id", (req, res) => {
  try {
    const deleted = Order.findByIdAndDelete(req.params.id);
    if (deleted) {
      res.json(deleted);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting order", error });
  }
});

module.exports = router;
