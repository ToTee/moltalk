# Dev check: drag the right border of the given process's main window with the mouse and capture the whole screen meanwhile.
# Usage: powershell -File tools/drag-resize.ps1 <output dir> <process id>
param([string]$Dir,[int]$ProcId)
Add-Type -AssemblyName System.Windows.Forms, System.Drawing
Add-Type @"
using System;using System.Runtime.InteropServices;
public class YjWin{
 [StructLayout(LayoutKind.Sequential)]public struct RECT{public int L,T,R,B;}
 [DllImport("user32.dll",CharSet=CharSet.Unicode)]public static extern IntPtr FindWindow(string c,string t);
 [DllImport("user32.dll")]public static extern bool GetWindowRect(IntPtr h,out RECT r);
 [DllImport("user32.dll")]public static extern bool SetCursorPos(int x,int y);
 [DllImport("user32.dll")]public static extern bool SetForegroundWindow(IntPtr h);
 [DllImport("user32.dll")]public static extern void mouse_event(uint f,uint x,uint y,uint d,UIntPtr e);
 [DllImport("user32.dll")]public static extern bool SetProcessDPIAware();
 [DllImport("user32.dll")]public static extern bool SetWindowPos(IntPtr h,IntPtr after,int x,int y,int w,int hgt,uint flags);
}
"@
[YjWin]::SetProcessDPIAware() | Out-Null
$h=(Get-Process -Id $ProcId).MainWindowHandle; if($h -eq [IntPtr]::Zero){'no window';exit 1}
$r=New-Object YjWin+RECT; [YjWin]::GetWindowRect($h,[ref]$r) | Out-Null
"window $($r.L),$($r.T) - $($r.R),$($r.B)"
$b=[System.Windows.Forms.SystemInformation]::VirtualScreen
function Shot($name){$bmp=New-Object System.Drawing.Bitmap $b.Width,$b.Height;$g=[System.Drawing.Graphics]::FromImage($bmp);$g.CopyFromScreen($b.Left,$b.Top,0,0,$bmp.Size);$g.Dispose();$bmp.Save("$Dir\$name");$bmp.Dispose()}
[YjWin]::SetWindowPos($h,[IntPtr](-1),0,0,0,0,3) | Out-Null   # keep on top so the drag cannot land on another app
[YjWin]::SetForegroundWindow($h) | Out-Null; Start-Sleep -Milliseconds 300
$x=$r.R-9; $y=$r.B-9   # bottom-right corner, inside the resize border
[YjWin]::SetCursorPos($x,$y) | Out-Null; Start-Sleep -Milliseconds 200
[YjWin]::mouse_event(2,0,0,0,[UIntPtr]::Zero)   # left button down
Start-Sleep -Milliseconds 150
for($i=1;$i -le 12;$i++){[YjWin]::mouse_event(1,14,10,0,[UIntPtr]::Zero); Start-Sleep -Milliseconds 60; if($i -eq 4){Shot 'drag-a.png'}; if($i -eq 10){Shot 'drag-b.png'}}
Start-Sleep -Milliseconds 300; Shot 'drag-c.png'
[YjWin]::mouse_event(4,0,0,0,[UIntPtr]::Zero)   # left button up
Start-Sleep -Milliseconds 500; Shot 'drag-d.png'
[YjWin]::GetWindowRect($h,[ref]$r) | Out-Null; "after  $($r.L),$($r.T) - $($r.R),$($r.B)"
