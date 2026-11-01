Option Explicit
Dim WshShell, fso, scriptDir, batPath

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get directory of this script (scripts\)
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
batPath = scriptDir & "\run_backend_service.bat"

' Check if backend is already listening on port 5000
Dim http, isRunning
isRunning = False

On Error Resume Next
Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
http.Open "GET", "http://127.0.0.1:5000/api/health", False
http.setTimeouts 800, 800, 800, 800
http.Send
If Err.Number = 0 Then
    If http.Status = 200 Then
        isRunning = True
    End If
End If
On Error GoTo 0

' Only start if not already running
If Not isRunning Then
    ' Window style 0 = hidden (no console window appears)
    WshShell.Run """" & batPath & """", 0, False
End If
