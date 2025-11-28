import express from "express";
import cors from "cors";
import mysql from "mysql2";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================
//  Middleware Configuration
// =============================

const allowedOrigins = ['http://localhost:3000']; 
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // Block requests from unauthorized origins
            callback(new Error('Not allowed by CORS'), false);
        }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true, 
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions)); 

app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =============================
//  Database Connection Pools
// =============================
const createDatabasePool = (database) => {
  return mysql.createPool({
    host: "localhost",
    user: "root",
    password: "12345",
    database: database,
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
};

const buyerDbPool = createDatabasePool("buyer_db");
const sellerAuthDbPool = createDatabasePool("seller_auth_db");
const adminDbPool = createDatabasePool("admin_db");

// Test database connections
buyerDbPool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Buyer database connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL database: buyer_db");
    connection.release();
  }
});

sellerAuthDbPool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Seller Auth DB connection error:", err);
  } else {
    console.log("✅ Connected to seller_auth_db");
    connection.release();
  }
});

adminDbPool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Admin DB connection error:", err);
  } else {
    console.log("✅ Connected to admin_db");
    connection.release();
  }
});

// =============================
//  Constants & Validators
// =============================
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[~`!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/]).{10,}$/;
const SALT_ROUNDS = 10;

const validatePasswordStrength = (password) => {
  return PASSWORD_REGEX.test(password);
};

const validateRequiredFields = (fields, requiredFields) => {
  const missing = requiredFields.filter(field => !fields[field]);
  return missing.length === 0 ? null : missing;
};

/**
 * Helper function to resolve the numerical buyer ID to the notification string ID.
 * @param {string} numericalCustomerId
 * @returns {Promise<string>} 
 */
const resolveNotificationId = async (numericalCustomerId) => {
    try {
        const [buyer] = await buyerDbPool.promise().query(
            "SELECT first_name, last_name, contact FROM buyer_authentication WHERE id = ?",
            [numericalCustomerId]
        );

        if (buyer.length === 0) {
            return null;
        }

        const customerName = `${buyer[0].first_name}${buyer[0].last_name}`;
        const customerContact = buyer[0].contact;
        // Recreate the exact string used by the Seller Service for notification creation
        const notificationId = (customerName + customerContact).replace(/\s/g, "");
        
        console.log(`🔍 Resolved notification ID: ${notificationId} for buyer_id: ${numericalCustomerId}`);
        
        return notificationId;
    } catch (error) {
        console.error("Error resolving notification ID:", error);
        return null;
    }
};

// =============================
//  Buyer Authentication Routes
// =============================

app.post("/api/buyer/register", async (req, res) => {
  const { email, contact, lastName, firstName, middleName, username, password } = req.body;

  const missing = validateRequiredFields(
    { email, contact, lastName, firstName, username, password },
    ["email", "contact", "lastName", "firstName", "username", "password"]
  );

  if (missing) {
    return res.status(400).json({ 
      message: "Please fill in all required fields.",
      missing_fields: missing 
    });
  }

  if (!validatePasswordStrength(password)) {
    return res.status(400).json({
      message: "Password must contain at least 10 characters, including 1 lowercase, 1 uppercase, 1 number, and 1 special character."
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    const sql = `
      INSERT INTO buyer_authentication 
      (email, contact, last_name, first_name, middle_name, username, password_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    buyerDbPool.query(
      sql,
      [email, contact, lastName, firstName, middleName, username, hashedPassword],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ 
              message: "Email or username already exists." 
            });
          }
          console.error("Registration error:", err);
          return res.status(500).json({ 
            message: "Database error during registration." 
          });
        }
        return res.status(201).json({ 
          message: "Registration successful!" 
        });
      }
    );
  } catch (error) {
    console.error("Server error during registration:", error);
    return res.status(500).json({ 
      message: "Server error during registration." 
    });
  }
});

