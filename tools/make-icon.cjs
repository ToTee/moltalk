// 앱 아이콘을 그려 build/icon.png(512px)와 안드로이드용 크기들을 만듭니다. 실행: electron tools/make-icon.cjs
const {app,BrowserWindow}=require('electron');
const fs=require('fs'),path=require('path');
// 노란 바탕에 짙은 말풍선, 그 안에 DALK 글자. 직접 그린 그림입니다.
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="82" fill="#fee500"/>
<ellipse cx="256" cy="238" rx="198" ry="140" fill="#3a1d1d"/>
<path d="M150 346 126 434c-2 8 6 12 12 8l100-70z" fill="#3a1d1d"/>
<text x="256" y="280" text-anchor="middle" textLength="270" lengthAdjust="spacingAndGlyphs" font-family="'Arial Black','Segoe UI Black','Malgun Gothic',sans-serif" font-weight="900" font-size="118" fill="#fee500">DALK</text></svg>`;
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
