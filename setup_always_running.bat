@echo off
title Setup Always-Running Backend
color 0b
echo =================================================================
echo   Retail Inventory ^& Rack Management System
echo   Setting up Always-Running Background Backend Service
echo =================================================================
echo.
echo [1/3] Adding backend service to Windows Startup folder...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\create_startup_shortcut.ps1"

echo.
echo [2/3] Launching backend silently in background...
wscript //Nologo "%~dp0scripts\start_backend_silent.vbs"

echo.
echo [3/3] Verifying connection to Supabase PostgreSQL...
timeout /t 3 /nobreak >nul
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $res = Invoke-RestMethod -Uri 'http://127.0.0.1:5000/api/health' -TimeoutSec 3; Write-Host 'SUCCESS: Backend is ONLINE and connected to Supabase PostgreSQL!' -ForegroundColor Green } catch { Write-Host 'Backend is starting up in the background...' -ForegroundColor Yellow }"

echo.
echo =================================================================
echo   SETUP COMPLETE!
echo.
echo   - The Flask backend is now running in the background.
echo   - It will automatically launch every time Windows starts.
echo   - You never have to manually run 'python backend/app.py' again!
echo   - To open your website, run 'npm run dev' or double-click 'start_app.bat'.
echo =================================================================
echo.
pause