app.post("/api/buyer/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      message: "Email and password are required." 
    });
  }

  const sql = "SELECT * FROM buyer_authentication WHERE email = ?";
  
  buyerDbPool.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("Login query error:", err);
      return res.status(500).json({ 
        message: "Server error." 
      });
    }

    if (results.length === 0) {
      return res.status(401).json({ 
        message: "Invalid email or password." 
      });
    }

    const user = results[0];
    
    try {
      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (!isMatch) {
        return res.status(401).json({ 
          message: "Invalid email or password." 
        });
      }

      const customerIdentifier = (user.first_name + user.last_name + user.contact)
        .replace(/\s/g, "");

      return res.status(200).json({
        message: "Login successful!",
        buyer: {
          id: user.id,
          email: user.email,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          notification_id: customerIdentifier
        }
      });
    } catch (compareError) {
      console.error("Password comparison error:", compareError);
      return res.status(500).json({ 
        message: "Server error during login." 
      });
    }
  });
});

// =============================
//  Buyer Profile Routes
// =============================

app.get("/api/buyer/profile/:buyer_id", async (req, res) => {
  const { buyer_id } = req.params;
  
  if (!buyer_id) {
    return res.status(400).json({ 
      message: "Buyer ID is required." 
    });
  }

  try {
    console.log("🔍 Fetching profile for buyer_id:", buyer_id);
    
    const sql = `
      SELECT 
        id,
        email,
        contact,
        last_name,
        first_name,
        middle_name,
        username,
        created_at
      FROM buyer_authentication 
      WHERE id = ?
    `;
    
    const [results] = await buyerDbPool.promise().query(sql, [buyer_id]);
    
    if (results.length === 0) {
      console.log("❌ Buyer not found with ID:", buyer_id);
      return res.status(404).json({ 
        message: "Buyer not found." 
      });
    }

    const buyer = results[0];
    console.log("✅ Profile found:", buyer.email);
    
    return res.status(200).json({
      id: buyer.id,
      email: buyer.email,
      contact: buyer.contact,
      last_name: buyer.last_name,
      first_name: buyer.first_name,
      middle_name: buyer.middle_name,
      username: buyer.username,
      created_at: buyer.created_at
    });
    
  } catch (err) {
    console.error("❌ Error fetching buyer profile:", err);
    return res.status(500).json({ 
      message: "Server error fetching profile.",
      error: err.message 
    });
  }
});

// =============================
//  Buyer Purchase History Routes
// =============================

app.get("/api/buyer/purchases", async (req, res) => {
  const { buyer_id } = req.query;

  if (!buyer_id) {
    return res.status(400).json({ 
      message: "Buyer ID is required." 
    });
  }

  try {
    // Get buyer information
    const [buyer] = await buyerDbPool.promise().query(
      "SELECT first_name, last_name, contact FROM buyer_authentication WHERE id = ?",
      [buyer_id]
    );

    if (buyer.length === 0) {
      return res.status(404).json({ message: "Buyer not found." });
    }

    // Create the same notification ID format used in order creation
    const notificationCustomerId = (
      buyer[0].first_name + 
      buyer[0].last_name + 
      buyer[0].contact
    ).replace(/\s/g, "");

    console.log(`🔍 Searching for purchases using customer_id: ${notificationCustomerId}`);

    // Query using customer_id
    const sql = `
      SELECT 
        oi.id AS purchase_id,
        oi.product_id,
        fp.name AS product_name,
        oi.price,
        oi.quantity,
        o.order_date AS created_at,
        o.id AS order_id,
        CONCAT('ORD-', LPAD(o.id, 6, '0')) AS order_number,
        o.status,
        fp.image_url,
        0 AS rating
      FROM seller_auth_db.orders o
      JOIN seller_auth_db.order_items oi ON o.id = oi.order_id
      LEFT JOIN seller_auth_db.fish_products fp ON oi.product_id = fp.id
      WHERE o.customer_id = ?
      ORDER BY o.order_date DESC
      LIMIT 10
    `;

    const [results] = await sellerAuthDbPool.promise().query(sql, [notificationCustomerId]);
    
    console.log(`✅ Found ${results.length} purchases`);
    
    return res.status(200).json(results);
  } catch (err) {
    console.error("❌ Error fetching purchases:", err);
    return res.status(500).json({ 
      message: "Server error fetching purchases.",
      error: err.message 
    });
  }
});

