const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const jwt=require('jsonwebtoken');
const bcrypt=require('bcryptjs');
const JWT_SECRET='sadhana_secret_key';


//Backend...
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

// Create tables table 
async function createTableIfNotExists() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS tables (
      id INT AUTO_INCREMENT PRIMARY KEY,
      base_name VARCHAR(255) UNIQUE NOT NULL,
      table_json LONGTEXT NOT NULL,
      is_deleted BOOLEAN DEFAULT FALSE
    );
  `);
}
createTableIfNotExists();

// In your server code

app.get('/api/verify-token', (req, res) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).send({ success: false });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).send({ success: false });
    res.send({ success: true });
  });
});

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

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token });
});

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
// Home route - show main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Save table API// Create base with empty table
app.post('/api/save-base', verifyToken, async (req, res) => {
  const { baseName } = req.body;

  try {
    await db.query(
      `INSERT INTO tables (base_name, table_json, is_deleted) VALUES (?, ?, FALSE)`,
      [baseName, JSON.stringify([])]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Save Base Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Soft delete a base
app.post('/api/delete-base', async (req, res) => {
  const { baseName } = req.body;
  try {
    await db.query(`UPDATE tables SET is_deleted = TRUE WHERE base_name = ?`, [baseName]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete Error:', err);
    res.status(500).json({ success: false });
  }
});

// Restore base from Trash
app.post('/api/restore-base', async (req, res) => {
  const { baseName } = req.body;
  try {
    await db.query(`UPDATE tables SET is_deleted = FALSE WHERE base_name = ?`, [baseName]);
    res.json({ success: true });
  } catch (err) {
    console.error('Restore Error:', err);
    res.status(500).json({ success: false });
  }
});
app.post('/api/save-table', async (req, res) => {
  const { baseName, tableData } = req.body;

  if (!baseName || !tableData) {
    return res.status(400).json({ success: false, error: 'Invalid request' });
  }

  try {
    await db.query(
      `UPDATE tables SET table_json = ? WHERE base_name = ?`,
      [JSON.stringify(tableData), baseName]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Save Table Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// Load table API
app.get('/api/load-table/:baseName', async (req, res) => {
  try {
    const baseName = req.params.baseName;
    const [rows] = await db.query(
      `SELECT table_json FROM tables WHERE base_name = ?`,
      [baseName]
    );

    if (rows.length === 0) {
      return res.json({ tableData: null });
    }

    let tableData;
    try {
      tableData = JSON.parse(rows[0].table_json);
    } catch (parseError) {
      return res.status(500).json({ error: 'Corrupted table data in DB' });
    }

    res.json({ tableData });
  } catch (err) {
    console.error('Load Error:', err);
    res.status(500).json({ error: err.message });
  }
});
// Get all saved base names (to show cards on main page)
// Get all base names (not deleted)
app.get('/api/get-all-tables', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT base_name FROM tables WHERE is_deleted = FALSE`);
    const baseNames = rows.map(row => row.base_name);
    res.json({ baseNames });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/get-deleted-tables', async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT base_name FROM tables WHERE is_deleted = TRUE`);
    const baseNames = rows.map(row => row.base_name);
    res.json({ baseNames });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at: http://localhost:${PORT}`);
});
