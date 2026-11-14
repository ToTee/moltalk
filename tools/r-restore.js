// 복구용(한 번만 씀): 지워진 PC 설정에서 친구 목록·즐겨찾기·이름을 화면 사진에 남아 있던 대로 다시 넣습니다. 사진은 원본이 없어 넣지 못합니다.
(()=>{
 const K='yangjitalk-v1',D=JSON.parse(localStorage.getItem(K)||'{}');
 const want=[{id:'dc_challenge',type:'normal',name:'디시 개선 20일 챌린지'},{id:'blackpink',type:'normal',name:'블랙핑크'},{id:'dcbest',type:'normal',name:'실시간 베스트'},{id:'clawstage',type:'minor',name:'클로스테이지'},{id:'thesingularity',type:'minor',name:'특이점이 온다'},{id:'aifrontend',type:'minor',name:'AI 채팅 프론트엔드'},{id:'ai_utilize',type:'minor',name:'AI 활용'}];
 const key=g=>g.type+':'+g.id,have=new Map((D.gals||[]).map(g=>[key(g),g]));
 D.gals=want.map(g=>have.get(key(g))||g);
 D.favs=['normal:blackpink'];
 D.me={...(D.me||{}),name:'빡',status:'빠아아아악'};
 localStorage.setItem(K,JSON.stringify(D));
 /* 이 창이 예전 값을 다시 덮어쓰지 못하게 막습니다. */
 Storage.prototype.setItem=function(){};
 return 'restored: '+JSON.parse(localStorage.getItem(K)).gals.map(g=>g.name).join(', ');
})()