app.get("/api/buyer/orders", async (req, res) => {
  const { buyer_id } = req.query;

  if (!buyer_id) {
    return res.status(400).json({ 
      message: "Buyer ID is required." 
    });
  }

  try {
    const [buyer] = await buyerDbPool.promise().query(
      "SELECT first_name, last_name, contact FROM buyer_authentication WHERE id = ?",
      [buyer_id]
    );

    if (buyer.length === 0) {
      return res.status(404).json({ message: "Buyer not found." });
    }

    // Create the same notification ID format used in order creation
    const notificationCustomerId = (
      buyer[0].first_name + 
      buyer[0].last_name + 
      buyer[0].contact
    ).replace(/\s/g, "");

    console.log(`🔍 Searching for orders using customer_id: ${notificationCustomerId}`);

    // Query using customer_id instead of customer_name
    const sql = `
      SELECT 
        o.id,
        CONCAT('ORD-', LPAD(o.id, 6, '0')) AS order_number,
        o.total AS total_amount,
        o.status,
        o.payment_mode AS payment_status,
        o.order_date AS created_at,
        s.shop_name,
        COUNT(oi.id) AS item_count
      FROM seller_auth_db.orders o
      LEFT JOIN admin_db.sellers s ON o.seller_id = s.unique_id
      LEFT JOIN seller_auth_db.order_items oi ON o.id = oi.order_id
      WHERE o.customer_id = ?
      GROUP BY o.id
      ORDER BY o.order_date DESC
    `;

    const [results] = await sellerAuthDbPool.promise().query(sql, [notificationCustomerId]);
    
    console.log(`✅ Found ${results.length} orders`);
    
    return res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching orders:", err);
    return res.status(500).json({ 
      message: "Server error fetching orders.",
      error: err.message 
    });
  }
});

app.get("/api/buyer/orders/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const { buyer_id } = req.query;

  if (!buyer_id) {
    return res.status(400).json({ 
      message: "Buyer ID is required." 
    });
  }

  try {
    const [buyer] = await buyerDbPool.promise().query(
      "SELECT first_name, last_name, contact FROM buyer_authentication WHERE id = ?",
      [buyer_id]
    );

    if (buyer.length === 0) {
      return res.status(404).json({ message: "Buyer not found." });
    }

    // Create the same notification ID format used in order creation
    const notificationCustomerId = (
      buyer[0].first_name + 
      buyer[0].last_name + 
      buyer[0].contact
    ).replace(/\s/g, "");

    // Query using customer_id instead of customer_name
    const orderSql = `
      SELECT 
        o.*,
        s.shop_name
      FROM seller_auth_db.orders o
      LEFT JOIN admin_db.sellers s ON o.seller_id = s.unique_id
      WHERE o.id = ? AND o.customer_id = ?
    `;

    const [orders] = await sellerAuthDbPool.promise().query(orderSql, [orderId, notificationCustomerId]);

    if (orders.length === 0) {
      return res.status(404).json({ 
        message: "Order not found." 
      });
    }

    const itemsSql = `
      SELECT 
        oi.*,
        fp.name AS product_name,
        fp.image_url
      FROM seller_auth_db.order_items oi
      LEFT JOIN seller_auth_db.fish_products fp ON oi.product_id = fp.id
      WHERE oi.order_id = ?
    `;

    const [items] = await sellerAuthDbPool.promise().query(itemsSql, [orderId]);

    return res.status(200).json({
      order: orders[0],
      items: items
    });
  } catch (err) {
    console.error("Error fetching order details:", err);
    return res.status(500).json({ 
      message: "Server error fetching order details.",
      error: err.message 
    });
  }
});

