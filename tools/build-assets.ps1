$ErrorActionPreference = 'Stop'
$blenderPath = 'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe'
if (!(Test-Path $blenderPath)) { $blenderPath = (Get-Command blender -ErrorAction Stop).Source }
& $blenderPath --background --python tools/create_assets.py
if ($LASTEXITCODE -ne 0) { throw 'Blender asset build failed.' }
