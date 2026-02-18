const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool(process.env.DATABASE_URL);

// Test connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Connected to Railway MySQL (Public URL)");
    connection.release();
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
})();

module.exports = pool;