// =============================
//  Shopping Cart Routes
// =============================

app.post("/api/buyer/cart", (req, res) => {
  const { buyer_id, product_id, quantity } = req.body;
  
  if (!buyer_id || !product_id || !quantity) {
    return res.status(400).json({ 
      message: "buyer_id, product_id, and quantity are required." 
    });
  }

  const sql = `
    INSERT INTO buyer_cart (buyer_id, product_id, quantity)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
  `;

  buyerDbPool.query(sql, [buyer_id, product_id, quantity], (err, result) => {
    if (err) {
      console.error("Error adding to cart:", err);
      return res.status(500).json({ 
        message: "Server error adding to cart." 
      });
    }
    return res.status(200).json({ 
      message: "Item added to cart successfully." 
    });
  });
});

app.get("/api/buyer/cart/:buyer_id", (req, res) => {
  const { buyer_id } = req.params;

  const sql = `
    SELECT 
      c.id AS cart_id, 
      fp.name AS product_name, 
      fp.price, 
      c.quantity, 
      fp.image_url
    FROM buyer_cart c
    JOIN seller_auth_db.fish_products fp ON c.product_id = fp.id
    WHERE c.buyer_id = ?
  `;

  buyerDbPool.query(sql, [buyer_id], (err, results) => {
    if (err) {
      console.error("Error fetching cart:", err);
      return res.status(500).json({ 
        message: "Server error fetching cart." 
      });
    }
    return res.status(200).json(results);
  });
});

// =============================
//  Shop & Product Routes
// =============================

app.get("/api/shop", async (req, res) => {
  try {
    const sellerSql = `
      SELECT s.unique_id, s.shop_name, sp.logo
      FROM admin_db.sellers s
      LEFT JOIN seller_auth_db.seller_profiles sp ON s.unique_id = sp.seller_id
      WHERE s.status = 'accepted'
    `;
    
    const [sellers] = await adminDbPool.promise().query(sellerSql);

    if (!sellers || sellers.length === 0) {
      return res.json([]);
    }

    const [products] = await sellerAuthDbPool.promise().query(
      "SELECT * FROM fish_products"
    );

    const shopMap = {};
    
    sellers.forEach((seller) => {
      shopMap[seller.unique_id] = { 
        seller_id: seller.unique_id, 
        shop_name: seller.shop_name, 
        logo: seller.logo,
        products: [] 
      };
    });

    products.forEach((product) => {
      if (shopMap[product.seller_id]) {
        shopMap[product.seller_id].products.push(product);
      }
    });

    res.json(Object.values(shopMap));
  } catch (err) {
    console.error("Error fetching shops:", err);
    res.status(500).json({ 
      message: "Server error while fetching shops." 
    });
  }
});

app.get("/api/shop/:shopId/products", async (req, res) => {
  const { shopId } = req.params;

  try {
    const checkSql = `
      SELECT shop_name 
      FROM admin_db.sellers 
      WHERE unique_id = ? AND status = 'accepted'
    `;
    
    const [sellers] = await adminDbPool.promise().query(checkSql, [shopId]);

    if (sellers.length === 0) {
      return res.status(404).json({ 
        message: "Shop not found or not active." 
      });
    }

    const productSql = "SELECT * FROM fish_products WHERE seller_id = ?";
    const [products] = await sellerAuthDbPool.promise().query(productSql, [shopId]);

    return res.status(200).json({ 
      shop_name: sellers[0].shop_name,
      products: products 
    });
  } catch (err) {
    console.error(`Error fetching products for shop ${shopId}:`, err);
    return res.status(500).json({ 
      message: "Server error while fetching products." 
    });
  }
});

