// 조사용: 이 앱의 내장 브라우저가 일반 크롬과 어디가 다르게 보이는지 값을 읽습니다(빈 화면에서 읽기만 함, 디시 요청 없음).
// P_NORMAL=1 이면 일반 브라우저에 가깝게 맞춘 설정(플러그인 켜기, 권한을 물어보는 상태로 두기)을 적용해 비교합니다.
const {app,BrowserWindow,session}=require('electron');
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/'+process.versions.chrome.split('.')[0]+'.0.0.0 Safari/537.36';
setTimeout(()=>{console.log('TIMEOUT');app.exit(0)},40000);
app.whenReady().then(async()=>{
 const N=!!process.env.P_NORMAL;
 if(N){session.defaultSession.setPermissionCheckHandler(()=>false);session.defaultSession.setPermissionRequestHandler((wc,p,cb)=>cb(false))}
 const w=new BrowserWindow({width:1100,height:800,show:false,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,plugins:N}});
 w.webContents.setUserAgent(UA);
 await w.loadURL('https://example.com/').catch(()=>{});
 const out=await w.webContents.executeJavaScript(`(async()=>{
  const perm=async n=>{try{return (await navigator.permissions.query({name:n})).state}catch(e){return 'err'}};
  return {plugins:navigator.plugins.length,mimeTypes:navigator.mimeTypes.length,pdf:navigator.pdfViewerEnabled,webdriver:navigator.webdriver,langs:navigator.languages,hc:navigator.hardwareConcurrency,mem:navigator.deviceMemory,
   chrome:window.chrome?Object.keys(window.chrome):null,notif:typeof Notification!=='undefined'?Notification.permission:'none',pNotif:await perm('notifications'),pGeo:await perm('geolocation'),pCam:await perm('camera'),pClip:await perm('clipboard-read'),
   brands:navigator.userAgentData?navigator.userAgentData.brands.map(b=>b.brand+' '+b.version):null,outer:[outerWidth,outerHeight],inner:[innerWidth,innerHeight],screen:[screen.width,screen.height,screen.availHeight],dpr:devicePixelRatio,
   voices:speechSynthesis.getVoices().length,conn:navigator.connection?navigator.connection.effectiveType:null,focus:document.hasFocus(),vis:document.visibilityState,cookie:navigator.cookieEnabled,
   share:typeof navigator.share,bt:typeof navigator.bluetooth,usb:typeof navigator.usb,cred:typeof navigator.credentials,sw:typeof navigator.serviceWorker,storage:typeof navigator.storage,managed:typeof navigator.managed}})()`,true).catch(e=>({error:e.message}));
 console.log(JSON.stringify({normal:N,out}));app.quit();
});
