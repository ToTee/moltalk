// 앱 아이콘을 그려 build/icon.png(512px)와 안드로이드용 크기들을 만듭니다. 실행: electron tools/make-icon.cjs
const {app,BrowserWindow}=require('electron');
const fs=require('fs'),path=require('path');
// 노란 바탕에 짙은 말풍선, 그 안에 DALK 글자. 직접 그린 그림입니다.
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#fee500"/>
<path d="M256 102c-103 0-186 62-186 139 0 49 34 92 85 117l-17 66c-2 7 6 12 12 8l79-52c9 1 18 2 27 2 103 0 186-63 186-141S359 102 256 102z" fill="#3a1d1d"/>
<text x="256" y="279" text-anchor="middle" font-family="'Arial Black','Segoe UI Black','Malgun Gothic',sans-serif" font-weight="900" font-size="100" letter-spacing="-2" fill="#fee500">DALK</text></svg>`;
app.whenReady().then(async()=>{
 const w=new BrowserWindow({width:512,height:512,show:false,useContentSize:true,frame:false,transparent:true,webPreferences:{offscreen:true}});
 await w.loadURL('data:text/html,'+encodeURIComponent('<body style="margin:0;background:transparent">'+svg+'</body>'));
 await new Promise(r=>setTimeout(r,500));
 const img=await w.webContents.capturePage();
 const root=path.join(__dirname,'..');
 fs.mkdirSync(path.join(root,'build'),{recursive:true});
 fs.writeFileSync(path.join(root,'build','icon.png'),img.resize({width:512,height:512}).toPNG());
 for(const [dir,size] of [['mdpi',48],['hdpi',72],['xhdpi',96],['xxhdpi',144],['xxxhdpi',192]]){
  const d=path.join(root,'android','res','mipmap-'+dir);fs.mkdirSync(d,{recursive:true});
  fs.writeFileSync(path.join(d,'ic_launcher.png'),img.resize({width:size,height:size}).toPNG());
 }
 console.log('아이콘 생성 완료');app.quit();
});