app.post("/api/products/details", async (req, res) => {
  const { product_ids } = req.body;

  if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
    return res.status(400).json({ 
      message: "product_ids array is required." 
    });
  }

  try {
    const placeholders = product_ids.map(() => '?').join(',');
    const sql = `
      SELECT id, name, category, price, stock, unit, seller_id, image_url
      FROM seller_auth_db.fish_products 
      WHERE id IN (${placeholders})
    `;
    
    const [products] = await sellerAuthDbPool.promise().query(sql, product_ids);

    return res.status(200).json(products);
  } catch (err) {
    console.error("Error fetching product details:", err);
    return res.status(500).json({ 
      message: "Server error fetching product details." 
    });
  }
});

// =============================
//  Notification Routes
// =============================

app.get("/api/buyer/:customerId/notifications", async (req, res) => {
    const { customerId: numericalCustomerId } = req.params;

    console.log(`📬 Fetching notifications for buyer_id: ${numericalCustomerId}`);

    try {
        // Resolve the numerical ID to the string identifier
        const notificationIdString = await resolveNotificationId(numericalCustomerId);
        
        if (!notificationIdString) {
            console.log(`❌ Could not resolve notification ID for buyer_id: ${numericalCustomerId}`);
            return res.status(404).json({ message: "Buyer not found or invalid ID." });
        }

        console.log(`✅ Looking for notifications with customer_id: ${notificationIdString}`);

        // Fetch notifications from seller_auth_db
        const notifSql = `
            SELECT 
                id, 
                order_id, 
                seller_id,
                message, 
                is_read, 
                created_at
            FROM buyer_notifications
            WHERE customer_id = ? 
            ORDER BY created_at DESC
        `;

        const [notifications] = await sellerAuthDbPool.promise().query(notifSql, [notificationIdString]);

        console.log(`📊 Found ${notifications.length} notifications for: ${notificationIdString}`);

        if (notifications.length === 0) {
             return res.json({ count: 0, notifications: [] });
        }
        
        // Extract unique seller IDs and fetch shop names
        const sellerIds = [...new Set(notifications.map(n => n.seller_id).filter(id => id))];
        
        let shopMap = {};

        if (sellerIds.length > 0) {
            const placeholders = sellerIds.map(() => '?').join(',');
            const sellerSql = `
                SELECT unique_id, shop_name 
                FROM sellers 
                WHERE unique_id IN (${placeholders})
            `;

            const [sellers] = await adminDbPool.promise().query(sellerSql, sellerIds);
            
            shopMap = sellers.reduce((map, seller) => {
                map[seller.unique_id] = seller.shop_name;
                return map;
            }, {});
        }

        // Merge data and calculate unread count
        let unreadCount = 0;
        const finalNotifications = notifications.map(n => {
            const isRead = n.is_read === 1; 
            
            if (!isRead) unreadCount++; 
            
            return {
                id: n.id,
                order_id: n.order_id,
                message: n.message ? String(n.message) : `Order #${n.order_id} update.`, 
                shop_name: shopMap[n.seller_id] || 'Shop Not Found',
                is_read: isRead,
                created_at: n.created_at
            };
        });

        console.log(`✅ Returning ${finalNotifications.length} notifications, ${unreadCount} unread`);

        res.json({
            count: unreadCount,
            notifications: finalNotifications
        });
    } catch (err) {
        console.error("❌ Fetch Notifications Error:", err);
        res.status(500).json({ 
            message: "Server error while fetching notifications.",
            error: err.message 
        });
    }
});

