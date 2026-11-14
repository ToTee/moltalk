// 양지톡 윈도우용 껍데기. 화면(app/)을 띄우고, 디시로 가는 요청만 대신 보내 줍니다.
const {app,BrowserWindow,ipcMain,net,session,shell}=require('electron');
const path=require('path');
const fs=require('fs');
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const dcHost=h=>/(^|\.)dcinside\.(com|co\.kr)$/.test(h);
const dcUrl=u=>{try{const x=new URL(u);return x.protocol==='https:'&&!x.username&&!x.password&&dcHost(x.hostname)?x:null}catch{return null}};
let win=null;

function setupSession(){
 const ses=session.defaultSession;
 ses.setUserAgent(UA);
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
ipcMain.handle('open',(event,url)=>{if(dcUrl(url))shell.openExternal(url)});

// 쓰기·삭제·로그인은 디시 공식 모바일 화면을 보조 창에서 열어 처리합니다. 로그인 쿠키는 같은 세션을 함께 씁니다.
const MOBILE_UA='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function helperWindow(show){
 const w=new BrowserWindow({width:440,height:780,show,parent:win,title:'디시인사이드',autoHideMenuBar:true,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});
 w.webContents.setUserAgent(MOBILE_UA);
 w.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 w.webContents.on('will-navigate',(e,u)=>{if(!dcUrl(u))e.preventDefault()});
 return w;
}
// 공식 화면을 보이지 않는 창에서 열고 스크립트를 실행해 결과를 돌려줍니다. 화면이 다른 주소로 넘어가면(글 등록 완료 등) 그 주소를 돌려줍니다.
ipcMain.handle('drive',async(event,url,code,opt={})=>{
 if(!dcUrl(url)||typeof code!=='string')throw Error('디시인사이드 주소만 열 수 있습니다.');
 const w=helperWindow(false);
 try{
  await w.loadURL(url).catch(()=>{});
  if(!dcUrl(w.webContents.getURL()))return {error:'화면을 열지 못했습니다.'};
  const nav=new Promise(res=>w.webContents.once('did-navigate',(e,u)=>res({navigated:u})));
  const run=w.webContents.executeJavaScript(code,true).catch(async err=>{await sleep(2500);return {error:'처리 중 오류가 났습니다: '+err.message}});
  const timeout=sleep(Math.min(Number(opt.timeout)||45000,300000)).then(()=>({error:'시간이 초과되었습니다.'}));
  return await Promise.race([run,nav,timeout]);
 }finally{if(!w.isDestroyed())w.destroy()}
});
// 공식 화면을 사용자에게 보여 줍니다(로그인, 보안 문자 입력 등). 창을 닫거나 closeOn 주소에 도달하면 끝납니다.
ipcMain.handle('official',(event,url,opt={})=>new Promise(resolve=>{
 if(!dcUrl(url))return resolve(false);
 const w=helperWindow(true);let done=false;
 const finish=v=>{if(done)return;done=true;resolve(v);if(!w.isDestroyed())w.destroy()};
 if(typeof opt.closeOn==='string')w.webContents.on('did-navigate',(e,u)=>{if(u.startsWith(opt.closeOn))setTimeout(()=>finish(true),600)});
 w.on('closed',()=>finish(false));
 w.loadURL(url).catch(()=>{});
}));
ipcMain.handle('logout',async()=>{await session.defaultSession.clearStorageData({storages:['cookies']});return true});

function createWindow(){
 const test=!!process.env.YJ_SHOT;/* 확인용 실행은 창을 화면에 띄우지 않습니다. */
 win=new BrowserWindow({width:Number(process.env.YJ_W)||440,height:800,minWidth:360,minHeight:520,title:'양지톡',autoHideMenuBar:true,backgroundColor:'#ffffff',show:!test,
  webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,additionalArguments:['--yj-version='+app.getVersion()]}});
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
app.whenReady().then(()=>{setupSession();createWindow()});
app.on('window-all-closed',()=>app.quit());
