# Restarts the fix-models dev server on 4206. vite.config ignores **/.claude/** for watching, so a
# server run inside an agent worktree never sees edits: restart it after changing src/.
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match 'vite.*4206' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
Start-Sleep 1
$root=(Resolve-Path "$PSScriptRoot\..\..\..\..").Path
Start-Process -WindowStyle Hidden -WorkingDirectory $root -FilePath npx.cmd -ArgumentList 'vite','--port','4206','--strictPort' -RedirectStandardOutput "$env:TEMP\vite4206.log" -RedirectStandardError "$env:TEMP\vite4206.err"
Start-Sleep 11
