@echo off
setlocal
echo ===================================================
echo Stopping Retail Inventory Backend Service (Port 5000)
echo ===================================================
set FOUND=0
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    echo Stopping process with PID: %%a...
    taskkill /F /PID %%a >nul 2>&1
    set FOUND=1
)
if "%FOUND%"=="1" (
    echo Backend process has been stopped.
) else (
    echo No backend process was running on port 5000.
)
echo.
