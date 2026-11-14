// 앱 아이콘을 그려 build/icon.png(512px)와 안드로이드용 크기들을 만듭니다. 실행: electron tools/make-icon.cjs
const {app,BrowserWindow}=require('electron');
const fs=require('fs'),path=require('path');
// 양지(볕이 드는 자리)라는 이름에서 가져온 해 모양 말풍선. 다른 메신저의 로고와 닮지 않게 직접 그렸습니다.
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#f08a24"/>
<path d="M256 118c-88 0-158 56-158 126 0 44 28 83 71 105l-14 62 70-44c10 2 20 3 31 3 88 0 158-56 158-126S344 118 256 118z" fill="#fff"/>
<g stroke="#f08a24" stroke-width="20" stroke-linecap="round"><circle cx="256" cy="244" r="38" fill="none"/><path d="M256 160v22M256 306v22M172 244h22M318 244h22M197 185l15 15M300 288l15 15M315 185l-15 15M212 288l-15 15"/></g></svg>`;
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
