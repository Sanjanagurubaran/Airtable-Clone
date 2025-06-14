const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

//Backend...
const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

// MySQL connection 
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Gvss972010@',
  database: 'airtable_clone_db',
});

// Create tables table 
async function createTableIfNotExists() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS tables (
      id INT AUTO_INCREMENT PRIMARY KEY,
      base_name VARCHAR(255) UNIQUE NOT NULL,
      table_json LONGTEXT NOT NULL
    );
  `);
}
createTableIfNotExists();

// Home route - show main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'airtablemain.html'));
});

// Save table API
app.post('/api/save-table', async (req, res) => {
  try {
    const { baseName, tableData } = req.body;
    const jsonData = JSON.stringify(tableData);

    await db.query(
      `INSERT INTO tables (base_name, table_json) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE table_json = ?`,
      [baseName, jsonData, jsonData]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Save Error:', err);
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
app.get('/api/get-all-tables', async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT base_name FROM tables`);
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