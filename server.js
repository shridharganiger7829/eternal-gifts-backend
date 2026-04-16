const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Connect to MongoDB (with fallback)
const mongoose = require("mongoose");
const Order = require("./models/Order");
const Product = require("./models/Product");

// Try to connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.log("❌ MongoDB Connection Error:", err);
    console.log("⚠️ Make sure MongoDB is running on localhost:27017");
    console.log("⚠️ Install MongoDB if not installed");
    console.log("🔄 Using in-memory storage as fallback");
  });

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public/images
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'public/images');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Routes

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error });
  }
});

// Add new product
app.post('/api/products', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ message: 'Error adding product' });
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Error fetching product", error });
  }
});

// Admin routes for product management

// Image upload route
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    
    // Return the image URL
    res.json({
      imageUrl: `/images/${req.file.filename}`
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Error uploading image' });
  }
});

// Image deletion route
app.delete('/api/delete-image', (req, res) => {
  try {
    const { imagePath } = req.body;
    
    if (!imagePath) {
      return res.status(400).json({ message: 'No image path provided' });
    }
    
    // Extract filename from imagePath (e.g., "/images/filename.jpg" -> "filename.jpg")
    const filename = imagePath.replace('/images/', '');
    const filePath = path.join(__dirname, '../public/images', filename);
    
    // Check if file exists and delete it
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('Deleted image file:', filePath);
      res.json({ message: 'Image deleted successfully' });
    } else {
      console.log('Image file not found:', filePath);
      res.json({ message: 'Image file not found, but that\'s okay' });
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: 'Error deleting image' });
  }
});

