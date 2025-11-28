const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(cors());

// --------------------------
// Ensure uploads folder exists
// --------------------------
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// --------------------------
// Serve uploaded images
// --------------------------
app.use("/uploads", express.static(UPLOAD_DIR));

// --------------------------
// Multer setup
// --------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({ storage });

// --------------------------
// MySQL connections
// --------------------------
const authDb = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "12345",
  database: "seller_auth_db",
  port: 3306,
});
authDb.connect((err) => {
  if (err) console.error("❌ Auth DB connection error:", err);
  else console.log("✅ Connected to seller_auth_db");
});

const adminDb = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "12345",
  database: "admin_db",
  port: 3306,
});
adminDb.connect((err) => {
  if (err) console.error("❌ Admin DB connection error:", err);
  else console.log("✅ Connected to admin_db");
});

// =================================
// HELPER FUNCTIONS
// =================================

// Initialize default categories for new seller
async function initializeDefaultCategories(seller_id) {
  const defaultCategories = [
    'Freshwater',
    'Saltwater',
    'Shellfish',
    'Crustaceans',
    'Premium Fish'
  ];

  try {
    for (const category of defaultCategories) {
      await authDb.promise().query(
        "INSERT IGNORE INTO fish_categories (category_name, seller_id) VALUES (?, ?)",
        [category, seller_id]
      );
    }
  } catch (err) {
    console.error("Error initializing categories:", err);
  }
}

// Helper: Insert Seller Notification (To be called internally)
async function insertNotification(seller_id, message, type = 'info') {
    try {
        await authDb.promise().query(
            "INSERT INTO seller_notifications (seller_id, message, type) VALUES (?, ?, ?)",
            [seller_id, message, type]
        );
    } catch (err) {
        // Log the error but don't stop the main transaction
        console.error(`Error inserting notification for seller ${seller_id}:`, err); 
    }
}

// =================================
// AUTHENTICATION ENDPOINTS
// =================================

