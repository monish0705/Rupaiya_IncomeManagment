@echo off
REM Start Backend Server - Run this first!
echo.
echo ╔════════════════════════════════════════╗
echo ║  RUPAIYA - Backend Server Startup      ║
echo ║  Keep this window open!                ║
echo ╚════════════════════════════════════════╝
echo.

cd backend

REM Check if node_modules exists
if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
)

echo.
echo Starting backend server...
echo.

call npm start

pause
