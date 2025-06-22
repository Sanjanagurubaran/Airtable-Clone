const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const JWT_SECRET = 'sadhana_secret_key';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// MySQL connection
const db = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'your password',
  database: 'your db',
});

// Create tables if not exists
async function createTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS tables (
      id INT AUTO_INCREMENT PRIMARY KEY,
      base_name VARCHAR(255) NOT NULL,
      table_json LONGTEXT NOT NULL,
      is_deleted BOOLEAN DEFAULT FALSE,
      user_id INT NOT NULL,
      UNIQUE(base_name, user_id)
    );
  `);
}
createTables();

// Middleware to verify JWT
function verifyToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// Register API
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashed]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: 'Username already exists' });
  }
});

// Login API
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
  if (rows.length === 0) return res.status(401).json({ error: 'User not found' });

  const match = await bcrypt.compare(password, rows[0].password);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ username, user_id: rows[0].id }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token });
});

// Verify token
app.get('/api/verify-token', (req, res) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).send({ success: false });

  jwt.verify(token, JWT_SECRET, (err) => {
    if (err) return res.status(401).send({ success: false });
    res.send({ success: true });
  });
});

// Save new base
app.post('/api/save-base', verifyToken, async (req, res) => {
  const { baseName } = req.body;
  const userId = req.user.user_id;
  try {
    await db.query(
      `INSERT INTO tables (base_name, table_json, is_deleted, user_id) VALUES (?, ?, FALSE, ?)`,
      [baseName, JSON.stringify([]), userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Base already exists for this user' });
  }
});

// Save table data
app.post('/api/save-table', verifyToken, async (req, res) => {
  const { baseName, tableData } = req.body;
  const userId = req.user.user_id;
  if (!baseName || !tableData) {
    return res.status(400).json({ success: false, error: 'Invalid request' });
  }

  try {
    await db.query(
      `UPDATE tables SET table_json = ? WHERE base_name = ? AND user_id = ?`,
      [JSON.stringify(tableData), baseName, userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Load table
app.get('/api/load-table/:baseName', verifyToken, async (req, res) => {
  const baseName = req.params.baseName;
  const userId = req.user.user_id;
  try {
    const [rows] = await db.query(
      `SELECT table_json FROM tables WHERE base_name = ? AND user_id = ?`,
      [baseName, userId]
    );

    if (rows.length === 0) {
      return res.json({ tableData: null });
    }

    const tableData = JSON.parse(rows[0].table_json);
    res.json({ tableData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all tables
app.get('/api/get-all-tables', verifyToken, async (req, res) => {
  const userId = req.user.user_id;
  try {
    const [rows] = await db.query(
      `SELECT base_name FROM tables WHERE is_deleted = FALSE AND user_id = ?`,
      [userId]
    );
    const baseNames = rows.map(row => row.base_name);
    res.json({ baseNames });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get deleted tables
app.get('/api/get-deleted-tables', verifyToken, async (req, res) => {
  const userId = req.user.user_id;
  try {
    const [rows] = await db.query(
      `SELECT base_name FROM tables WHERE is_deleted = TRUE AND user_id = ?`,
      [userId]
    );
    const baseNames = rows.map(row => row.base_name);
    res.json({ baseNames });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Soft delete base
app.post('/api/delete-base', verifyToken, async (req, res) => {
  const { baseName } = req.body;
  const userId = req.user.user_id;
  try {
    await db.query(
      `UPDATE tables SET is_deleted = TRUE WHERE base_name = ? AND user_id = ?`,
      [baseName, userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Restore base
app.post('/api/restore-base', verifyToken, async (req, res) => {
  const { baseName } = req.body;
  const userId = req.user.user_id;
  try {
    await db.query(
      `UPDATE tables SET is_deleted = FALSE WHERE base_name = ? AND user_id = ?`,
      [baseName, userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(` Server running at: http://localhost:${PORT}`);
});