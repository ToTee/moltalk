// 진단용: '사람인지 확인'(클라우드플레어)이 PC에서 왜 실패하는지 조건을 바꿔 가며 봅니다.
// 디시 모바일 글 화면 하나를 열고 확인 상자를 불러오기만 합니다. 아무것도 누르거나 등록하지 않습니다.
// 사용: electron tools/ts-probe.cjs   환경변수 P_GPU=1(그래픽 가속 켬) P_UA=mobile|real(기본 mobile) P_SHOW=1(창 보임) P_URL=글 주소
const {app,BrowserWindow}=require('electron');
if(process.env.P_GPU==='nocomp')app.commandLine.appendSwitch('disable-gpu-compositing');else if(!process.env.P_GPU)app.disableHardwareAcceleration();
const MOBILE_UA='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/'+(process.env.P_OLDUA?'130':process.versions.chrome.split('.')[0])+'.0.0.0 Mobile Safari/537.36';
const REAL_UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/'+process.versions.chrome.split('.')[0]+'.0.0.0 Safari/537.36';
setTimeout(()=>{console.log('TIMEOUT stage='+stage);app.exit(0)},150000);let stage='start';
if(process.env.P_ONEUA)app.userAgentFallback=MOBILE_UA;
app.whenReady().then(async()=>{
 const w=new BrowserWindow({width:440,height:780,show:!!process.env.P_SHOW,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});
 if(!process.env.P_ONEUA)w.webContents.setUserAgent(process.env.P_UA==='real'?REAL_UA:MOBILE_UA);
 if(process.env.P_ASK){w.setAlwaysOnTop(true);w.center();w.setTitle('몰톡 시험 창');w.show();w.focus()}
 const t0=Date.now(),logs=[];w.webContents.on('console-message',(e,l,m)=>{const s=String(typeof m==='string'?m:e.message);if(/turnstile|cloudflare/i.test(s))logs.push(((Date.now()-t0)/1000).toFixed(1)+'s '+s.slice(0,160))});
 /* P_EMU=1: 크롬 개발자 도구의 '기기 모드'와 같은 방법으로, 브라우저가 알리는 정보(종류·터치·화면)를 휴대폰으로 일관되게 맞춥니다. */
 if(process.env.P_EMU){stage='emu';await w.loadURL('about:blank');const d=w.webContents.debugger,V=process.versions.chrome.split('.')[0];d.attach('1.3');
  await d.sendCommand('Emulation.setUserAgentOverride',{userAgent:MOBILE_UA,platform:'Linux armv81',userAgentMetadata:{brands:[{brand:'Chromium',version:V},{brand:'Not?A_Brand',version:'99'}],fullVersionList:[{brand:'Chromium',version:process.versions.chrome},{brand:'Not?A_Brand',version:'99.0.0.0'}],platform:'Android',platformVersion:'14.0.0',architecture:'',model:'Pixel 8',mobile:true,bitness:'',wow64:false}});
  await d.sendCommand('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
  await d.sendCommand('Emulation.setDeviceMetricsOverride',{width:412,height:780,deviceScaleFactor:2.625,mobile:true,screenWidth:412,screenHeight:915});}
 stage='load';await w.loadURL(process.env.P_URL).catch(e=>logs.push('load: '+e.message));
 stage='script';if(process.env.P_REVEAL){w.webContents.on('console-message',(e,l,m)=>{const s=String(typeof m==='string'?m:e.message);if(s==='__YJ_SHOW__'){if(process.env.P_REVEAL!=='noresize')w.setContentSize(380,230);w.center();w.show();logs.push(((Date.now()-t0)/1000).toFixed(1)+'s SHOWN')}})}
 const out=await w.webContents.executeJavaScript(`(async()=>{window.__reveal=${JSON.stringify(process.env.P_REVEAL||'')};window.__ask=${process.env.P_ASK?1:0};
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const slot=document.querySelector('#dc-turnstile, .dc-ts-slot'),ts=window.dcTs;
  const env={url:location.href,ua:navigator.userAgent.slice(0,60),uaData:navigator.userAgentData?navigator.userAgentData.platform+'/mobile='+navigator.userAgentData.mobile+'/'+navigator.userAgentData.brands.map(b=>b.brand+b.version).join(','):null,platform:navigator.platform,touch:navigator.maxTouchPoints,vis:document.visibilityState,
   webgl:(()=>{try{const g=document.createElement('canvas').getContext('webgl');if(!g)return 'none';const x=g.getExtension('WEBGL_debug_renderer_info');return x?g.getParameter(x.UNMASKED_RENDERER_WEBGL):'yes'}catch(e){return 'err'}})()};
  if(!slot||!ts||typeof window.dcTsLoad!=='function'){/* 디시가 아닌 화면(클라우드플레어 공개 시연 화면 등): 확인값이 저절로 생기는지만 봅니다. */let v='';for(let i=0;i<50&&!v;i++){v=(document.querySelector('[name=cf-turnstile-response]')||{}).value||'';await wait(500)}return {env:{uaData:env.uaData,webgl:env.webgl},generic:true,token:v.length}}
  const root=slot.closest('form')||document.body;
  window.dcTsLoad();window.dcTsUse(root);
  const token=()=>{try{return window.turnstile&&ts.id!==null&&window.turnstile.getResponse(ts.id)||''}catch(e){return ''}};
  const seen=[];
  if(window.__ask){const tip=document.createElement('div');tip.textContent='몰톡 시험용 창입니다. [사람인지 확인] 상자를 한 번만 눌러 주세요. 아무것도 등록되지 않고, 누르면 잠시 뒤 저절로 닫힙니다.';tip.style.cssText='position:fixed;left:0;right:0;top:0;z-index:2147483647;background:#fee500;color:#111;font:700 14px/1.5 sans-serif;padding:10px 12px;text-align:center';document.body.appendChild(tip);
   for(let i=0;i<40&&ts.state!=='interactive'&&!token();i++)await wait(500);(ts.host||slot).scrollIntoView({block:'center'});
   let last=null,endAt=0;const s0=Date.now();for(let i=0;i<200;i++){const s=String(ts.state);if(last!==s){last=s;seen.push(s+'@'+((Date.now()-s0)/1000).toFixed(0))}if(token()&&!endAt)endAt=i+2;if(/error/.test(s)&&!endAt)endAt=i+8;if(endAt&&i>=endAt)break;await wait(500)}
   return {env:{ua:env.ua,uaData:env.uaData,platform:env.platform},states:seen,final:ts.state,token:token().length}}
  if(window.__reveal){
   /* 앱이 하는 것과 같은 순서: 확인 상자가 '눌러야 함' 상태가 되면 나머지 화면을 가리고 창을 보여 줍니다. 아무것도 누르지 않습니다. */
   for(let i=0;i<40&&ts.state!=='interactive'&&ts.state!=='error'&&!token();i++)await wait(500);
   seen.push('before-reveal:'+ts.state);
   const host=ts.host||slot,st=document.createElement('style');
   st.textContent='html,body{background:#fff!important;overflow:hidden!important}body *{visibility:hidden!important}.yj-host,.yj-host *{visibility:visible!important}.yj-host{position:fixed!important;left:0!important;right:0!important;top:56%!important;transform:translateY(-50%)!important;display:flex!important;justify-content:center!important;margin:0!important;z-index:2147483646!important}';
   if(window.__reveal!=='nocss'){document.head.appendChild(st);host.classList.add('yj-host')}
   console.log('__YJ_SHOW__');
  }
  for(let i=0;i<40&&!token();i++){if(seen[seen.length-1]!==ts.state)seen.push(ts.state);await wait(500)}
  return {env,states:seen,final:ts.state,token:token().length};
 })()`,true).catch(e=>({error:e.message}));
 console.log(JSON.stringify({gpu:!!process.env.P_GPU,uaMode:process.env.P_UA||'mobile',shown:!!process.env.P_SHOW,out,logs:logs.slice(0,12).map(x=>x.slice(0,90))},null,1));
 app.quit();
});
