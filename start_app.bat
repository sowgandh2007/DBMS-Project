@echo off
title Launch Retail Inventory System
color 0a
echo =================================================================
echo   Launching Retail Inventory ^& Rack Management System
echo =================================================================
echo.
echo [1/2] Ensuring Flask backend is running in background...
wscript //Nologo "%~dp0scripts\start_backend_silent.vbs"

echo [2/2] Starting frontend web application...
echo Opening http://localhost:5173 in your default browser...
start "" "http://localhost:5173"
call npm run dev
