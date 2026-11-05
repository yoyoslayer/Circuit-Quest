# Restarts this worktree's dev server on port 4205 (its file watcher misses some edits on Windows,
# so each census round starts a fresh server). Run from the worktree root.
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match "vite.*--port 4205" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -Confirm:$false }
Start-Process -WindowStyle Hidden -FilePath npx.cmd -ArgumentList 'vite','--port','4205','--strictPort'
for($i=0;$i -lt 60;$i++){ Start-Sleep -Milliseconds 500; try { $null=Invoke-WebRequest -UseBasicParsing http://localhost:4205/ -TimeoutSec 2; 'ready'; break } catch {} }
