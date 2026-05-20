# 🪙 RUPAIYA — Smart Expense Tracker

**Complete Full-Stack Application with Frontend + Backend Connected**

---

## 📋 Project Structure

```
d:\friends\
├── p.html                 # Frontend HTML (Main UI)
├── p.css                  # Frontend Styles
├── script.js              # Frontend JavaScript (API-connected)
├── chart.js / charts.js   # Chart.js visualization
├── p.sql                  # Database schema (old copy)
├── database.sql           # Database schema (setup file)
├── backend/
│   ├── package.json       # Node.js dependencies
│   ├── .env               # Environment configuration
│   ├── server.js          # Express API Server
│   └── node_modules/      # (created after npm install)
└── README.md              # This file
```

---

## 🚀 Quick Start (5 minutes)

### **Step 1: Set Up MySQL Database**

**Option A: Using Command Line**
```bash
# Open Command Prompt or PowerShell and run:
mysql -u root -p < d:\friends\database.sql

# When prompted, enter your MySQL root password (leave blank if none set)
```

**Option B: Using MySQL Workbench (GUI)**
1. Open MySQL Workbench
2. File → Open SQL Script → Select `database.sql`
3. Click ⚡ Execute
4. Wait for completion

**Verify Database Created:**
```bash
mysql -u root -p
mysql> show databases;
mysql> use rupaiya_db;
mysql> show tables;
mysql> exit;
```

---

### **Step 2: Set Up Backend Server**

```bash
# Navigate to backend folder
cd d:\friends\backend

# Install dependencies (one-time only)
npm install

# Start the server
npm start
```

**Expected Output:**
```
✅ MySQL Connected successfully
🚀 Server running on http://localhost:5000
📊 Database: rupaiya_db
```

⚠️ **Keep this terminal open!**

---

### **Step 3: Run Frontend**

**Option A: Direct Browser (Simplest)**
```bash
# Windows: Just double-click p.html in File Explorer
# Or right-click → Open with Browser
```

**Option B: Local Web Server**
```bash
# Open a NEW terminal (keep backend running in first terminal)
cd d:\friends

# Option 1: Using Python
python -m http.server 8000
# Then open: http://localhost:8000/p.html

# Option 2: Using Node.js
npx http-server
# Then open: http://localhost:8080/p.html

# Option 3: Using VS Code Live Server
# Install extension: ritwickdey.LiveServer
# Right-click p.html → Open with Live Server
```

---

## ✅ Testing the Connection

1. **Backend Running?**
   - Open http://localhost:5000/api/health in browser
   - Should see: `{"status":"Backend is running ✅"}`

2. **Frontend Loaded?**
   - Open http://localhost:8000/p.html (or similar)
   - Should load the expense tracker UI

3. **Can Add Data?**
   - Navigate to "Income" tab
   - Add an income entry (e.g., "Salary - ₹50000")
   - Should see toast: "Income of ₹50000 added ✓"
   - Data persists in MySQL (check via `SELECT * FROM income;`)

---

## 📱 Features Included

✅ **Dashboard**
- Real-time balance, income, expenses
- Budget progress bars
- Smart spending warnings
- Recent transactions
- Weekly expense chart

✅ **Income Tracking**
- Add multiple income sources
- Track by date
- View total income

✅ **Expense Management**
- Add expenses with categories
- 8 expense categories (Food, Shopping, Travel, etc.)
- Multiple payment methods
- Notes & filtering

✅ **Budget Management**
- Set monthly budget
- Daily spending limits
- Warning threshold alerts
- Category-wise breakdown

✅ **Analytics**
- Total income vs expenses
- Savings rate calculation
- Top spending category
- Average monthly trends

✅ **Smart Warnings**
- Daily limit exceeded alerts
- Monthly budget warnings
- Discretionary spending analysis
- High transaction alerts

✅ **Utilities**
- Dark/Light theme toggle
- Search & filter transactions
- Export to CSV
- Mobile responsive design

---

## 🔧 Troubleshooting

