// 안드로이드 껍데기(MainActivity의 YJ)를 윈도우와 같은 모양의 native 객체로 감쌉니다.
export function androidNative(YJ){
 const waiting=new Map();let seq=0;
 window.__yjReply=(id,value)=>{const p=waiting.get(id);if(!p)return;waiting.delete(id);if(value&&value.__error)p.reject(Error(value.__error));else p.resolve(value)};
 const call=(name,...args)=>new Promise((resolve,reject)=>{const id='r'+(++seq);waiting.set(id,{resolve,reject});YJ[name](id,...args)});
 return {
  platform:'android',version:YJ.version(),
  http:(url,opt)=>call('http',url,JSON.stringify(opt||{})),
  drive:(url,code,opt)=>call('drive',url,code,JSON.stringify(opt||{})),
  /* 사진·동영상 올리기 진행 상황(JSON 문자열): 껍데기가 window.__yjProgress로 넘겨 줍니다. */
  onProgress:cb=>{window.__yjProgress=json=>cb(json)},
  official:(url,opt)=>call('official',url,JSON.stringify(opt||{})),
  open:url=>YJ.open(url),
  logout:()=>call('logout'),
  notify:(title,body)=>YJ.notify(String(title||''),String(body||''))
 };
}
