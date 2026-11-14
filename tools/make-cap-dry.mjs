// 확인용 스크립트를 만듭니다: 보안 문자가 있는 갤러리(향수)의 글에서 댓글 조작을 등록 직전까지만 실행해, 보안 문자 그림과 입력 칸만 작은 창으로 보이는지 봅니다(등록 함수는 호출되지 않게 막습니다).
import fs from 'node:fs';
import {script,mView} from '../src/core/drive.js';
const g={id:'hyang',type:'minor'},guest={nick:'ㅇㅇ',pw:'dry-run-pw'};
/* 2.5초 뒤 창 상태를 적어 두고, 사용자가 한 것처럼 글자를 넣고 확인을 누릅니다. */
const peek=`setTimeout(()=>{const h=document.querySelector('.yj-host'),img=h&&h.querySelector('img'),inp=document.querySelector('#captcha_codeC'),tip=document.querySelector('#yj-tip'),b=tip&&tip.querySelector('button'),r=x=>{const q=x.getBoundingClientRect();return [Math.round(q.left),Math.round(q.top),Math.round(q.width),Math.round(q.height)]};
 window.__peek={host:h?h.tagName+'.'+h.className:null,img:img?[img.naturalWidth,img.naturalHeight,getComputedStyle(img).visibility].concat(r(img)):null,input:inp?[getComputedStyle(inp).visibility].concat(r(inp)):null,tip:tip?tip.textContent:null,memoHidden:getComputedStyle(document.querySelector('#comment_memo')).visibility,view:[innerWidth,innerHeight]};
 if(inp){inp.value='12'}if(b)b.click()},2500);`;
const c=`(async()=>{window.dcTs=null;window.comment_write_ok=function(){window.__sent=true};${peek}const p=${script('comment',{text:'dry',parentNo:'',guest})};const r=await Promise.race([p,new Promise(r=>setTimeout(()=>r('(등록 응답 없음: 예상대로)'),7000))]);return {r,peek:window.__peek,sentCalled:!!window.__sent,code:document.querySelector('#captcha_codeC').value,stillShown:!!document.querySelector('.yj-host'),memo:document.querySelector('#comment_memo').value}})()`;
fs.writeFileSync(new URL('./t-capdry.js',import.meta.url),`// make-cap-dry.mjs 가 만든 파일입니다.\n(async()=>{const a=await window.native.drive(${JSON.stringify(mView(g,Number(process.argv[2])))},${JSON.stringify(c)},{timeout:40000});return JSON.stringify(a,null,1)})()\n`);
console.log('t-capdry.js 생성');
