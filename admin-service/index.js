// admin-service/index.js - COMPLETE UPDATED CODE WITH DEBUGGING
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(cors());

// =========================================================
// ✅ PRIMARY DATABASE CONNECTION (admin_db)
// =========================================================
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "12345",
  database: "admin_db",
  port: 3306,
});

db.connect((err) => {
  if (err) return console.error("DB connection error:", err);
  console.log("✅ Connected to admin_db");
});

// =========================================================
// ✅ SECONDARY CONNECTIONS (other services)
// =========================================================
const sellerDB = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "12345",
  database: "seller_auth_db",
  port: 3306,
});

sellerDB.connect((err) => {
  if (err) console.error("❌ Seller DB connection error:", err);
  else console.log("✅ Connected to seller_auth_db");
});

const buyerDB = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "12345",
  database: "buyer_db",
  port: 3306,
});

buyerDB.connect((err) => {
  if (err) console.error("❌ Buyer DB connection error:", err);
  else console.log("✅ Connected to buyer_db");
});

// =========================================================
// ✅ SELLERS MANAGEMENT ROUTES
// =========================================================

// Get all sellers
app.get("/api/sellers", (req, res) => {
  const sql = "SELECT * FROM sellers ORDER BY date_added DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Error fetching sellers:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

// Add new seller
app.post("/api/sellers", (req, res) => {
  const {
    unique_id,
    last_name,
    first_name,
    middle_name,
    shop_name,
    street,
    barangay,
    municipality,
    province,
    requirements,
    status,
  } = req.body;

  if (!unique_id || !last_name || !first_name || !shop_name) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const query = `
    INSERT INTO sellers 
    (unique_id, last_name, first_name, middle_name, shop_name, street, barangay, municipality, province, requirements, status, date_added) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  db.query(
    query,
    [
      unique_id,
      last_name,
      first_name,
      middle_name,
      shop_name,
      street,
      barangay,
      municipality,
      province,
      JSON.stringify(requirements),
      status || "pending",
    ],
    (err) => {
      if (err) {
        console.error("❌ Error adding seller:", err);
        return res.status(500).json({ message: "Database insert error" });
      }
      res.json({ message: "✅ Seller added successfully" });
    }
  );
});

// Update seller status
app.put("/api/sellers/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["accepted", "rejected", "pending"].includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  db.query(
    "UPDATE sellers SET status = ? WHERE id = ?",
    [status, id],
    (err, result) => {
      if (err) {
        console.error("❌ Error updating seller status:", err);
        return res.status(500).json({ message: "Update error" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Seller not found" });
      }
      res.json({ message: "✅ Status updated successfully" });
    }
  );
});

// Delete seller
app.delete("/api/sellers/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM sellers WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("❌ Error deleting seller:", err);
      return res.status(500).json({ message: "Delete error" });
    }
    res.json({ message: "🗑️ Seller deleted successfully" });
  });
});

// =========================================================
// 👑 MANAGE PRODUCTS ROUTES
// =========================================================

// Fetch all accepted sellers with logo
app.get("/api/admin/all-sellers", (req, res) => {
  const sql = `
    SELECT 
      s.unique_id, 
      s.shop_name, 
      s.first_name, 
      s.middle_name, 
      s.last_name,
      sp.logo  
    FROM sellers s
    LEFT JOIN seller_auth_db.seller_profiles sp 
    ON s.unique_id = sp.seller_id
    WHERE s.status = 'accepted'
    ORDER BY s.date_added DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Error fetching all seller profiles:", err);
      return res.status(500).json({
        message: "Database error fetching seller data.",
        error: err.message,
      });
    }
    
    console.log("✅ Returning sellers to frontend:", results);
    console.log(`📊 Total sellers found: ${results.length}`);
    
    res.json(results);
  });
});

// Fetch products AND categories for a specific seller
app.get("/api/admin/seller-products", async (req, res) => {
  const { seller_id } = req.query;
  
  console.log("🔍 Fetching products for seller_id:", seller_id);
  
  if (!seller_id) {
    return res.status(400).json({ message: "Seller ID is required" });
  }

  try {
    // Fetch products from seller service
    console.log("📦 Fetching products from seller service...");
    const productsResponse = await axios.get(
      `http://localhost:5001/api/seller/fish`,
      { params: { seller_id } }
    );

    // Fetch categories from seller service
    console.log("📂 Fetching categories from seller service...");
    const categoriesResponse = await axios.get(
      `http://localhost:5001/api/seller/categories`,
      { params: { seller_id } }
    );

    // Fetch seller info for shop name
    console.log("🏪 Fetching seller info from admin_db...");
    const [sellerInfo] = await db.promise().query(
      "SELECT shop_name FROM sellers WHERE unique_id = ?",
      [seller_id]
    );

    const responseData = {
      products: productsResponse.data || [],
      categories: categoriesResponse.data || [],
      shop_name: sellerInfo.length > 0 ? sellerInfo[0].shop_name : null
    };

    console.log("✅ Sending response:", {
      products_count: responseData.products.length,
      categories_count: responseData.categories.length,
      shop_name: responseData.shop_name
    });

    res.json(responseData);
  } catch (err) {
    console.error("❌ Error fetching seller products:", err.message);
    const status = err.response ? err.response.status : 500;
    const message = err.response 
      ? err.response.data.message 
      : "Could not connect to Seller Service.";
    return res.status(status).json({ message });
  }
});

// =========================================================
// ✅ MULTI-DATABASE ROUTES
// =========================================================

// Fetch sellers from seller_auth_db
app.get("/api/all-sellers", (req, res) => {
  const sql = `
    SELECT id, unique_id, email, date_registered
    FROM seller_credentials
    ORDER BY date_registered DESC
  `;
  sellerDB.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Error fetching sellers from seller_auth_db:", err);
      return res.status(500).json({ message: "Error fetching sellers" });
    }
    res.json(results);
  });
});

// Fetch buyers from buyer_db
app.get("/api/all-buyers", (req, res) => {
  const sql = `
    SELECT id, email, contact, last_name, first_name, middle_name, username, created_at
    FROM buyer_authentication
    ORDER BY created_at DESC
  `;
  buyerDB.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Error fetching buyers from buyer_db:", err);
      return res.status(500).json({ message: "Error fetching buyers" });
    }
    res.json(results);
  });
});

// =========================================================
// ✅ ADMIN LOGIN ROUTE
// =========================================================
app.post("/api/admin/login", (req, res) => {
  const { username, admin_id, password } = req.body;
  if (!username || !admin_id || !password)
    return res.status(400).json({ message: "All fields are required" });

  db.query(
    "SELECT * FROM admins WHERE username = ? AND admin_id = ?",
    [username, admin_id],
    async (err, results) => {
      if (err) return res.status(500).json({ message: "Database error", err });
      if (results.length === 0) return res.status(401).json({ message: "Invalid credentials" });

      const admin = results[0];
      const match = await bcrypt.compare(password, admin.password_hash);
      if (!match) return res.status(401).json({ message: "Invalid credentials" });

      res.json({
        message: "✅ Login successful",
        admin: { username: admin.username, admin_id: admin.admin_id },
      });
    }
  );
});

// =========================================================
// ✅ START SERVER
// =========================================================
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Admin service running on port ${PORT}`));