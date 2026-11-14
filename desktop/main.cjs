// 양지톡 윈도우용 껍데기. 화면(app/)을 띄우고, 디시로 가는 요청만 대신 보내 줍니다.
const {app,BrowserWindow,Menu,Tray,desktopCapturer,ipcMain,net,screen,session,shell}=require('electron');
const path=require('path');
const fs=require('fs');
/* 브라우저 버전은 실제 엔진 버전을 그대로 씁니다. 꾸며 낸 옛 버전을 쓰면 '사람인지 확인'이 오래된 브라우저로 보고 실패할 수 있습니다. */
const CHROME=process.versions.chrome.split('.')[0];
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/'+CHROME+'.0.0.0 Safari/537.36';
const dcHost=h=>/(^|\.)dcinside\.(com|co\.kr)$/.test(h);
const dcUrl=u=>{try{const x=new URL(u);return x.protocol==='https:'&&!x.username&&!x.password&&dcHost(x.hostname)?x:null}catch{return null}};
let win=null;

/* ---------- 진단 기록 ----------
   창 크기를 끌 때 화면이 회색으로 덮이는 문제를 조사하기 위한 기록입니다. 이 컴퓨터의 저장 폴더(diag/)에만 남고 어디로도 보내지 않습니다.
   창이 생기고 보이고 크기가 바뀌는 순간, 그래픽 처리 상태, 화면 응답 시간을 적고, 크기를 끌기 시작하면 모니터 화면을 몇 장 찍어 둡니다. */