### **"Cannot connect to backend"**
```bash
# 1. Check if backend is running
# Terminal should show: 🚀 Server running on http://localhost:5000

# 2. Check if MySQL is running
mysql -u root -p
# If error, restart MySQL service

# 3. Check .env configuration
cat backend\.env
# Should show correct DB credentials
```

### **"Database does not exist"**
```bash
# Re-run database setup
mysql -u root -p < database.sql

# Verify
mysql -u root -p
mysql> show databases;
```

### **"Cannot find npm"**
```bash
# Install Node.js from https://nodejs.org/
# Then restart your terminal
npm --version
```

### **CORS Error in Console**
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:** Make sure backend is running on port 5000

### **Frontend loads but no data appears**
1. Check browser console (F12)
2. Check backend server logs
3. Verify MySQL is running
4. Restart both backend and browser

---

## 🔐 Database Credentials

**Default Setup (from .env):**
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=       (empty/no password)
DB_NAME=rupaiya_db
DB_PORT=3306
```

**If you have a different MySQL setup**, edit `backend/.env`:
```bash
# Example with password
DB_USER=admin
DB_PASSWORD=my_password_123
```

---

## 📊 API Endpoints

### **Users**
- `GET /api/users/current` - Get current user
- `GET /api/users` - Get all users

### **Expenses**
- `GET /api/expenses?user_id=1` - Get user expenses
- `POST /api/expenses` - Add expense
- `DELETE /api/expenses/{id}` - Delete expense
- `PUT /api/expenses/{id}` - Update expense

### **Income**
- `GET /api/income?user_id=1` - Get user income
- `POST /api/income` - Add income
- `DELETE /api/income/{id}` - Delete income

### **Budget**
- `GET /api/budgets/{user_id}` - Get budget
- `PUT /api/budgets/{user_id}` - Update budget

### **Stats**
- `GET /api/stats/{user_id}` - Get dashboard statistics

---

## 🛠️ Development

### **Add Sample Data**
```bash
# Backend automatically seeds on startup if user exists
# To add more sample data, edit backend/server.js
```

### **Modify Port**
```bash
# Edit backend/.env
SERVER_PORT=3000

# Then restart npm start
```

### **Enable Logging**
Add to `backend/server.js`:
```javascript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

---

## 📝 Common Tasks

### **Reset All Data**
```bash
# 1. Delete all records
mysql -u root -p
mysql> USE rupaiya_db;
mysql> DELETE FROM expenses;
mysql> DELETE FROM income;
mysql> DELETE FROM budgets;
mysql> EXIT;

# 2. Restart backend to reseed
npm start
```

### **Add New User**
```bash
mysql -u root -p
mysql> USE rupaiya_db;
mysql> INSERT INTO users (name, email, password) 
       VALUES ('Jane Doe', 'jane@example.com', 'hashedpassword');
mysql> EXIT;
```

### **Backup Database**
```bash
mysqldump -u root -p rupaiya_db > backup.sql
```

### **Restore from Backup**
```bash
mysql -u root -p rupaiya_db < backup.sql
```

---

## 📚 Stack Used

**Frontend:**
- HTML5, CSS3
- Vanilla JavaScript (ES6+)
- Chart.js for visualizations
- Google Fonts (Syne, DM Sans)

**Backend:**
- Node.js + Express.js
- MySQL (with mysql2 driver)
- bcryptjs (password hashing)
- CORS enabled
- dotenv for configuration

**Database:**
- MySQL 8.0+
- InnoDB with foreign keys
- Proper indexing for performance
- Constraints for data integrity

---

## 🎯 Next Steps

1. ✅ Get it running (follow Quick Start above)
2. 📱 Test all features (add income/expenses)
3. 🔒 Add authentication (modify backend/server.js)
4. ☁️ Deploy to cloud (AWS, Heroku, etc.)
5. 📈 Add more analytics (integrate ML for predictions)

---

## 📞 Support

**If you encounter issues:**
1. Check this README's Troubleshooting section
2. Open browser console (F12) for errors
3. Check backend terminal for logs
4. Verify MySQL is running: `mysql -u root -p`

---

**Made with ❤️ | Rupaiya v1.0 | May 2026**
