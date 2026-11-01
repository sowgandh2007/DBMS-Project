$startupDir = [System.IO.Path]::Combine($env:APPDATA, "Microsoft\Windows\Start Menu\Programs\Startup")
$shortcutPath = Join-Path $startupDir "RetailInventoryBackend.lnk"
if (Test-Path $shortcutPath) {
    Remove-Item -Force $shortcutPath
    Write-Output "Removed startup shortcut from Windows Startup folder."
} else {
    Write-Output "Startup shortcut not found (already removed)."
}
