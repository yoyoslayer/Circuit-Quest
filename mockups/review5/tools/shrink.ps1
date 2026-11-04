# Shrinks review screenshots to JPG for git: powershell -File mockups/review5/tools/shrink.ps1 [-Limit N] [-Width 1280] [-Quality 75]
# Reads shots-full/*.png (originals, not committed) and writes shots/*.jpg.
param([int]$Limit=0,[int]$Width=1280,[int]$Quality=75)
Add-Type -AssemblyName System.Drawing
$root=Split-Path -Parent $PSScriptRoot
$src=Join-Path $root 'shots-full';$dst=Join-Path $root 'shots'
New-Item -ItemType Directory -Force $dst | Out-Null
$codec=[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()|Where-Object{$_.MimeType -eq 'image/jpeg'}
$ep=New-Object System.Drawing.Imaging.EncoderParameters 1
$ep.Param[0]=New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality,[long]$Quality)
$files=Get-ChildItem $src -Filter *.png;if($Limit){$files=$files|Select-Object -First $Limit}
$n=0
foreach($f in $files){
  $out=Join-Path $dst ($f.BaseName+'.jpg');if(Test-Path $out){continue}
  $img=[System.Drawing.Image]::FromFile($f.FullName)
  try{
    $w=[Math]::Min($Width,$img.Width);$h=[int][Math]::Round($img.Height*$w/$img.Width)
    $bmp=New-Object System.Drawing.Bitmap $w,$h
    $g=[System.Drawing.Graphics]::FromImage($bmp);$g.InterpolationMode='HighQualityBicubic';$g.Clear([System.Drawing.Color]::White);$g.DrawImage($img,0,0,$w,$h);$g.Dispose()
    $bmp.Save($out,$codec,$ep);$bmp.Dispose()
  }finally{$img.Dispose()}
  $n++
}
"converted $n"
