/**
 * RUPAIYA — Smart Daily Expense Tracker
 * Backend API Server — Express + MySQL
 */

const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rupaiya_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test DB Connection
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL Connected successfully');
    conn.release();
  })
  .catch(err => console.error('❌ MySQL Connection Error:', err));

/* ═══════════════════════════════════
   USERS ENDPOINTS
═══════════════════════════════════ */

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.query('SELECT id, name, email, created_at FROM users');
    connection.release();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get current user (for demo, return first user or create default)
app.get('/api/users/current', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    let [users] = await connection.query('SELECT id, name, email FROM users LIMIT 1');
    
    if (users.length === 0) {
      // Create default user if none exist
      const hashedPass = await bcrypt.hash('password123', 10);
      await connection.query(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        ['John Doe', 'john@example.com', hashedPass]
      );
      [users] = await connection.query('SELECT id, name, email FROM users LIMIT 1');
    }
    
    connection.release();
    res.json({ success: true, data: users[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ═══════════════════════════════════
   EXPENSES ENDPOINTS
═══════════════════════════════════ */

// Get all expenses for a user
app.get('/api/expenses', async (req, res) => {
  try {
    const userId = req.query.user_id || 1;
    const connection = await pool.getConnection();
    const [expenses] = await connection.query(
      'SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC',
      [userId]
    );
    connection.release();
    res.json({ success: true, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add expense
app.post('/api/expenses', async (req, res) => {
  try {
    const { user_id, title, category, amount, payment_method, notes, date } = req.body;
    const connection = await pool.getConnection();
    
    const result = await connection.query(
      'INSERT INTO expenses (user_id, title, category, amount, payment_method, notes, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user_id || 1, title, category, amount, payment_method, notes || '', date]
    );
    
    connection.release();
    res.json({ success: true, data: { id: result[0].insertId, user_id, title, category, amount, payment_method, notes, date } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM expenses WHERE id = ?', [id]);
    connection.release();
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update expense
app.put('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, amount, payment_method, notes, date } = req.body;
    const connection = await pool.getConnection();
    
    await connection.query(
      'UPDATE expenses SET title = ?, category = ?, amount = ?, payment_method = ?, notes = ?, date = ? WHERE id = ?',
      [title, category, amount, payment_method, notes, date, id]
    );
    
    connection.release();
    res.json({ success: true, message: 'Expense updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ═══════════════════════════════════
   INCOME ENDPOINTS
═══════════════════════════════════ */

// Get all income for a user
app.get('/api/income', async (req, res) => {
  try {
    const userId = req.query.user_id || 1;
    const connection = await pool.getConnection();
    const [income] = await connection.query(
      'SELECT * FROM income WHERE user_id = ? ORDER BY date DESC',
      [userId]
    );
    connection.release();
    res.json({ success: true, data: income });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add income
app.post('/api/income', async (req, res) => {
  try {
    const { user_id, source, amount, date, notes } = req.body;
    const connection = await pool.getConnection();
    
    const result = await connection.query(
      'INSERT INTO income (user_id, source, amount, date, notes) VALUES (?, ?, ?, ?, ?)',
      [user_id || 1, source, amount, date, notes || '']
    );
    
    connection.release();
    res.json({ success: true, data: { id: result[0].insertId, user_id, source, amount, date, notes } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete income
app.delete('/api/income/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM income WHERE id = ?', [id]);
    connection.release();
    res.json({ success: true, message: 'Income deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ═══════════════════════════════════
   BUDGET ENDPOINTS
═══════════════════════════════════ */

// Get budget for user
app.get('/api/budgets/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const connection = await pool.getConnection();
    
    let [budgets] = await connection.query('SELECT * FROM budgets WHERE user_id = ?', [user_id]);
    
    if (budgets.length === 0) {
      // Create default budget if none exists
      await connection.query(
        'INSERT INTO budgets (user_id, monthly_budget, daily_limit, warn_threshold) VALUES (?, ?, ?, ?)',
        [user_id, 30000, 2000, 80]
      );
      [budgets] = await connection.query('SELECT * FROM budgets WHERE user_id = ?', [user_id]);
    }
    
    connection.release();
    res.json({ success: true, data: budgets[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update budget
app.put('/api/budgets/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { monthly_budget, daily_limit, warn_threshold } = req.body;
    const connection = await pool.getConnection();
    
    // Check if budget exists
    const [existing] = await connection.query('SELECT id FROM budgets WHERE user_id = ?', [user_id]);
    
    if (existing.length === 0) {
      // Create if doesn't exist
      await connection.query(
        'INSERT INTO budgets (user_id, monthly_budget, daily_limit, warn_threshold) VALUES (?, ?, ?, ?)',
        [user_id, monthly_budget, daily_limit, warn_threshold]
      );
    } else {
      // Update if exists
      await connection.query(
        'UPDATE budgets SET monthly_budget = ?, daily_limit = ?, warn_threshold = ? WHERE user_id = ?',
        [monthly_budget, daily_limit, warn_threshold, user_id]
      );
    }
    
    connection.release();
    res.json({ success: true, message: 'Budget updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ═══════════════════════════════════
   STATISTICS ENDPOINTS
═══════════════════════════════════ */

// Get dashboard stats
app.get('/api/stats/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const connection = await pool.getConnection();
    
    // Total income
    const [incomeResult] = await connection.query(
      'SELECT SUM(amount) as total FROM income WHERE user_id = ?',
      [user_id]
    );
    
    // Total expenses
    const [expenseResult] = await connection.query(
      'SELECT SUM(amount) as total FROM expenses WHERE user_id = ?',
      [user_id]
    );
    
    // This month expenses
    const [thisMonthResult] = await connection.query(
      'SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND YEAR(date) = YEAR(CURDATE()) AND MONTH(date) = MONTH(CURDATE())',
      [user_id]
    );
    
    // Today expenses
    const [todayResult] = await connection.query(
      'SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND date = CURDATE()',
      [user_id]
    );
    
    connection.release();
    
    const totalIncome = incomeResult[0].total || 0;
    const totalExpenses = expenseResult[0].total || 0;
    const thisMonthExpenses = thisMonthResult[0].total || 0;
    const todayExpenses = todayResult[0].total || 0;
    
    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        thisMonthExpenses,
        todayExpenses
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running ✅' });
});

// Start server
const PORT = process.env.SERVER_PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.DB_NAME || 'rupaiya_db'}`);
});
