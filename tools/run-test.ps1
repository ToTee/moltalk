# 확인용 실행: 화면에 창을 띄우지 않고 스크립트를 돌린 뒤 결과와 화면 사진을 tmp/에 남깁니다.
# 반드시 따로 둔 저장 폴더(tmp\profile)로 실행합니다. 설치된 몰톡과 같은 저장 폴더를 동시에 열면 설치된 앱의 설정이 지워집니다(실제로 한 번 지워졌습니다).
# 사용: powershell -File tools/run-test.ps1 <스크립트.js> [첫 대기 ms] [끝 대기 ms] [창 너비]
param([string]$Script,[int]$Wait=5000,[int]$Wait2=1000,[int]$Width=440)
Set-Location (Split-Path $PSScriptRoot -Parent)
node tools/build.mjs | Out-Null
$env:YJ_SHOT="$PWD\tmp\shot.png"; $env:YJ_WAIT="$Wait"; $env:YJ_WAIT2="$Wait2"; $env:YJ_W="$Width"
$env:YJ_JS = if($Script){"$PWD\tools\$Script"}else{""}
Start-Process -FilePath .\node_modules\electron\dist\electron.exe -ArgumentList ".","--user-data-dir=$PWD\tmp\profile" -RedirectStandardOutput tmp\out.txt -RedirectStandardError tmp\err.txt -Wait -WindowStyle Hidden
Get-Content tmp\out.txt -Encoding utf8