// Add new product
app.post('/api/products', async (req, res) => {
  try {
    // Generate unique ID
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    
    const newProduct = {
      id: newId,
      ...req.body
    };
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ message: 'Error adding product' });
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    products[productIndex] = { ...products[productIndex], ...req.body };
    res.json(products[productIndex]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    console.log(`Attempting to delete product with ID: ${productId}`);
    console.log(`Current products count: ${products.length}`);
    
    const productIndex = products.findIndex(p => p.id === productId);
    console.log(`Product index found: ${productIndex}`);
    
    if (productIndex === -1) {
      console.log('Product not found');
      return res.status(404).json({ message: 'Product not found' });
    }
    
    console.log(`Product deleted: ${deletedProduct.name}`);
    console.log(`Product deleted successfully`);
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    console.log('=== NEW ORDER RECEIVED ===');
    console.log('Order data:', req.body);

    const orderData = req.body;

    if (!orderData.email) {
      return res.status(400).json({ message: 'Customer email is required' });
    }

    const newOrder = new Order({
      ...orderData,
      orderId: 'ORD' + Date.now(),
      orderDate: new Date().toLocaleDateString(),
      deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      status: 'Confirmed',
      createdAt: new Date()
    });

    await newOrder.save();

    // Respond INSTANTLY - no email processing in request thread
    console.log('=== ORDER PROCESSING COMPLETE ===');
    res.status(201).json({
      message: 'Order placed successfully',
      order: newOrder
    });

    // Send emails in completely separate process (no blocking)
    console.log('=== QUEUING EMAILS FOR BACKGROUND PROCESSING ===');
    
    // Use setTimeout with 0ms to send emails in next event loop cycle
    setTimeout(() => {
      Promise.all([
        transporter.sendMail({
          from: `"Eternal Gifts" <${process.env.EMAIL_USER}>`,
          to: process.env.SELLER_EMAIL || 'vireshhalasi725@gmail.com',
          subject: `New Order Received - Order #${newOrder.orderId}`,
          html: `
            <h2>New Order Received</h2>
            <p><strong>Order ID:</strong> ${newOrder.orderId}</p>
            <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Customer Name:</strong> ${newOrder.customerName}</p>
            <p><strong>Customer Email:</strong> ${newOrder.email}</p>
            <p><strong>Customer Phone:</strong> ${newOrder.phone}</p>
            <p><strong>Address:</strong> ${newOrder.address}, ${newOrder.city}, ${newOrder.state} - ${newOrder.pincode}</p>
            
            <h3>Order Details:</h3>
            <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
              <thead>
                <tr style="background-color: #f5f5f5;">
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Product ID</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Product Name</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Quantity</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Price per Item</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${newOrder.items.map(item => `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.productId}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.name}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rs.${item.price.toLocaleString()}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rs.${(item.price * item.quantity).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr style="background-color: #f5f5f5; font-weight: bold;">
                  <td colspan="4" style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total Amount:</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rs.${newOrder.totalAmount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
            
            <p><strong>Status:</strong> ${newOrder.status}</p>
            <p><strong>Payment:</strong> Cash on Delivery</p>
          `
        }),
        transporter.sendMail({
          from: `"Eternal Gifts" <${process.env.EMAIL_USER}>`,
          to: newOrder.email,
          subject: `Order Confirmation - Eternal Gifts by Pooja - Order #${newOrder.orderId}`,
          html: `
            <h2>Order Confirmation</h2>
            <p>Dear ${newOrder.customerName},</p>
            <p>Thank you for your order! We're excited to serve you.</p>
            <p><strong>Order ID:</strong> ${newOrder.orderId}</p>
            <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Delivery Address:</strong> ${newOrder.address}, ${newOrder.city}, ${newOrder.state} - ${newOrder.pincode}</p>
            
            <h3>Your Order Details:</h3>
            <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
              <thead>
                <tr style="background-color: #f5f5f5;">
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Product Name</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Quantity</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Price per Item</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${newOrder.items.map(item => `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.name}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rs.${item.price.toLocaleString()}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rs.${(item.price * item.quantity).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr style="background-color: #f5f5f5; font-weight: bold;">
                  <td colspan="3" style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total Amount:</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rs.${newOrder.totalAmount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
            
            <p><strong>Expected Delivery:</strong> 3-5 business days</p>
            <p><strong>Payment:</strong> Cash on Delivery</p>
            <p>We'll send you updates about your order status.</p>
            <p>Best regards,<br>Eternal Gifts by Pooja</p>
          `
        })
      ]).then(() => {
        console.log('Both emails sent successfully');
      }).catch(error => {
        console.error('Error sending emails:', error);
      });
    }, 0);
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ message: 'Error placing order' });
  }
});

// Email functions
async function sendOwnerEmail(orderData) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER, // Send to yourself
    subject: `New Order Received - ${orderData.orderId}`,
    html: `
      <h2>New Order Received</h2>
      <p><strong>Order ID:</strong> ${orderData.orderId}</p>
      <p><strong>Product:</strong> ${orderData.product}</p>
      <p><strong>Quantity:</strong> ${orderData.quantity}</p>
      <p><strong>Total Price:</strong> Rs. ${orderData.totalPrice}</p>
      
      <h3>Customer Details:</h3>
      <p><strong>Name:</strong> ${orderData.customerName}</p>
      <p><strong>Email:</strong> ${orderData.email}</p>
      <p><strong>Phone:</strong> ${orderData.phone || 'Not provided'}</p>
      <p><strong>Address:</strong> ${orderData.address}</p>
      <p><strong>City:</strong> ${orderData.city}</p>
      <p><strong>State:</strong> ${orderData.state}</p>
      <p><strong>PIN Code:</strong> ${orderData.pincode}</p>
      
      <p><strong>Order Date:</strong> ${orderData.orderDate}</p>
      <p><strong>Expected Delivery:</strong> ${orderData.deliveryDate}</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Owner email sent successfully');
  } catch (error) {
    console.error('Error sending owner email:', error);
  }
}

async function sendCustomerEmail(orderData) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: orderData.email,
    subject: `Order Confirmation - ${orderData.orderId}`,
    html: `
      <h2>Order Confirmation</h2>
      <p>Thank you for your order from Eternal Gifts by Pooja!</p>
      
      <h3>Order Details:</h3>
      <p><strong>Order ID:</strong> ${orderData.orderId}</p>
      <p><strong>Product:</strong> ${orderData.product}</p>
      <p><strong>Quantity:</strong> ${orderData.quantity}</p>
      <p><strong>Total Price:</strong> Rs. ${orderData.totalPrice}</p>
      <p><strong>Order Date:</strong> ${orderData.orderDate}</p>
      <p><strong>Expected Delivery:</strong> ${orderData.deliveryDate}</p>
      
      <h3>Delivery Address:</h3>
      <p>${orderData.customerName}</p>
      <p>${orderData.address}</p>
      <p>${orderData.city}, ${orderData.state} - ${orderData.pincode}</p>
      
      <p>We'll send you updates about your order status. Your order will be delivered within 5 business days.</p>
      
      <p>For any queries, contact us at eternalgifts@email.com</p>
      
      <p>Best regards,<br>Eternal Gifts by Pooja</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Customer email sent successfully');
  } catch (error) {
    console.error('Error sending customer email:', error);
  }
}

// Order routes
app.get('/api/orders', async (req, res) => {
  try {
    // Try MongoDB first, fallback to in-memory if not available
    let orders;
    try {
      orders = await Order.find().sort({ createdAt: -1 });
    } catch (error) {
      console.log("🔄 MongoDB query failed, using in-memory fallback");
      orders = global.orders || [];
    }
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error });
  }
});

// Email notification function
const sendOrderEmail = (order) => {
  const orderDetails = `
    🎉 NEW ORDER RECEIVED! 🎉
    
    📋 CUSTOMER INFORMATION:
    📛 Name: ${order.customerName}
    📧 Email: ${order.email}
    📱 Phone: ${order.phone || 'Not provided'}
    🏠 Address: ${order.address}
    🏙 City: ${order.city}
    🌆 State: ${order.state}
    📮 Pincode: ${order.pincode}
    
    📦 ORDER DETAILS:
    🆔 Order ID: #${order._id}
    💰 Total Amount: ₹${order.totalAmount.toLocaleString()}
    📊 Status: ${order.status}
    📅 Order Date: ${new Date(order.createdAt).toLocaleString()}
    
    🛍 ORDERED ITEMS (${order.items.length}):
${order.items.map(item => `    🎁 ${item.name} x${item.quantity} = ₹${item.price.toLocaleString()}`).join('\n')}
    
    🔔 PAYMENT INFORMATION:
    💳 Payment Method: Cash on Delivery
    💵 Payment Status: Pending Payment
    
    📦 DELIVERY INFORMATION:
    🚚 Delivery Type: Standard Delivery
    📍 Expected Delivery: 3-5 business days
    📞 Delivery Instructions: ${order.address}, ${order.city}, ${order.state} - ${order.pincode}
    
    ✉ EMAIL NOTIFICATION SENT TO:
    📧 Seller: eternalgifts@pooja.com
    🕐 Notification Time: ${new Date().toLocaleString()}
    
    ======================================
    Thank you for choosing Eternal Gifts by Pooja!
    Your order has been received and is being processed.
    =====================================
  `;

  console.log('📧 NEW ORDER EMAIL:');
  console.log(orderDetails);

  // Customer notification
  const customerNotification = `
    ======================================
    ORDER CONFIRMATION - Eternal Gifts by Pooja
    ======================================

    Dear ${order.customerName},

    Thank you for your order! We're excited to serve you.

    ORDER DETAILS:
    Order ID: #${order._id}
    Order Date: ${new Date(order.createdAt).toLocaleString()}
    Status: ${order.status}
    Total Amount: ${order.totalAmount.toLocaleString()}

    ITEMS ORDERED (${order.items.length}):
${order.items.map(item => `    ${item.name} x${item.quantity} - ${item.price.toLocaleString()}`).join('\n')}

    DELIVERY INFORMATION:
    Delivery Address: ${order.address}, ${order.city}, ${order.state} - ${order.pincode}
    Expected Delivery: 3-5 business days
    Payment Method: Cash on Delivery

    NEXT STEPS:
    1. We'll process your order within 24 hours
    2. You'll receive updates on your order status
    3. Our delivery team will contact you before delivery

    NEED HELP?
    Email: eternalgifts@pooja.com
    Phone: [Your Phone Number]

    Thank you for choosing Eternal Gifts by Pooja!
    We appreciate your business.

    =====================================
  `;

  console.log('CUSTOMER ORDER EMAIL:');
  console.log(customerNotification);

  // Send real emails
  const sendRealEmails = async () => {
    try {
      console.log('=== EMAIL SENDING START ===');
      console.log('Email user:', process.env.EMAIL_USER);
      console.log('Order data:', order);
      
      // Send email to seller
      console.log('Sending seller email to: vireshhalasi725@gmail.com');
      const sellerEmailResult = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.SELLER_EMAIL || 'vireshhalasi725@gmail.com', // Seller email address
        subject: `New Order Received - Order #${order._id}`,
        html: `<pre>${orderDetails}</pre>`
      });
      console.log('Seller email sent:', sellerEmailResult.messageId);

      // Send email to customer
      console.log('=== SENDING CUSTOMER EMAIL ===');
      console.log('Customer email address:', order.email);
      console.log('Customer name:', order.customerName);
      console.log('Order ID:', order._id);
      
      if (!order.email) {
        console.error('ERROR: Customer email is missing!');
        return;
      }
      
      const customerEmailResult = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: order.email,
        subject: `Order Confirmation - Eternal Gifts by Pooja - Order #${order._id}`,
        html: `<pre>${customerNotification}</pre>`
      });
      console.log('Customer email sent successfully:', customerEmailResult.messageId);
      console.log('=== CUSTOMER EMAIL SENT ===');

      console.log('=== EMAIL SENDING COMPLETE ===');
    } catch (error) {
      console.error('Error sending emails:', error);
      console.error('Error details:', error.message);
    }
  };

  sendRealEmails();
};

