// 확인용 스크립트를 만듭니다: 글자콘을 일반 댓글과 답글로 보낼 때 디시에 나가는 요청 내용을 봅니다.
// 실제로는 아무것도 등록하지 않습니다: 등록 요청(/ajax/comment-write)과 그 앞의 요청(/ajax/access)을 가로채 내용만 적어 둡니다.
import fs from 'node:fs';
import {script,mView} from '../src/core/drive.js';
const g={id:'blackpink',type:'normal'},no=5349789,guest={nick:'ㅇㅇ',pw:'dry-run-pw'};
const stub=`window.__cap=[];window.dcTs=null;window.dcTsWait=function(){return false};window.dcTsUse=function(){};
const oa=window.jQuery.ajax;window.jQuery.ajax=function(o){if(/\\/ajax\\/access/.test(o.url)){setTimeout(()=>o.success&&o.success({Block_key:'dry'}),50);return}
 if(/comment-write/.test(o.url)){window.__cap.push(String(o.data).replace(/comment_pw=[^&]*/,'comment_pw=***'));return}return oa.apply(this,arguments)};
const sc=window.setCookie_hk_min;window.setCookie_hk_min=function(k){window.__cap.push('cookie '+k);};`;
const run=reply=>{const src=script('txtcon',{text:'시험',bg:'3b4890',fg:'ffffff',parentNo:reply?'__P__':'',guest});
 return `(async()=>{${stub}const pn=(document.querySelector('#comment_box li.comment')||{getAttribute(){return ''}}).getAttribute('no');
 const p=eval(${JSON.stringify(src)}.split('__P__').join(pn));
 const r=await Promise.race([p,new Promise(r=>setTimeout(()=>r('(등록 응답 없음: 예상대로)'),6000))]);
 return {reply:${reply},parent:pn,r,usable:typeof txtconIsUsable==='function'?txtconIsUsable():null,mode:typeof dcconMode==='undefined'?null:dcconMode,color:typeof txtconColor==='undefined'?null:txtconColor,memo:(document.querySelector('#txtcon_memo')||{}).value,boxes:[...document.querySelectorAll('.txtconBox')].map(b=>b.id+':'+b.children.length),cap:window.__cap}})()`};
fs.writeFileSync(new URL('./t-txtcondry.js',import.meta.url),`// make-txtcon-dry.mjs 가 만든 파일입니다.\n(async()=>{const a=await window.native.drive(${JSON.stringify(mView(g,no))},${JSON.stringify(run(false))},{timeout:40000});const b=await window.native.drive(${JSON.stringify(mView(g,no))},${JSON.stringify(run(true))},{timeout:40000});return JSON.stringify({top:a,reply:b},null,1)})()\n`);
console.log('t-txtcondry.js 생성');
