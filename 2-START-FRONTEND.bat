@echo off
REM Start Frontend with HTTP Server (Python)
REM Run this AFTER backend is started

echo.
echo ╔════════════════════════════════════════╗
echo ║  RUPAIYA - Frontend Server Startup     ║
echo ║  Start backend first (1-START-BACKEND) ║
echo ╚════════════════════════════════════════╝
echo.

REM Try Python first
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Starting with Python HTTP Server...
    cd /d "%~dp0"
    python -m http.server 8000
    goto :end
)

REM Try Node.js http-server
npx --version >nul 2>&1
if %errorlevel% == 0 (
    echo Starting with Node.js HTTP Server...
    cd /d "%~dp0"
    npx http-server
    goto :end
)

echo.
echo ERROR: Neither Python nor Node.js found!
echo.
echo OPTIONS:
echo 1. Install Python from https://www.python.org/
echo 2. Install Node.js from https://nodejs.org/
echo 3. Or manually open p.html in browser
echo.

pause

:end