app.put("/api/buyer/notifications/:id/read", async (req, res) => {
  const notificationId = req.params.id;
  const { customer_id: numericalCustomerId } = req.body; 

  if (!numericalCustomerId) {
    return res.status(400).json({ 
      message: "Customer ID required for verification." 
    });
  }

  try {
    const notificationIdString = await resolveNotificationId(numericalCustomerId);
    
    if (!notificationIdString) {
        return res.status(404).json({ message: "Invalid customer ID." });
    }

    const [result] = await sellerAuthDbPool.promise().query(
      "UPDATE buyer_notifications SET is_read = TRUE WHERE id = ? AND customer_id = ?",
      [notificationId, notificationIdString]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        message: "Notification not found or does not belong to this customer." 
      });
    }

    res.json({ 
      message: `Notification ${notificationId} marked as read.` 
    });
  } catch (err) {
    console.error("❌ Mark Read Error:", err);
    res.status(500).json({ 
      message: "Server error while marking notification as read." 
    });
  }
});

app.put("/api/buyer/:customerId/notifications/read-all", async (req, res) => {
  const { customerId: numericalCustomerId } = req.params;

  try {
    const notificationIdString = await resolveNotificationId(numericalCustomerId);
    
    if (!notificationIdString) {
        return res.status(404).json({ message: "Invalid customer ID." });
    }

    const [result] = await sellerAuthDbPool.promise().query(
      "UPDATE buyer_notifications SET is_read = TRUE WHERE customer_id = ? AND is_read = FALSE",
      [notificationIdString]
    );

    res.json({ 
      message: "All notifications marked as read.",
      updated_count: result.affectedRows
    });
  } catch (err) {
    console.error("❌ Mark All Read Error:", err);
    res.status(500).json({ 
      message: "Server error while marking all notifications as read." 
    });
  }
});

// Test notification ID resolution
app.get("/api/buyer/debug/notification-id/:buyer_id", async (req, res) => {
  const { buyer_id } = req.params;
  
  try {
    const [buyer] = await buyerDbPool.promise().query(
      "SELECT id, first_name, last_name, contact FROM buyer_authentication WHERE id = ?",
      [buyer_id]
    );
    
    if (buyer.length === 0) {
      return res.json({ error: "Buyer not found", buyer_id });
    }
    
    const notificationId = (buyer[0].first_name + buyer[0].last_name + buyer[0].contact).replace(/\s/g, "");
    
    // Check if notifications exist with this ID
    const [notifications] = await sellerAuthDbPool.promise().query(
      "SELECT COUNT(*) as count FROM buyer_notifications WHERE customer_id = ?",
      [notificationId]
    );
    
    // Get all unique customer_ids in buyer_notifications
    const [allCustomerIds] = await sellerAuthDbPool.promise().query(
      "SELECT DISTINCT customer_id FROM buyer_notifications LIMIT 20"
    );
    
    return res.json({
      buyer_info: buyer[0],
      calculated_notification_id: notificationId,
      notifications_found: notifications[0].count,
      all_customer_ids_in_db: allCustomerIds.map(row => row.customer_id)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Check all notifications for debugging
app.get("/api/buyer/debug/all-notifications", async (req, res) => {
  try {
    const [notifications] = await sellerAuthDbPool.promise().query(
      `SELECT 
        id, 
        customer_id, 
        order_id, 
        seller_id,
        message,
        is_read,
        created_at
      FROM buyer_notifications 
      ORDER BY created_at DESC 
      LIMIT 50`
    );
    
    res.json({
      total: notifications.length,
      notifications
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Check buyer data
app.get("/api/buyer/debug/buyers", async (req, res) => {
  try {
    const [buyers] = await buyerDbPool.promise().query(
      "SELECT id, first_name, last_name, contact, email FROM buyer_authentication LIMIT 20"
    );
    
    const buyersWithNotificationIds = buyers.map(buyer => ({
      ...buyer,
      notification_id: (buyer.first_name + buyer.last_name + buyer.contact).replace(/\s/g, "")
    }));
    
    res.json(buyersWithNotificationIds);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// =============================
//  Server Initialization
// =============================
const PORT = 5002;

app.listen(PORT, () => {
  console.log(`🚀 Buyer Service running on http://localhost:${PORT}`);
});