# Dev check: launch the packaged EXE with the given switches, drag-resize it, and report whether the content
# was painted while dragging (the left rail is gray 236; an unpainted window is white 255).
# Usage: powershell -File tools/drag-try.ps1 <exe> [switches...]
param([string]$Exe,[string[]]$Switches=@())
Set-Location (Split-Path $PSScriptRoot -Parent)
Add-Type -AssemblyName System.Drawing
$title=[string][char]0xC591+[char]0xC9C0+[char]0xD1A1
$before=@(Get-Process | Where-Object {$_.MainWindowTitle -eq $title} | ForEach-Object Id)
if($Switches.Count){Start-Process -FilePath $Exe -ArgumentList $Switches}else{Start-Process -FilePath $Exe}
$new=$null; for($i=0;$i -lt 40 -and -not $new;$i++){Start-Sleep -Milliseconds 500; $new=Get-Process | Where-Object {$_.MainWindowTitle -eq $title -and $before -notcontains $_.Id} | Select-Object -First 1}
if(-not $new){'no new window'; exit 1}
Start-Sleep -Milliseconds 3500
$out=powershell -NoProfile -ExecutionPolicy Bypass -File tools\drag-resize.ps1 "$PWD\tmp" $new.Id
$m=[regex]::Match(($out -join ' '),'window (\d+),(\d+)'); $x=[int]$m.Groups[1].Value+55; $y=[int]$m.Groups[2].Value+330
$res=foreach($n in 'a','b','c','d'){$bmp=New-Object System.Drawing.Bitmap "$PWD\tmp\drag-$n.png";$c=$bmp.GetPixel($x,$y);$bmp.Dispose();"$n=$($c.R)"}
"[$($Switches -join ' ')] rail pixel: $($res -join ' ')  | $($out -join ' | ')"
Start-Sleep -Milliseconds 300; Stop-Process -Id $new.Id
