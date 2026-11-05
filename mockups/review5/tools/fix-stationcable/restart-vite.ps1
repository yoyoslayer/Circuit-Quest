# Restarts this worktree's dev server on 4214 (vite's watcher ignores edits inside .claude/ worktrees).
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match 'vite' -and $_.CommandLine -match '4214' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
$root = Resolve-Path "$PSScriptRoot\..\..\..\.."
Start-Process -WindowStyle Hidden -FilePath "cmd.exe" -ArgumentList "/c npx.cmd vite --port 4214 --strictPort > `"$env:TEMP\vite-4214.log`" 2>&1" -WorkingDirectory $root
for ($i = 0; $i -lt 60; $i++) { Start-Sleep 1; try { $r = Invoke-WebRequest -UseBasicParsing http://localhost:4214/ -TimeoutSec 2; if ($r.StatusCode -eq 200) { 'vite up'; break } } catch {} }
