@echo off
REM Setup MySQL Database
REM Run this FIRST to create the database and tables

echo.
echo ╔════════════════════════════════════════╗
echo ║  RUPAIYA - Database Setup              ║
echo ║  Creating MySQL Database...            ║
echo ╚════════════════════════════════════════╝
echo.

mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: MySQL is not installed or not in PATH!
    echo.
    echo Please install MySQL from: https://dev.mysql.com/downloads/mysql/
    echo.
    pause
    exit /b 1
)

echo.
echo Enter MySQL Root Password (press Enter if no password):
set /p MYSQL_PASS="Password: "

if "%MYSQL_PASS%"=="" (
    echo Running: mysql -u root < database.sql
    mysql -u root < database.sql
) else (
    echo Running: mysql -u root -p%MYSQL_PASS% < database.sql
    mysql -u root -p%MYSQL_PASS% < database.sql
)

if %errorlevel% == 0 (
    echo.
    echo ✅ Database setup completed successfully!
    echo.
    echo Next steps:
    echo 1. Run: 1-START-BACKEND.bat
    echo 2. Wait for "🚀 Server running on http://localhost:5000"
    echo 3. Run: 2-START-FRONTEND.bat (in a new terminal)
    echo 4. Open: http://localhost:8000/p.html
    echo.
) else (
    echo.
    echo ❌ Database setup failed!
    echo.
    echo Troubleshooting:
    echo - Make sure MySQL is running
    echo - Check your password is correct
    echo - Try running as Administrator
    echo.
)

pause
