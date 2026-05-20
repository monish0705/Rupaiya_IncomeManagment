# ⚡ RUPAIYA - Quick Start Guide

## 🎯 Start in 3 Steps

### **Step 1: Setup Database (First time only)**
```bash
Double-click: 0-SETUP-DATABASE.bat
```
- Creates MySQL database
- Creates tables
- Loads sample data

### **Step 2: Start Backend Server**
```bash
Double-click: 1-START-BACKEND.bat
```
- Keep this window open!
- Should show: 🚀 Server running on http://localhost:5000

### **Step 3: Start Frontend**
```bash
# NEW terminal window, then:
Double-click: 2-START-FRONTEND.bat

# Then open: http://localhost:8000/p.html
```

---

## 📊 What You Can Do

✅ **Add Income** → Track your earnings
✅ **Add Expenses** → Log spending by category
✅ **View Dashboard** → See balance, trends, warnings
✅ **Set Budget** → Monthly limits and daily caps
✅ **View Analytics** → Charts and statistics
✅ **Search History** → Filter transactions
✅ **Export CSV** → Download data

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't find MySQL | Install from mysql.com, add to PATH |
| Backend won't start | Verify MySQL running: `mysql -u root -p` |
| Frontend blank | Check backend is on http://localhost:5000 |
| Port 8000 in use | Use different port: `python -m http.server 9000` |
| Data not saving | Check backend console for errors |

---

## 📁 File Structure

```
d:\friends\
├── 0-SETUP-DATABASE.bat    ← Run this FIRST
├── 1-START-BACKEND.bat     ← Then this
├── 2-START-FRONTEND.bat    ← Then this
├── p.html                  ← Frontend (open at localhost:8000)
├── script.js               ← API-connected JS
├── database.sql            ← DB schema
├── README.md               ← Full documentation
└── backend/
    ├── server.js           ← Express server
    ├── .env                ← Configuration
    └── package.json        ← Dependencies
```

---

## 🔗 URLs

- **Frontend**: http://localhost:8000/p.html
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

---

## 💡 Pro Tips

**Add Sample Data Quickly:**
- Dashboard auto-loads with sample income/expenses

**Test Warnings:**
- Add expense > ₹2000 to trigger daily limit warning
- Add multiple shopping expenses to trigger discretionary spending warning

**Dark Mode:**
- Click sun/moon icon in sidebar (top right)

**Export Data:**
- Go to History → Download button at top

**Reset Everything:**
- Delete backend/node_modules
- Delete database
- Run 0-SETUP-DATABASE.bat again

---

**Questions?** See full README.md
