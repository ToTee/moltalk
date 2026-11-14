# 확인용: 모니터 전체를 짧은 간격으로 여러 번 찍어, 첫 장과 많이 달라진 장을 찾아 저장합니다.
# 사용: powershell -File tools/screen-series.ps1 <저장 폴더> [장 수] [간격 ms]
param([string]$Dir,[int]$Count=40,[int]$Gap=200)
Add-Type -AssemblyName System.Windows.Forms, System.Drawing
$b=[System.Windows.Forms.SystemInformation]::VirtualScreen
$first=$null;$best=0
for($i=0;$i -lt $Count;$i++){
 $bmp=New-Object System.Drawing.Bitmap $b.Width,$b.Height
 $g=[System.Drawing.Graphics]::FromImage($bmp);$g.CopyFromScreen($b.Left,$b.Top,0,0,$bmp.Size);$g.Dispose()
 $cells=New-Object 'int[]' 576
 for($y=0;$y -lt 18;$y++){for($x=0;$x -lt 32;$x++){$c=$bmp.GetPixel([int](($x+0.5)*$b.Width/32),[int](($y+0.5)*$b.Height/18));$cells[$y*32+$x]=[int](($c.R+$c.G+$c.B)/3)}}
 if($null -eq $first){$first=$cells;$bmp.Save("$Dir\series-first.png")}
 $diff=0;for($k=0;$k -lt 576;$k++){if([math]::Abs($cells[$k]-$first[$k]) -gt 20){$diff++}}
 "$i diff=$diff"
 if($diff -gt $best){$best=$diff;$bmp.Save("$Dir\series-best.png")}
 $bmp.Dispose();Start-Sleep -Milliseconds $Gap
}