app.put('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      Object.assign(order, req.body);
      await order.save();
      res.json(order);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error updating order", error });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      await Order.findByIdAndDelete(req.params.id);
      res.json({ message: "Order deleted successfully" });
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting order", error });
  }
});

// Bulk order processing
app.post('/api/orders/bulk', async (req, res) => {
  try {
    const { orderNumbers, action } = req.body;
    
    if (!orderNumbers || !Array.isArray(orderNumbers)) {
      return res.status(400).json({ message: "Invalid order numbers" });
    }
    
    const results = [];
    
    for (const orderNumber of orderNumbers) {
      const order = await Order.findById(orderNumber.toString());
      
      if (order) {
        switch (action) {
          case 'mark-shipped':
            order.status = 'Shipped';
            await order.save();
            results.push({ orderNumber, action: 'marked shipped', order });
            break;
          case 'mark-delivered':
            order.status = 'Delivered';
            await order.save();
            results.push({ orderNumber, action: 'marked delivered', order });
            break;
          case 'delete':
            await Order.findByIdAndDelete(orderNumber.toString());
            results.push({ orderNumber, action: 'deleted', order });
            break;
          default:
            results.push({ orderNumber, action: 'not_found' });
        }
      } else {
        results.push({ orderNumber, action: 'not_found' });
      }
    }
    
    console.log(`📦 Bulk order processing: ${action} for ${orderNumbers.length} orders`);
    console.log('Results:', results);
    
    res.json({ 
      results 
    });
  } catch (error) {
    res.status(500).json({ message: "Error processing bulk orders", error });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

// Test email endpoint
app.post('/api/test-email', async (req, res) => {
  try {
    console.log('=== TESTING EMAIL TRANSPORTER ===');
    console.log('Email user:', process.env.EMAIL_USER);
    
    const sampleOrder = {
      _id: 'TEST-001',
      customerName: 'Test Customer',
      email: 'customer@example.com',
      phone: '+91 9876543210',
      address: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      pincode: '560001',
      items: [
        { name: '12-9 inch Resin Name Plate', price: 2499, quantity: 1 },
        { name: '4 inch Laxmi', price: 899, quantity: 2 }
      ],
      totalAmount: 4297,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    // Create seller notification with customer info
    const sellerNotification = `
    ======================================
    NEW ORDER RECEIVED - Eternal Gifts by Pooja
    ======================================
    
    ORDER DETAILS:
    Order ID: ${sampleOrder._id}
    Order Date: ${new Date().toLocaleString()}
    Order Status: ${sampleOrder.status}
    
    CUSTOMER INFORMATION:
    Name: ${sampleOrder.customerName}
    Email: ${sampleOrder.email}
    Phone: ${sampleOrder.phone}
    Address: ${sampleOrder.address}, ${sampleOrder.city}, ${sampleOrder.state} - ${sampleOrder.pincode}
    
    ORDER ITEMS:
    ${sampleOrder.items.map(item => `    ${item.name} x${item.quantity} = Rs.${item.price.toLocaleString()}`).join('\n')}
    
    TOTAL AMOUNT: Rs.${sampleOrder.totalAmount.toLocaleString()}
    
    ======================================
    This is a test email to demonstrate the customer information
    you will receive when a real order is placed.
    ======================================
    `;

    // Test email sending with customer information
    const testResult = await transporter.sendMail({
      from: `"Eternal Gifts" <${process.env.EMAIL_USER}>`,
      to: process.env.SELLER_EMAIL || 'vireshhalasi725@gmail.com',
      subject: `Test Order Received - Order #${sampleOrder._id}`,
      text: sellerNotification,
      html: `<pre>${sellerNotification}</pre>`
    });
    
    console.log('Test email sent:', testResult.messageId);
    res.json({ 
      success: true, 
      message: 'Test email with customer information sent successfully',
      messageId: testResult.messageId,
      orderData: sampleOrder
    });
  } catch (error) {
    console.error('Test email error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Test customer email endpoint
app.post('/api/test-customer-email', async (req, res) => {
  try {
    console.log('=== TESTING CUSTOMER EMAIL ===');
    
    const testCustomerEmail = 'vireshhalasi725@gmail.com'; // Test with your email first
    
    const customerNotification = `
    ======================================
    ORDER CONFIRMATION - Eternal Gifts by Pooja
    ======================================

    Dear Test Customer,

    Thank you for your order! We're excited to serve you.

    ORDER DETAILS:
    Order ID: #TEST-001
    Order Date: ${new Date().toLocaleString()}
    Status: Pending
    Total Amount: Rs.4,297

    ITEMS ORDERED (2):
    12-9 inch Resin Name Plate x1 - Rs.2,499
    4 inch Laxmi x2 - Rs.1,798

    DELIVERY INFORMATION:
    Delivery Address: 123 Test Street, Test City, Test State - 560001
    Expected Delivery: 3-5 business days
    Payment Method: Cash on Delivery

    NEXT STEPS:
    1. We'll process your order within 24 hours
    2. You'll receive updates on your order status
    3. Our delivery team will contact you before delivery

    NEED HELP?
    Email: vireshhalasi725@gmail.com
    Phone: [Your Phone Number]

    Thank you for choosing Eternal Gifts by Pooja!
    We appreciate your business.

    =====================================
    `;

    const customerEmailResult = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: testCustomerEmail,
      subject: 'Order Confirmation - Eternal Gifts by Pooja - Order #TEST-001',
      html: `<pre>${customerNotification}</pre>`
    });
    
    console.log('Test customer email sent:', customerEmailResult.messageId);
    res.json({ 
      success: true, 
      message: 'Test customer email sent successfully',
      messageId: customerEmailResult.messageId,
      testEmail: testCustomerEmail
    });
  } catch (error) {
    console.error('Test customer email error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Simple email test endpoint
app.post('/api/simple-email-test', async (req, res) => {
  try {
    console.log('=== TESTING SIMPLE CUSTOMER EMAIL ===');
    
    const testEmail = 'testcustomer123@gmail.com';
    
    const result = await transporter.sendMail({
      from: `"Eternal Gifts" <${process.env.EMAIL_USER}>`,
      to: testEmail,
      subject: 'Simple Test - Eternal Gifts',
      text: 'This is a simple test email to verify delivery.',
      html: '<h2>Simple Test Email</h2><p>This is a simple test email to verify delivery.</p>'
    });
    
    console.log('Simple test email sent:', result.messageId);
    res.json({ 
      success: true, 
      message: 'Simple test email sent',
      messageId: result.messageId,
      testEmail: testEmail
    });
  } catch (error) {
    console.error('Simple test email error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
