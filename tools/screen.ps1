# 확인용: 모니터 전체를 찍어 파일로 남깁니다. 사용: powershell -File tools/screen.ps1 <저장할.png>
param([string]$Out)
Add-Type -AssemblyName System.Windows.Forms, System.Drawing
$b=[System.Windows.Forms.SystemInformation]::VirtualScreen
$bmp=New-Object System.Drawing.Bitmap $b.Width,$b.Height
$g=[System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($b.Left,$b.Top,0,0,$bmp.Size)
$bmp.Save($Out,[System.Drawing.Imaging.ImageFormat]::Png)
"$($b.Width)x$($b.Height)"
