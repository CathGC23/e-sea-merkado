const bcrypt = require("bcrypt");
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "12345",
  database: "admin_db",
  port: 3306,
});

const username = "001-Admin"; // your username
const admin_id = "A123456";   // generated admin ID
const password = "admin123";  // plain password

bcrypt.hash(password, 10, (err, hash) => {
  if (err) throw err;

  db.query(
    "INSERT INTO admins (username, admin_id, password_hash) VALUES (?, ?, ?)",
    [username, admin_id, hash],
    (err, result) => {
      if (err) throw err;
      console.log("Admin created with ID:", result.insertId);
      db.end();
    }
  );
});
