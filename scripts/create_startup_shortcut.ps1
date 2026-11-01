$scriptPath = Join-Path $PSScriptRoot "start_backend_silent.vbs"
$startupDir = [System.IO.Path]::Combine($env:APPDATA, "Microsoft\Windows\Start Menu\Programs\Startup")
$shortcutPath = Join-Path $startupDir "RetailInventoryBackend.lnk"
$projectRoot = Split-Path $PSScriptRoot -Parent

$wsh = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"$scriptPath`""
$shortcut.WorkingDirectory = $projectRoot
$shortcut.Description = "Retail Inventory System Background Backend Service"
$shortcut.Save()

Write-Output "Shortcut successfully created at: $shortcutPath"
