// 확인용 스크립트를 만듭니다: 보안 문자가 있는 갤러리(향수)의 글에서 댓글 조작을 등록 직전까지만 실행해, 보안 문자 그림과 입력 칸만 작은 창으로 보이는지 봅니다(등록 함수는 호출되지 않게 막습니다).
import fs from 'node:fs';
import {script,mView} from '../src/core/drive.js';
const g={id:'hyang',type:'minor'},guest={nick:'ㅇㅇ',pw:'dry-run-pw'};
/* 2.5초 뒤 창 상태를 적어 두고, 사용자가 한 것처럼 글자를 넣고 확인을 누릅니다. */
const peek=`const look=()=>{const tip=document.querySelector('#yj-tip'),img=tip&&tip.querySelector('img'),inp=document.querySelector('#captcha_codeC'),b=tip&&tip.querySelector('button'),t=tip&&tip.firstElementChild,rl=tip&&tip.querySelector('.sp-reload'),r=x=>{if(!x)return null;const q=x.getBoundingClientRect();return [getComputedStyle(x).visibility,Math.round(q.left),Math.round(q.top),Math.round(q.right),Math.round(q.bottom)]};
 const A={text:r(t),img:r(img),reload:r(rl),input:r(inp),btn:r(b)},names=Object.keys(A).filter(k=>A[k]),hit=[];
 for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++){const p=A[names[i]],q=A[names[j]];if(p[1]<q[3]&&q[1]<p[3]&&p[2]<q[4]&&q[2]<p[4])hit.push(names[i]+'×'+names[j])}
 return Object.assign(A,{overlap:hit,inTip:!!(tip&&tip.contains(inp)),imgLoaded:img?img.naturalWidth:0,memoHidden:getComputedStyle(document.querySelector('#comment_memo')).visibility,view:[innerWidth,innerHeight]})};
 setTimeout(()=>{window.__peek=look();const inp=document.querySelector('#captcha_codeC');if(inp)inp.value='12';console.log('__YJ_HSNAP__cap')},2500);setTimeout(()=>{const b=document.querySelector('#yj-tip button');if(b)b.click()},4200);`;
const c=`(async()=>{window.dcTs=null;window.comment_write_ok=function(){window.__sent=true};${peek}const p=${script('comment',{text:'dry',parentNo:'',guest})};const r=await Promise.race([p,new Promise(r=>setTimeout(()=>r('(등록 응답 없음: 예상대로)'),9000))]);return {r,peek:window.__peek,sentCalled:!!window.__sent,code:document.querySelector('#captcha_codeC').value,stillShown:!!document.querySelector('#yj-tip'),restored:(()=>{const i=document.querySelector('#captcha_codeC'),f=document.querySelector('#comment_write');return {inputInForm:f.contains(i),imgInForm:!!f.querySelector('.code img'),inputStyle:i.getAttribute('style')}})(),memo:document.querySelector('#comment_memo').value}})()`;
fs.writeFileSync(new URL('./t-capdry.js',import.meta.url),`// make-cap-dry.mjs 가 만든 파일입니다.\n(async()=>{const a=await window.native.drive(${JSON.stringify(mView(g,Number(process.argv[2])))},${JSON.stringify(c)},{timeout:40000});return JSON.stringify(a,null,1)})()\n`);
console.log('t-capdry.js 생성');