const diagDir=()=>path.join(app.getPath('userData'),'diag');
function diag(...a){try{fs.mkdirSync(diagDir(),{recursive:true});fs.appendFileSync(path.join(diagDir(),'diagnostic.log'),new Date().toISOString()+' '+a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ')+'\n')}catch{}}
const allWindows=()=>BrowserWindow.getAllWindows().map(w=>({id:w.id,title:w.getTitle(),visible:w.isVisible(),bounds:w.getBounds()}));
let shots=0,shotBusy=false;
async function diagShot(tag){
 if(shotBusy||shots>=12)return;shotBusy=true;shots++;
 try{const d=screen.getPrimaryDisplay(),src=await desktopCapturer.getSources({types:['screen'],thumbnailSize:{width:Math.round(d.size.width/2),height:Math.round(d.size.height/2)}});
  const name='shot-'+Date.now()+'-'+tag+'.png';if(src[0]){fs.writeFileSync(path.join(diagDir(),name),src[0].thumbnail.toPNG());diag('shot',name)}}catch(e){diag('shot-error',e.message)}
 shotBusy=false;
}
function diagSetup(){
 try{const f=path.join(diagDir(),'diagnostic.log');if(fs.existsSync(f)&&fs.statSync(f).size>1500000)fs.rmSync(f);
  for(const n of fs.existsSync(diagDir())?fs.readdirSync(diagDir()):[])if(/^shot-/.test(n))fs.rmSync(path.join(diagDir(),n))}catch{}
 diag('start',{version:app.getVersion(),electron:process.versions.electron,chrome:process.versions.chrome,exe:process.execPath,displays:screen.getAllDisplays().map(d=>({bounds:d.bounds,workArea:d.workArea,scale:d.scaleFactor})),gpu:app.getGPUFeatureStatus()});
 setTimeout(()=>diag('gpu-status-after-5s',app.getGPUFeatureStatus()),5000);
 app.on('child-process-gone',(e,d)=>diag('child-process-gone',d));
 app.on('render-process-gone',(e,wc,d)=>diag('render-process-gone',d));
 app.on('browser-window-created',(e,w)=>{
  diag('window-created',{id:w.id});
  for(const ev of ['show','hide','closed','maximize','unmaximize','minimize','restore','focus','blur','unresponsive','responsive','moved','resized'])w.on(ev,()=>diag('window-'+ev,{id:w.id,bounds:w.isDestroyed()?null:w.getBounds()}));
  let last=0,ping=0;
  w.on('will-resize',(e2,b,d)=>{const now=Date.now(),fresh=now-last>1500;last=now;diag('will-resize',{id:w.id,to:b,edge:d&&d.edge,from:w.getBounds()});
   if(fresh){diag('resize-begin',{windows:allWindows(),cursor:screen.getCursorScreenPoint()});diagShot('begin');setTimeout(()=>diagShot('400ms'),400);setTimeout(()=>diagShot('1200ms'),1200)}
   /* 화면(렌더러)이 제때 응답하는지 잽니다. */
   if(now-ping>300){ping=now;const t=Date.now();w.webContents.executeJavaScript('1').then(()=>diag('renderer-reply-ms',Date.now()-t)).catch(()=>{})}});
  w.on('resize',()=>diag('resize',{id:w.id,bounds:w.getBounds(),content:w.getContentBounds()}));
 });
}

/* 숨겨서 진행하는 공식 화면 작업(댓글 등록 등)의 창 번호. 이 창들은 디시 밖의 광고·통계 요청을 받지 않아 빨리 열립니다. */
const hiddenJobs=new Set(),blockedSeen=new Set();
function setupSession(){
 const ses=session.defaultSession;
 ses.setUserAgent(UA);
 ses.webRequest.onBeforeRequest((d,done)=>{
  if(!hiddenJobs.has(d.webContentsId))return done({});
  let host='',proto='';try{const u=new URL(d.url);host=u.hostname;proto=u.protocol}catch{}
  /* 막는 것은 다른 사이트로 나가는 웹 요청(광고·통계)뿐입니다. 화면 안에서 만든 주소(blob:, data: 등)는 '사람인지 확인' 상자가 쓰므로 그대로 둡니다. */
  if(!/^(https?|wss?):$/.test(proto))return done({});
  const human=host==='challenges.cloudflare.com'||host.endsWith('.cloudflare.com');/* '사람인지 확인' 상자는 그대로 둡니다. */
  const cancel=!human&&!dcUrl(d.url);
  if(cancel&&!blockedSeen.has(host)){blockedSeen.add(host);diag('blocked-host',host)}/* 어떤 사이트를 막았는지 한 번씩만 적어 둡니다(원인 조사용). */
  done({cancel});
 });
 // 디시 이미지 서버는 Referer가 없으면 거절합니다. 화면에서 보낸 요청에 Referer를 채웁니다.
 ses.webRequest.onBeforeSendHeaders({urls:['https://*.dcinside.com/*','https://*.dcinside.co.kr/*']},(details,done)=>{
  const h=details.requestHeaders,custom=Object.keys(h).find(k=>k.toLowerCase()==='x-yj-referer');
  if(custom){h.Referer=h[custom];delete h[custom]}
  else if(!Object.keys(h).some(k=>k.toLowerCase()==='referer'))h.Referer='https://gall.dcinside.com/';
  done({requestHeaders:h});
 });
 ses.setPermissionRequestHandler((wc,permission,done)=>done(false));
}

ipcMain.handle('http',async(event,url,opt={})=>{
 const target=dcUrl(url);if(!target)throw Error('디시인사이드 주소만 요청할 수 있습니다.');
 const method=opt.method==='POST'?'POST':'GET',headers={};
 for(const [k,v] of Object.entries(opt.headers||{})){if(typeof v!=='string')continue;if(k.toLowerCase()==='referer'){if(dcUrl(v))headers['X-YJ-Referer']=v}else if(/^(content-type|x-requested-with|accept)$/i.test(k))headers[k]=v}
 // 다른 주소로 넘기는 응답은 직접 확인한 뒤 따라갑니다. 디시 주소가 아니면 멈춥니다.
 return new Promise((resolve,reject)=>{
  const req=net.request({url:target.href,method,session:session.defaultSession,useSessionCookies:true,redirect:'manual'});let hops=0;
  for(const [k,v] of Object.entries(headers))req.setHeader(k,v);
  req.on('redirect',(status,m,to)=>{if(++hops>5||!dcUrl(to)){req.abort();reject(Error('디시인사이드가 아닌 주소로 넘어가 요청을 멈췄습니다.'))}else req.followRedirect()});
  req.on('response',res=>{const parts=[];res.on('data',c=>parts.push(c));res.on('end',()=>resolve({status:res.statusCode,text:Buffer.concat(parts).toString('utf8')}));res.on('error',reject)});
  req.on('error',reject);
  req.end(method==='POST'?String(opt.body??''):undefined);
 });
});
// 글 속 링크는 기기의 기본 브라우저로 엽니다. 웹 주소(http, https)만 허용합니다.
ipcMain.handle('open',(event,url)=>{try{const x=new URL(url);if(/^https?:$/.test(x.protocol)&&!x.username&&!x.password)shell.openExternal(x.href)}catch{}});

// 쓰기·삭제·로그인은 디시 공식 모바일 화면을 보조 창에서 열어 처리합니다. 로그인 쿠키는 같은 세션을 함께 씁니다.
const MOBILE_UA='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/'+CHROME+'.0.0.0 Mobile Safari/537.36';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function helperWindow(show){
 const w=new BrowserWindow({width:440,height:780,show,parent:win,title:'디시인사이드',autoHideMenuBar:true,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});
 w.webContents.setUserAgent(MOBILE_UA);
 w.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 w.webContents.on('will-navigate',(e,u)=>{if(!dcUrl(u))e.preventDefault()});
 return w;
}
/* 보조 창은 디시 모바일 화면을 엽니다. 브라우저 이름만 휴대폰으로 알리면 나머지 정보(운영체제, 터치 여부, 마우스 입력)는 윈도우 그대로라
   서로 맞지 않고, '사람인지 확인'이 이를 비정상으로 보고 실패합니다(실패 번호 600010). 크롬 개발자 도구의 '기기 모드'와 같은 방법으로
   알리는 정보를 휴대폰으로 일관되게 맞추고, 마우스로 누른 것이 터치로 전달되게 합니다. 확인 상자를 누르는 것은 여전히 사용자입니다. */
async function asPhone(w){
 try{
  await w.loadURL('about:blank');
  const d=w.webContents.debugger,full=process.versions.chrome;d.attach('1.3');
  await d.sendCommand('Emulation.setUserAgentOverride',{userAgent:MOBILE_UA,platform:'Linux armv81',userAgentMetadata:{brands:[{brand:'Chromium',version:CHROME},{brand:'Not?A_Brand',version:'99'}],fullVersionList:[{brand:'Chromium',version:full},{brand:'Not?A_Brand',version:'99.0.0.0'}],platform:'Android',platformVersion:'14.0.0',architecture:'',model:'Pixel 8',mobile:true,bitness:'',wow64:false}});
  await d.sendCommand('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
  await d.sendCommand('Emulation.setEmitTouchEventsForMouse',{enabled:true,configuration:'mobile'});
 }catch(e){diag('phone-mode-fail',e.message)}
}
// 공식 화면을 보이지 않는 창에서 열고 스크립트를 실행해 결과를 돌려줍니다. 화면이 다른 주소로 넘어가면(글 등록 완료 등) 그 주소를 돌려줍니다.
ipcMain.handle('drive',async(event,url,code,opt={})=>{
 if(!dcUrl(url)||typeof code!=='string')throw Error('디시인사이드 주소만 열 수 있습니다.');
 const w=helperWindow(false);let timer;const wcId=w.webContents.id;hiddenJobs.add(wcId);
 try{
  await asPhone(w);
  await w.loadURL(url).catch(()=>{});
  if(!dcUrl(w.webContents.getURL()))return {error:'화면을 열지 못했습니다.'};
  const nav=new Promise(res=>w.webContents.once('did-navigate',(e,u)=>res({navigated:u})));
  const limit=Math.min(Number(opt.timeout)||90000,300000);/* 사람인지 확인(최대 20초)과 등록 응답(최대 20초)을 모두 기다릴 수 있는 시간 */
  const timeout=new Promise(res=>{
   const arm=ms=>{clearTimeout(timer);timer=setTimeout(()=>res({error:'시간이 초과되었습니다.'}),ms)};arm(limit);
   // '사람인지 확인'을 직접 눌러야 하면 공식 화면이 신호를 보냅니다. 그동안 창을 보여 주고 기다리는 시간을 늘립니다.
   w.webContents.on('console-message',(e,level,message)=>{const m=typeof message==='string'?message:e&&e.message;
    /* '사람인지 확인'이 실패하면 클라우드플레어가 실패 번호를 콘솔에 남깁니다. 원인을 찾을 수 있게 진단 기록에 적어 둡니다(글 내용은 적지 않습니다). */
    if(/turnstile|cloudflare/i.test(String(m||'')))diag('human',String(m).slice(0,300));
    if(m==='__YJ_SHOW__'||m==='__YJ_HIDE__')diag('human',m);
    if(m==='__YJ_SHOW__'){w.setContentSize(380,230);w.center();w.setTitle('사람인지 확인');w.show();arm(200000)}else if(m==='__YJ_HIDE__'){w.hide();arm(limit)}});
  });
  const closed=new Promise(res=>w.once('closed',()=>res({error:'창을 닫아 등록을 취소했습니다.'})));
  const run=w.webContents.executeJavaScript(code,true).catch(async err=>{await sleep(2500);return {error:'처리 중 오류가 났습니다: '+err.message}});
  return await Promise.race([run,nav,timeout,closed]);
 }finally{clearTimeout(timer);hiddenJobs.delete(wcId);if(!w.isDestroyed())w.destroy()}
});
// 공식 화면을 사용자에게 보여 줍니다(로그인, 보안 문자 입력 등). 창을 닫거나 closeOn 주소에 도달하면 끝납니다.
ipcMain.handle('official',(event,url,opt={})=>new Promise(resolve=>{
 if(!dcUrl(url))return resolve(false);
 const w=helperWindow(true);let done=false;
 const finish=v=>{if(done)return;done=true;resolve(v);if(!w.isDestroyed())w.destroy()};
 if(typeof opt.closeOn==='string')w.webContents.on('did-navigate',(e,u)=>{if(u.startsWith(opt.closeOn))setTimeout(()=>finish(true),600)});
 w.on('closed',()=>finish(false));
 asPhone(w).then(()=>{if(!w.isDestroyed())w.loadURL(url).catch(()=>{})});
}));
ipcMain.handle('logout',async()=>{await session.defaultSession.clearStorageData({storages:['cookies']});return true});

/* 설정 사본: 화면이 설정을 저장할 때마다 파일로도 한 벌 남깁니다. 브라우저 저장소가 지워지거나 깨져도 다음 실행 때 이 파일에서 되살립니다.
   확인용 실행(YJ_SHOT)은 사본을 읽지도 쓰지도 않습니다. */
const backupFile=()=>path.join(app.getPath('userData'),'settings-backup.json');
ipcMain.on('backup-load',e=>{try{e.returnValue=process.env.YJ_SHOT?'':fs.readFileSync(backupFile(),'utf8')}catch{e.returnValue=''}});
let backupTimer=null,backupText='';
ipcMain.on('backup-save',(e,json)=>{
 if(process.env.YJ_SHOT||typeof json!=='string'||json.length>30e6)return;backupText=json;
 if(!backupTimer)backupTimer=setTimeout(writeBackup,1500);
});
function writeBackup(){clearTimeout(backupTimer);backupTimer=null;if(!backupText)return;try{const f=backupFile();fs.writeFileSync(f+'.tmp',backupText);fs.renameSync(f+'.tmp',f)}catch(e){diag('backup-fail',e.message)}}
app.on('before-quit',writeBackup);

function createWindow(){
 const test=!!process.env.YJ_SHOT;/* 확인용 실행은 창을 화면에 띄우지 않습니다. */
 win=new BrowserWindow({width:Number(process.env.YJ_W)||440,height:800,minWidth:360,minHeight:520,title:'양지톡',autoHideMenuBar:true,backgroundColor:'#ffffff',
  /* 윈도우 기본 제목 줄을 없애고, 최소화·최대화·닫기 단추만 화면 오른쪽 위에 얹습니다. 창을 끄는 자리는 app.css의 .win 규칙이 만듭니다. */
  titleBarStyle:'hidden',titleBarOverlay:{color:'rgba(0,0,0,0)',symbolColor:'#8a8a8a',height:30},show:!test||!!process.env.YJ_VISIBLE,/* YJ_VISIBLE: 확인용 실행에서도 창을 실제로 띄웁니다. */
  webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,additionalArguments:['--yj-version='+app.getVersion()]}});
 if(process.env.YJ_VISIBLE)win.setAlwaysOnTop(true);
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 win.webContents.on('will-navigate',e=>e.preventDefault());
 win.loadFile(path.join(__dirname,'..','app','index.html'));
 // 개발용 확인: YJ_SHOT=파일.png (YJ_JS=실행할 스크립트, YJ_WAIT=밀리초)를 주면 화면을 찍고 종료합니다.
 if(process.env.YJ_SHOT)win.webContents.once('did-finish-load',async()=>{
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  await wait(Number(process.env.YJ_WAIT)||4000);
  if(process.env.YJ_JS){const out=await win.webContents.executeJavaScript(fs.readFileSync(process.env.YJ_JS,'utf8')).catch(e=>'JS 오류: '+e.message);if(out!==undefined)console.log('[js]',out);await wait(Number(process.env.YJ_WAIT2)||4000)}
  fs.writeFileSync(process.env.YJ_SHOT,(await win.webContents.capturePage(undefined,{stayHidden:true})).toPNG());app.quit();
 });
 win.webContents.on('console-message',(e,level,message)=>{if(process.env.YJ_SHOT&&level>=2)console.log('[page]',message)});
}
/* 그래픽 가속을 끕니다. 창 크기를 끌 때 회색 영역이 모니터를 덮는 문제가 있었는데, 화면 캡처에는 찍히지 않아
   그래픽 카드가 창을 따로 겹쳐 그리는 방식(하드웨어 오버레이)에서 생기는 것으로 보고, 그 경로를 쓰지 않게 합니다.
   이 앱은 글과 그림 위주라 가속 없이도 충분합니다. YJ_GPU=1 로 실행하면 가속을 다시 켭니다.
   다만 그래픽 카드를 아예 끄면 브라우저가 '소프트웨어 그래픽'으로 보여 '사람인지 확인'이 비정상으로 판단할 수 있어,
   화면을 겹쳐 그리는 일(합성)만 그래픽 카드에 맡기지 않고 그래픽 카드 자체는 켜 둡니다. YJ_GPU=off 는 예전처럼 완전히 끕니다. */
if(process.env.YJ_GPU==='off')app.disableHardwareAcceleration();
else if(!process.env.YJ_GPU)app.commandLine.appendSwitch('disable-gpu-compositing');
// 앱은 하나만 실행합니다(두 개가 같은 저장 공간을 함께 쓰면 서로 방해합니다). 확인용 실행은 예외입니다.
if(!process.env.YJ_SHOT&&!app.requestSingleInstanceLock())app.quit();
else{
 app.on('second-instance',showWin);
 app.whenReady().then(()=>{diagSetup();setupSession();createWindow();if(!process.env.YJ_SHOT)setupTray()});
}
/* 창의 닫기 단추는 앱을 끄지 않고 창만 숨깁니다. 앱은 작업 표시줄 오른쪽 알림 영역(트레이)에 남아 알림 확인을 계속하고,
   트레이 아이콘을 누르면 창이 다시 열립니다. 완전히 끄려면 트레이 아이콘을 우클릭해 '종료'를 누릅니다. */
let tray=null,quitting=false;
function showWin(){if(!win)return;if(win.isMinimized())win.restore();win.show();win.focus()}
function setupTray(){
 win.on('close',e=>{if(!quitting){e.preventDefault();win.hide()}});
 tray=new Tray(path.join(__dirname,'tray.png'));tray.setToolTip('양지톡');
 tray.setContextMenu(Menu.buildFromTemplate([{label:'열기',click:showWin},{type:'separator'},{label:'종료',click:()=>app.quit()}]));
 tray.on('click',showWin);
}
app.on('before-quit',()=>{quitting=true});
app.on('window-all-closed',()=>app.quit());