// ---------------------------------
// Seller Registration
// ---------------------------------
app.post("/api/seller/register", async (req, res) => {
  const { email, unique_id, password } = req.body;

  if (!email || !unique_id || !password)
    return res.status(400).json({ message: "All fields required" });

  try {
    // Check if ID exists in admin table and is approved
    const [adminCheck] = await adminDb
      .promise()
      .query("SELECT status FROM sellers WHERE unique_id = ?", [unique_id]);

    if (adminCheck.length === 0)
      return res.status(404).json({ message: "Generated ID not found." });

    if (adminCheck[0].status !== "accepted")
      return res.status(403).json({ message: "Seller not approved." });

    // Check if already registered
    const [authCheck] = await authDb
      .promise()
      .query("SELECT id FROM seller_credentials WHERE email = ? OR unique_id = ?", [email, unique_id]);

    if (authCheck.length > 0)
      return res.status(409).json({ message: "Seller already registered." });

    // Hash password and insert
    const hash = await bcrypt.hash(password, 10);
    await authDb
      .promise()
      .query(
        "INSERT INTO seller_credentials (unique_id, email, password_hash) VALUES (?, ?, ?)",
        [unique_id, email, hash]
      );

    // Auto-create default categories for new seller
    await initializeDefaultCategories(unique_id);

    res.json({ message: "Registration successful." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

// ---------------------------------
// Seller Login
// ---------------------------------
app.post("/api/seller/login", async (req, res) => {
  const { unique_id, password } = req.body;

  if (!unique_id || !password)
    return res.status(400).json({ message: "Both fields required" });

  try {
    const [results] = await authDb
      .promise()
      .query("SELECT password_hash FROM seller_credentials WHERE unique_id = ?", [unique_id]);

    if (results.length === 0)
      return res.status(401).json({ message: "Invalid ID." });

    const match = await bcrypt.compare(password, results[0].password_hash);
    if (!match)
      return res.status(401).json({ message: "Invalid password." });

    res.json({ message: "Login successful", unique_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

// =================================
// CATEGORY MANAGEMENT ENDPOINTS
// =================================

// ---------------------------------
// GET seller's categories
// ---------------------------------
app.get("/api/seller/categories", async (req, res) => {
  try {
    const { seller_id } = req.query;
    
    if (!seller_id) {
      return res.status(400).json({ message: "Seller ID required" });
    }
    
    const [rows] = await authDb.promise().query(
      "SELECT id, category_name, created_at FROM fish_categories WHERE seller_id = ? ORDER BY category_name ASC",
      [seller_id]
    );

    // If no categories exist, initialize them
    if (rows.length === 0) {
      await initializeDefaultCategories(seller_id);
      const [newRows] = await authDb.promise().query(
        "SELECT id, category_name, created_at FROM fish_categories WHERE seller_id = ? ORDER BY category_name ASC",
        [seller_id]
      );
      return res.json(newRows);
    }
    
    res.json(rows);
  } catch (err) {
    console.error("❌ Fetch Categories Error:", err);
    res.status(500).json({ message: "Server error fetching categories" });
  }
});

// ---------------------------------
// ADD new category
// ---------------------------------
app.post("/api/seller/categories", async (req, res) => {
  try {
    const { category_name, seller_id } = req.body;

    if (!category_name || !seller_id) {
      return res.status(400).json({ message: "Category name and seller ID required" });
    }

    // Check if category already exists for this seller
    const [existing] = await authDb.promise().query(
      "SELECT id FROM fish_categories WHERE category_name = ? AND seller_id = ?",
      [category_name, seller_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "You already have a category with this name" });
    }

    await authDb.promise().query(
      "INSERT INTO fish_categories (category_name, seller_id) VALUES (?, ?)",
      [category_name, seller_id]
    );

    res.json({ message: "Category added successfully!" });
  } catch (err) {
    console.error("❌ Add Category Error:", err);
    
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: "Invalid seller ID" });
    }
    
    res.status(500).json({ message: "Server error while adding category" });
  }
});

// ---------------------------------
// DELETE category
// ---------------------------------
app.delete("/api/seller/categories/:id", async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { seller_id } = req.query;

    if (!seller_id) {
      return res.status(400).json({ message: "Seller ID required" });
    }

    const [category] = await authDb.promise().query(
      "SELECT category_name, seller_id FROM fish_categories WHERE id = ?",
      [categoryId]
    );

    if (category.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (category[0].seller_id !== seller_id) {
      return res.status(403).json({ message: "You can only delete your own categories" });
    }

    // Check if any products use this category
    const [productsUsing] = await authDb.promise().query(
      "SELECT COUNT(*) as count FROM fish_products WHERE category = ? AND seller_id = ?",
      [category[0].category_name, seller_id]
    );

    if (productsUsing[0].count > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category. ${productsUsing[0].count} product(s) are using it.` 
      });
    }

    await authDb.promise().query(
      "DELETE FROM fish_categories WHERE id = ? AND seller_id = ?",
      [categoryId, seller_id]
    );

    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("❌ Delete Category Error:", err);
    res.status(500).json({ message: "Server error while deleting category" });
  }
});

// =================================
// FISH PRODUCTS ENDPOINTS
// =================================

// ---------------------------------
// GET fish products
// ---------------------------------
app.get("/api/seller/fish", async (req, res) => {
  try {
    const { seller_id } = req.query;
    let sql = "SELECT * FROM fish_products";
    const params = [];
    if (seller_id) {
      sql += " WHERE seller_id = ?";
      params.push(seller_id);
    }
    sql += " ORDER BY created_at DESC";
    const [rows] = await authDb.promise().query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ Fetch Fish Error:", err);
    res.status(500).json({ message: "Server error fetching fish" });
  }
});

// ---------------------------------
// ADD fish product
// ---------------------------------
app.post("/api/seller/add-fish", upload.single("image"), async (req, res) => {
  try {
    const { name, category, unit, price, stock, seller_id } = req.body;
    const image_url = req.file ? req.file.filename : null;

    if (!name || !price || !stock || !seller_id)
      return res.status(400).json({ message: "All required fields are missing." });

    // When adding a new fish, previous_price is null, or set to the initial price
    await authDb
      .promise()
      .query(
        "INSERT INTO fish_products (name, category, unit, price, previous_price, stock, image_url, seller_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [name, category || "Freshwater", unit || "kg", price, null, stock, image_url, seller_id]
      );

    res.json({ message: "Fish product added successfully!" });
  } catch (err) {
    console.error("❌ Add Fish Error:", err);
    res.status(500).json({ message: "Server error while adding fish product" });
  }
});

// ---------------------------------
// UPDATE fish product (MODIFIED for Price History)
// ---------------------------------
app.put("/api/seller/fish/:id", upload.single("image"), async (req, res) => {
  try {
    const fishId = req.params.id;
    const { name, category, unit, price, stock, seller_id } = req.body;
    const newImage = req.file ? req.file.filename : null;
    const conn = authDb.promise();

    // Fetch existing record
    const [existing] = await conn
      .query("SELECT price, image_url FROM fish_products WHERE id = ?", [fishId]);
    if (existing.length === 0) return res.status(404).json({ message: "Fish not found." });

    const oldPrice = existing[0].price;
    const oldImage = existing[0].image_url;

    // TRANSACTION START
    await conn.query("START TRANSACTION");

    // Check and record price change
    if (price !== undefined && Number(price) !== Number(oldPrice)) {
        if (!seller_id) throw new Error("Seller ID required for price history logging.");
        
        // 1. Insert into price_history
        await conn.query(
          "INSERT INTO price_history (product_id, seller_id, old_price, new_price) VALUES (?, ?, ?, ?)",
          [fishId, seller_id, oldPrice, price]
        );

        // 2. Update previous_price in fish_products (for immediate trend check in other components)
        await conn.query(
          "UPDATE fish_products SET previous_price = ? WHERE id = ?",
          [oldPrice, fishId]
        );
    }

    // Build dynamic query for fish_products update
    const fields = [];
    const params = [];
    if (name !== undefined) { fields.push("name = ?"); params.push(name); }
    if (category !== undefined) { fields.push("category = ?"); params.push(category); }
    if (unit !== undefined) { fields.push("unit = ?"); params.push(unit); }
    if (price !== undefined) { 
      // Update the current price in fish_products
      fields.push("price = ?"); 
      params.push(price); 
    }
    if (stock !== undefined) { fields.push("stock = ?"); params.push(stock); }
    if (newImage) { fields.push("image_url = ?"); params.push(newImage); }

    if (fields.length === 0) {
      await conn.query("ROLLBACK");
      return res.status(400).json({ message: "No fields to update." });
    }

    params.push(fishId);
    const sql = `UPDATE fish_products SET ${fields.join(", ")} WHERE id = ?`;
    await conn.query(sql, params);

    await conn.query("COMMIT");
    
    // Delete old image if replaced
    if (newImage && oldImage) {
      const oldPath = path.join(UPLOAD_DIR, oldImage);
      fs.unlink(oldPath, (err) => {
        if (err) console.warn("⚠️ Could not delete old image:", err.message);
      });
    }

    res.json({ message: "Fish product updated successfully." });
  } catch (err) {
      await authDb.promise().query("ROLLBACK");
    console.error("❌ Update Fish Error:", err);
    res.status(500).json({ message: "Server error while updating fish product" });
  }
});

// ---------------------------------
// DELETE fish product
// ---------------------------------
app.delete("/api/seller/fish/:id", async (req, res) => {
  try {
    const fishId = req.params.id;
    const [rows] = await authDb.promise().query("SELECT image_url FROM fish_products WHERE id = ?", [fishId]);
    if (rows.length === 0) return res.status(404).json({ message: "Fish not found." });

    const imageFilename = rows[0].image_url;
    await authDb.promise().query("DELETE FROM fish_products WHERE id = ?", [fishId]);

    // Remove image file
    if (imageFilename) {
      const p = path.join(UPLOAD_DIR, imageFilename);
      fs.unlink(p, (err) => {
        if (err) console.warn("⚠️ Could not delete image file:", err.message);
      });
    }

    res.json({ message: "Fish product deleted successfully." });
  } catch (err) {
    console.error("❌ Delete Fish Error:", err);
    res.status(500).json({ message: "Server error while deleting fish product" });
  }
});

// ---------------------------------
// UPDATE stock for a fish product
// ---------------------------------
app.put("/api/seller/fish/:id/stock", async (req, res) => {
  try {
    const fishId = req.params.id;
    const { stock } = req.body;

    if (stock === undefined || isNaN(stock)) {
      return res.status(400).json({ message: "Valid stock value is required." });
    }

    const [rows] = await authDb.promise().query(
      "SELECT stock FROM fish_products WHERE id = ?",
      [fishId]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Fish not found." });

    await authDb.promise().query(
      "UPDATE fish_products SET stock = ? WHERE id = ?",
      [stock, fishId]
    );

    res.json({ message: "Stock updated successfully.", stock });
  } catch (err) {
    console.error("❌ Update Stock Error:", err);
    res.status(500).json({ message: "Server error while updating stock." });
  }
});

// =================================
// PRICE ANALYSIS ENDPOINTS (UPDATED)
// =================================

// ---------------------------------
// GET Price Analysis and Suggestions
// ---------------------------------
app.get("/api/seller/price-analysis/:productId", async (req, res) => {
    try {
      const { productId } = req.params;
      const { seller_id } = req.query;
      
      if (!productId || !seller_id) {
        return res.status(400).json({ message: "Product ID and Seller ID required" });
      }

      const conn = authDb.promise();

      // 1. Get current product price and name
      const [product] = await conn.query(
        "SELECT name, price FROM fish_products WHERE id = ? AND seller_id = ?",
        [productId, seller_id]
      );
      
      if (product.length === 0) {
        return res.status(404).json({ message: "Product not found or access denied." });
      }

      const currentPrice = Number(product[0].price);
      const productName = product[0].name;

      // 2. Get all price history (records start from 2nd price update)
      const [history] = await conn.query(
        `SELECT id, old_price, new_price, change_date 
          FROM price_history 
          WHERE product_id = ? AND seller_id = ? 
          ORDER BY change_date DESC`,
        [productId, seller_id]
      );
      
      // 3. Calculate total updates
      // Total updates = 1 (initial) + history records
      const totalUpdates = history.length + 1;
      
      // 4. Generate suggestions (only when totalUpdates >= 3)
      let suggestions = [];
      const canGenerateSuggestions = totalUpdates >= 3;
      
      if (canGenerateSuggestions) {
        // Collect all prices: current + all new_price from history
        const allPrices = [currentPrice];
        history.forEach(h => allPrices.push(Number(h.new_price)));
        
        // Get the floor price (previous price = most recent old_price)
        const floorPrice = history.length > 0 ? Number(history[0].old_price) : currentPrice;
        
        // Calculate average price
        const sum = allPrices.reduce((acc, p) => acc + p, 0);
        const averagePrice = sum / allPrices.length;
        
        // Ensure average doesn't go below floor
        const basePrice = Math.max(averagePrice, floorPrice);
        
        // Suggestion 1: Average-based price
        suggestions.push({
          label: "Average Based Price (Balanced)",
          price: parseFloat(basePrice.toFixed(2)),
          margin: 0
        });
        
        // Suggestions 2-4: Competitive prices with interest margins
        const margins = [
          { rate: 0.03, label: "Conservative Margin (+3%)" },
          { rate: 0.05, label: "Standard Margin (+5%)" },
          { rate: 0.07, label: "Premium Margin (+7%)" }
        ];
        
        margins.forEach(m => {
          const suggestedPrice = basePrice * (1 + m.rate);
          suggestions.push({
            label: m.label,
            price: parseFloat(suggestedPrice.toFixed(2)),
            margin: m.rate * 100
          });
        });
      }

      // 5. Return analysis data
      res.json({
        productName,
        currentPrice,
        totalUpdates,
        canGenerateSuggestions,
        history: history.map(h => ({
          id: h.id,
          old_price: Number(h.old_price),
          new_price: Number(h.new_price),
          change_date: h.change_date
        })),
        suggestions
      });

    } catch (err) {
      console.error("❌ Fetch Price Analysis Error:", err);
      res.status(500).json({ message: "Server error fetching price analysis" });
    }
});

// ---------------------------------
// UPDATE Fish Price using Suggestion (NEW)
// ---------------------------------
app.put("/api/seller/fish-price/:id/accept-suggestion", async (req, res) => {
    try {
      const fishId = req.params.id;
      const { new_price, seller_id } = req.body;

      if (!new_price || isNaN(new_price) || !seller_id) {
        return res.status(400).json({ message: "Valid new price and seller ID required." });
      }
      
      const conn = authDb.promise();

      // 1. Fetch current price
      const [existing] = await conn.query(
        "SELECT price FROM fish_products WHERE id = ? AND seller_id = ?", 
        [fishId, seller_id]
      );
      
      if (existing.length === 0) return res.status(404).json({ message: "Fish not found or access denied." });

      const oldPrice = existing[0].price;
      const priceToSet = Number(new_price).toFixed(2);
      
      // 2. Record price change in history (only if it's different) and update product
      if (Number(priceToSet) !== Number(oldPrice)) {
        // Record history
        await conn.query(
          "INSERT INTO price_history (product_id, seller_id, old_price, new_price) VALUES (?, ?, ?, ?)",
          [fishId, seller_id, oldPrice, priceToSet]
        );
        // Update product
        await conn.query(
          "UPDATE fish_products SET previous_price = ?, price = ? WHERE id = ?",
          [oldPrice, priceToSet, fishId]
        );
      } 

      res.json({ message: "Price updated successfully with suggested price.", new_price: priceToSet });
    } catch (err) {
      console.error("❌ Accept Suggestion Error:", err);
      res.status(500).json({ message: "Server error while accepting price suggestion." });
    }
});


// =================================
// SELLER PROFILE ENDPOINTS
// =================================

// ---------------------------------
// GET Seller Information from admin_db
// ---------------------------------
app.get("/api/seller/info/:seller_id", async (req, res) => {
  const { seller_id } = req.params;
  try {
    const [rows] = await adminDb
      .promise()
      .query(
        "SELECT unique_id, first_name, middle_name, last_name, shop_name, street, barangay, municipality, province FROM sellers WHERE unique_id = ?",
        [seller_id]
      );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Seller not found" });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching seller info:", err);
    res.status(500).json({ message: "Error fetching seller information" });
  }
});

// ---------------------------------
// GET Seller Profile (logo and QR only)
// ---------------------------------
app.get("/api/seller/profile/:seller_id", async (req, res) => {
  const { seller_id } = req.params;
  try {
    const [rows] = await authDb
      .promise()
      .query(
        "SELECT logo, qr FROM seller_profiles WHERE seller_id = ?",
        [seller_id]
      );
    if (rows.length === 0)
      return res.json({
        logo: "",
        qr: "",
      });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching profile" });
  }
});

// ---------------------------------
// UPLOAD Shop Logo
// ---------------------------------
app.post(
  "/api/seller/upload-logo/:seller_id",
  upload.single("logo"),
  async (req, res) => {
    const { seller_id } = req.params;
    if (!req.file)
      return res.status(400).json({ message: "No logo uploaded" });

    const filePath = "/uploads/" + req.file.filename;

    try {
      // Insert or update logo
      await authDb
        .promise()
        .query(
          `INSERT INTO seller_profiles (seller_id, logo) 
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE logo = VALUES(logo)`,
          [seller_id, filePath]
        );
      res.json({ message: "Logo uploaded successfully", logo: filePath });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error uploading logo" });
    }
  }
);

// ---------------------------------
// UPLOAD GCash QR
// ---------------------------------
app.post(
  "/api/seller/upload-qr/:seller_id",
  upload.single("qr"),
  async (req, res) => {
    const { seller_id } = req.params;
    if (!req.file)
      return res.status(400).json({ message: "No QR uploaded" });

    const filePath = "/uploads/" + req.file.filename;

    try {
      // Insert or update QR
      await authDb
        .promise()
        .query(
          `INSERT INTO seller_profiles (seller_id, qr) 
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE qr = VALUES(qr)`,
          [seller_id, filePath]
        );
      res.json({ message: "QR uploaded successfully", qr: filePath });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error uploading QR" });
    }
  }
);

// =================================
// ORDERS ENDPOINTS
// =================================

// --------------------------
// NEW: Upload Proof of Payment Endpoint
// --------------------------
app.post("/api/upload-payment-proof", upload.single("proof"), async (req, res) => {
  try {
    const { customer_name, customer_contact } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: "No proof of payment uploaded" });
    }

    if (!customer_name || !customer_contact) {
      return res.status(400).json({ message: "Customer information required" });
    }

    const filePath = "/uploads/" + req.file.filename;

    console.log("✅ Proof of payment uploaded:", {
      customer: customer_name,
      contact: customer_contact,
      file: filePath
    });

    res.json({ 
      message: "Proof of payment uploaded successfully", 
      proof_path: filePath 
    });
  } catch (err) {
    console.error("❌ Upload Proof Error:", err);
    res.status(500).json({ message: "Error uploading proof of payment" });
  }
});

// --------------------------
// UPDATED: CREATE Order WITH Proof of Payment and customer_id
// --------------------------
app.post("/api/orders", async (req, res) => {
    const { customer, cart, payment_mode, proof_of_payment, paid, buyer_id } = req.body;

    if (!customer || !cart || !Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({ message: "Invalid order data." });
    }

    // Validate proof of payment
    if (!proof_of_payment) {
        return res.status(400).json({ message: "Proof of payment is required." });
    }

    // Validate buyer_id (the numerical customer ID from buyer_authentication)
    if (!buyer_id) {
        return res.status(400).json({ message: "Buyer ID is required." });
    }

    const conn = authDb.promise();

    try {
        // 1. Fetch buyer info from buyer_db to create notification string
        const [buyerInfo] = await mysql.createPool({
            host: "localhost",
            user: "root",
            password: "12345",
            database: "buyer_db",
            port: 3306
        }).promise().query(
            "SELECT first_name, last_name, contact FROM buyer_authentication WHERE id = ?",
            [buyer_id]
        );

        if (buyerInfo.length === 0) {
            return res.status(400).json({ message: "Invalid buyer ID." });
        }

        // Create the notification ID string (FirstNameLastNameContact without spaces)
        const notificationCustomerId = (
            buyerInfo[0].first_name + 
            buyerInfo[0].last_name + 
            buyerInfo[0].contact
        ).replace(/\s/g, "");

        console.log(`📝 Creating order for buyer_id: ${buyer_id}`);
        console.log(`📝 Notification ID: ${notificationCustomerId}`);

        // 2. Group items by Seller ID
        const ordersBySeller = {};
        for (const item of cart) {
            const { id, quantity, price, seller_id, name } = item;
            
            if (!seller_id) {
                return res.status(400).json({ 
                    message: `Item ${name} (ID: ${id}) is missing a seller_id.` 
                });
            }
            
            const itemTotal = parseFloat(price) * parseInt(quantity);

            if (!ordersBySeller[seller_id]) {
                ordersBySeller[seller_id] = {
                    seller_id,
                    items: [],
                    subtotal: 0,
                };
            }
            ordersBySeller[seller_id].items.push(item);
            ordersBySeller[seller_id].subtotal += itemTotal;
        }
        
        const numOrders = Object.keys(ordersBySeller).length;
        const insertedOrderIds = [];

        await conn.query("START TRANSACTION");

        for (const sellerOrder of Object.values(ordersBySeller)) {
            // 3. Insert Order WITH customer_id for notifications
            const [orderResult] = await conn.query(
                `INSERT INTO orders 
                (seller_id, customer_name, address, contact, notes, total, payment_mode, paid, proof_of_payment, customer_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    sellerOrder.seller_id,
                    customer.name,
                    customer.address,
                    customer.contact,
                    customer.notes || "",
                    sellerOrder.subtotal,
                    payment_mode || "Gcash QR",
                    paid ? 1 : 0,
                    proof_of_payment,
                    notificationCustomerId // Store the notification string
                ]
            );

            const orderId = orderResult.insertId;
            insertedOrderIds.push(orderId);

            // 4. Insert Order Items + Stock Update
            for (const item of sellerOrder.items) {
                await conn.query(
                    "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
                    [orderId, item.id, item.quantity, item.price]
                );

                const [prod] = await conn.query(
                    "SELECT stock FROM fish_products WHERE id = ?", 
                    [item.id]
                );
                
                if (prod.length === 0) {
                    throw new Error(`Product ID ${item.id} not found for stock check`);
                }

                const newStock = prod[0].stock - item.quantity;
                if (newStock < 0) {
                    throw new Error(`Not enough stock for product ${item.id}`);
                }

                await conn.query(
                    "UPDATE fish_products SET stock = ? WHERE id = ?", 
                    [newStock, item.id]
                );
            }
            
            // 5. Send seller notification for the new order
            const message = `You have a new order (#${orderId}) from ${customer.name}.`;
            await conn.query(
                "INSERT INTO seller_notifications (seller_id, message, type) VALUES (?, ?, ?)",
                [sellerOrder.seller_id, message, 'order']
            );
            
            console.log(`✅ Order ${orderId} created for seller: ${sellerOrder.seller_id}`);
        }

        await conn.query("COMMIT");

        return res.json({
            message: `${numOrders} order(s) placed successfully! Your proof of payment has been received.`,
            orderIds: insertedOrderIds,
            date: new Date().toLocaleString()
        });

    } catch (err) {
        await conn.query("ROLLBACK");
        console.error("❌ Place Order Error:", err.message);
        return res.status(500).json({ 
            message: err.message.startsWith("Not enough stock") ? err.message : "Server error while processing order." 
        });
    }
});

// --------------------------
// UPDATED: GET all orders for a seller WITH proof of payment
// --------------------------
app.get("/api/orders", async (req, res) => {
    const sellerId = req.query.seller_id;

    if (!sellerId) {
        return res.status(400).json({ error: "seller_id is required" });
    }

    const sql = `
        SELECT 
          o.id AS order_id,
          o.customer_name,
          o.address,
          o.contact,
          o.notes,
          o.total,
          o.payment_mode,
          o.paid,
          o.proof_of_payment,
          o.order_date,
          o.status,
          oi.id AS item_id,
          oi.product_id,
          oi.quantity,
          oi.price,
          f.name AS product_name
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN fish_products f ON oi.product_id = f.id
        WHERE o.seller_id = ? 
        ORDER BY o.order_date DESC
    `;

    try {
        const [result] = await authDb.promise().query(sql, [sellerId]);
        
        const ordersMap = {};

        result.forEach(row => {
            if (!ordersMap[row.order_id]) {
                ordersMap[row.order_id] = {
                    orderId: row.order_id,
                    customerName: row.customer_name,
                    address: row.address,
                    contact: row.contact,
                    notes: row.notes,
                    total: row.total,
                    paymentMode: row.payment_mode,
                    paid: row.paid,
                    proofOfPayment: row.proof_of_payment, // Include proof path
                    orderDate: row.order_date,
                    status: row.status,
                    items: []
                };
            }

            if (row.item_id) {
                ordersMap[row.order_id].items.push({
                    itemId: row.item_id,
                    productId: row.product_id,
                    productName: row.product_name || "Unknown Product",
                    quantity: row.quantity,
                    price: row.price
                });
            }
        });

        const orders = Object.values(ordersMap);
        res.json(orders);
    } catch (err) {
        console.error("❌ Fetch Orders Error:", err);
        res.status(500).json({ message: "Server error fetching orders" });
    }
});

// --------------------------
// UPDATE Order Status WITH Buyer Notification
// --------------------------
app.put("/api/orders/:id/status", async (req, res) => {
    const orderId = req.params.id;
    const { status, seller_id, customer_id } = req.body; // customer_id is the notification string

    if (!status || !seller_id) {
        return res.status(400).json({ message: "Status and seller_id are required" });
    }

    // Basic validation for allowed status values
    const allowedStatuses = ["Pending", "Preparing", "Ready for Pickup", "Completed", "Cancelled"];
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
    }

    try {
        const conn = authDb.promise();

        // 1. Get order details to retrieve the actual customer_id stored during order creation
        const [orderDetails] = await conn.query(
            "SELECT customer_id FROM orders WHERE id = ? AND seller_id = ?",
            [orderId, seller_id]
        );

        if (orderDetails.length === 0) {
            return res.status(404).json({ message: "Order not found or access denied." });
        }

        const storedCustomerId = orderDetails[0].customer_id;

        // 2. Update order status
        const [result] = await conn.query(
            "UPDATE orders SET status = ? WHERE id = ? AND seller_id = ?",
            [status, orderId, seller_id]
        );

        if (result.affectedRows === 0) {
            return res.status(403).json({ message: "Failed to update order status." });
        }
        
        // 3. Create buyer notification using the customer_id from the order
        if (storedCustomerId) {
            const notificationMessage = `Your order #${orderId} status has been updated to: ${status}`;
            
            await conn.query(
                `INSERT INTO buyer_notifications (customer_id, order_id, seller_id, message) 
                 VALUES (?, ?, ?, ?)`,
                [storedCustomerId, orderId, seller_id, notificationMessage]
            );
            
            console.log(`✅ Notification created for customer: ${storedCustomerId}, Order: ${orderId}`);
        }

        res.json({ 
            message: `Order ${orderId} status updated to ${status}.`,
            notification_sent: !!storedCustomerId
        });
    } catch (err) {
        console.error("❌ Update Order Status Error:", err);
        res.status(500).json({ message: "Server error while updating order status." });
    }
});

// --------------------------
// NEW: GET Seller Notifications
// --------------------------
app.get("/api/seller/notifications", async (req, res) => {
    const { seller_id, is_read } = req.query;

    if (!seller_id) {
        return res.status(400).json({ message: "Seller ID is required." });
    }

    let sql = "SELECT * FROM seller_notifications WHERE seller_id = ?";
    const params = [seller_id];

    if (is_read !== undefined) {
        sql += " AND is_read = ?";
        params.push(is_read === 'true' || is_read === '1' ? 1 : 0);
    }
    
    sql += " ORDER BY created_at DESC";

    try {
        const [notifications] = await authDb.promise().query(sql, params);
        res.json(notifications);
    } catch (err) {
        console.error("❌ Fetch Notifications Error:", err);
        res.status(500).json({ message: "Server error fetching notifications." });
    }
});

// --------------------------
// NEW: Mark Notification as Read
// --------------------------
app.put("/api/seller/notifications/:id/read", async (req, res) => {
    const notificationId = req.params.id;
    const { seller_id } = req.body;

    if (!seller_id) {
        return res.status(400).json({ message: "Seller ID is required." });
    }

    try {
        const [result] = await authDb.promise().query(
            "UPDATE seller_notifications SET is_read = 1 WHERE id = ? AND seller_id = ?",
            [notificationId, seller_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Notification not found or access denied." });
        }

        res.json({ message: "Notification marked as read." });
    } catch (err) {
        console.error("❌ Mark Notification Read Error:", err);
        res.status(500).json({ message: "Server error marking notification as read." });
    }
});


// =================================
// SERVER START
// =================================

const PORT = 5001; // Note: Original log showed port 5001, but typical Node setup often uses 3001/8080. Keeping 3001 as default.
app.listen(PORT, () => {
  console.log(`🚀 Seller Service running on port ${PORT}`);
});