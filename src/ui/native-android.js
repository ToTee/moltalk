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
  /* 유튜브는 앱 화면과 따로 둔 재생 화면에서 틉니다(유튜브 쪽 스크립트가 앱 기능을 쓰지 못하게). */
  youtube:id=>YJ.youtube(String(id)),
  logout:()=>call('logout'),
  notify:(title,body)=>YJ.notify(String(title||''),String(body||'')),
  /* 다크 모드: 맨 위 상태 표시줄과 맨 아래 내비게이션 바의 색을 화면에 맞춥니다. */
  theme:dark=>YJ.theme(!!dark)
 };
}
