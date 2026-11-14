// 확인용 스크립트를 만듭니다: 실제 댓글·글쓰기 조작에서 등록 직전까지만 실행해, 유동 닉네임·비밀번호 칸이 채워지는지 봅니다(등록 함수는 호출되지 않게 막습니다).
import fs from 'node:fs';
import {script,mView,mWrite} from '../src/core/drive.js';
const g={id:'programming',type:'normal'},guest={nick:'ㅇㅇ',pw:'dry-run-pw'};
/* 등록 함수와 '사람인지 확인'을 가짜로 바꿔, 칸에 들어간 값만 돌려받습니다. */
const stub=fn=>`window.dcTs=null;window.${fn}=function(){};`;
const read=sel=>`JSON.stringify([...document.querySelectorAll('${sel}')].map(n=>n.id+'='+(n.type==='password'?'*'.repeat(n.value.length):n.value)))`;
const c=`(async()=>{${stub('comment_write_ok')}const p=${script('comment',{text:'dry',parentNo:'',guest})};const r=await Promise.race([p,new Promise(r=>setTimeout(()=>r('(등록 응답 없음: 예상대로)'),4000))]);return {r,fields:${read('#comment_nick,#comment_pw,#comment_memo')}}})()`;
const w=`(async()=>{${stub('write_submit')}const p=${script('write',{title:'dry',head:'',blocks:[{t:'text',v:'dry'}],guest})};const r=await Promise.race([p,new Promise(r=>setTimeout(()=>r('(등록 응답 없음: 예상대로)'),6000))]);return {r,fields:${read('#name,#password,#subject')},body:document.querySelector('.note-editable').textContent}})()`;
fs.writeFileSync(new URL('./t-guestdry.js',import.meta.url),`// make-guest-dry.mjs 가 만든 파일입니다.\n(async()=>{const a=await window.native.drive(${JSON.stringify(mView(g,2942913))},${JSON.stringify(c)},{timeout:40000});const b=await window.native.drive(${JSON.stringify(mWrite(g))},${JSON.stringify(w)},{timeout:40000});return JSON.stringify({comment:a,write:b},null,1)})()\n`);
console.log('t-guestdry.js 생성');
