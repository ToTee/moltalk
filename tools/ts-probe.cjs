// 진단용: '사람인지 확인'(클라우드플레어)이 PC에서 왜 실패하는지 조건을 바꿔 가며 봅니다.
// 디시 모바일 글 화면 하나를 열고 확인 상자를 불러오기만 합니다. 아무것도 누르거나 등록하지 않습니다.
// 사용: electron tools/ts-probe.cjs   환경변수 P_GPU=1(그래픽 가속 켬) P_UA=mobile|real(기본 mobile) P_SHOW=1(창 보임) P_URL=글 주소
const {app,BrowserWindow}=require('electron');
if(!process.env.P_GPU)app.disableHardwareAcceleration();
const MOBILE_UA='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/'+(process.env.P_OLDUA?'130':process.versions.chrome.split('.')[0])+'.0.0.0 Mobile Safari/537.36';
const REAL_UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/'+process.versions.chrome.split('.')[0]+'.0.0.0 Safari/537.36';
app.whenReady().then(async()=>{
 const w=new BrowserWindow({width:440,height:780,show:!!process.env.P_SHOW,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});
 w.webContents.setUserAgent(process.env.P_UA==='real'?REAL_UA:MOBILE_UA);
 const logs=[];w.webContents.on('console-message',(e,l,m)=>{if(l>=2)logs.push(String(typeof m==='string'?m:e.message).slice(0,160))});
 await w.loadURL(process.env.P_URL).catch(e=>logs.push('load: '+e.message));
 const out=await w.webContents.executeJavaScript(`(async()=>{
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const slot=document.querySelector('#dc-turnstile, .dc-ts-slot'),ts=window.dcTs;
  const env={url:location.href,ua:navigator.userAgent.slice(0,60),uaData:navigator.userAgentData?navigator.userAgentData.platform+'/mobile='+navigator.userAgentData.mobile+'/'+navigator.userAgentData.brands.map(b=>b.brand+b.version).join(','):null,platform:navigator.platform,touch:navigator.maxTouchPoints,vis:document.visibilityState,
   webgl:(()=>{try{const g=document.createElement('canvas').getContext('webgl');if(!g)return 'none';const x=g.getExtension('WEBGL_debug_renderer_info');return x?g.getParameter(x.UNMASKED_RENDERER_WEBGL):'yes'}catch(e){return 'err'}})()};
  if(!slot||!ts||typeof window.dcTsLoad!=='function')return {env,note:'확인 상자 없음',slot:!!slot,ts:!!ts};
  const root=slot.closest('form')||document.body;
  window.dcTsLoad();window.dcTsUse(root);
  const token=()=>{try{return window.turnstile&&ts.id!==null&&window.turnstile.getResponse(ts.id)||''}catch(e){return ''}};
  const seen=[];for(let i=0;i<50&&!token();i++){if(seen[seen.length-1]!==ts.state)seen.push(ts.state);await wait(500)}
  return {env,states:seen,final:ts.state,token:token().length};
 })()`,true).catch(e=>({error:e.message}));
 console.log(JSON.stringify({gpu:!!process.env.P_GPU,uaMode:process.env.P_UA||'mobile',shown:!!process.env.P_SHOW,out,logs:logs.slice(0,6)},null,1));
 app.quit();
});
