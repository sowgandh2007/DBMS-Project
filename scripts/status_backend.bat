@echo off
setlocal
echo ===================================================
echo Checking Retail Inventory Backend Service Status...
echo ===================================================
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "try { $res = Invoke-RestMethod -Uri 'http://127.0.0.1:5000/api/health' -TimeoutSec 2; Write-Host 'STATUS: ONLINE (Port 5000)' -ForegroundColor Green; Write-Host ('DATABASE: ' + $res.database.message) -ForegroundColor Cyan } catch { Write-Host 'STATUS: OFFLINE (Backend is not currently running on port 5000)' -ForegroundColor Red }"
echo.
pause
