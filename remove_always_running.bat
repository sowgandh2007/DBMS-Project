@echo off
title Remove Always-Running Backend
color 0c
echo =================================================================
echo   Removing Always-Running Backend Service
echo =================================================================
echo.
echo [1/2] Removing shortcut from Windows Startup folder...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\remove_startup_shortcut.ps1"

echo.
echo [2/2] Stopping active background backend process...
call "%~dp0scripts\stop_backend.bat"

echo.
echo =================================================================
echo   Backend autostart removed.
echo =================================================================
echo.
pause
