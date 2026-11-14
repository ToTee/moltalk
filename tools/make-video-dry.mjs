// 확인용: 동영상 첨부를 실제 글 등록 없이 끝까지 돌려 보는 화면 스크립트(tmp/t-video-dry.js)를 만듭니다.
// 화면에서 2초짜리 시험 영상을 만들어 디시 글쓰기 화면에 올리고, 본문에 들어가는지까지만 봅니다.
// 등록 함수(write_submit)는 가짜로 바꿔 두므로 글은 올라가지 않습니다(올린 영상 파일은 어느 글에도 붙지 않습니다).
import fs from 'node:fs';
import {script,mWrite} from '../src/core/drive.js';
const inner=script('write',{title:'몰톡 확인',head:'',guest:{nick:'ㅇㅇ',pw:'molt1234'},blocks:[{t:'text',v:'영상 앞'},{t:'video',name:'test.webm',type:'video/webm',b64:'__B64__'},{t:'text',v:'영상 뒤'}]});
const code='(async()=>{window.dcTsLoad=null;window.write_submit=()=>{alert("DRY "+JSON.stringify({type:(document.querySelector("#movie_upload_type_val")||{}).value,movieData:(document.querySelector("#movieData")||{}).value,code:window.jQuery("#textbox").summernote("code")}))};'+
 /* 진단: 영상 관련 요청의 응답과, 60초 뒤의 화면 상태를 함께 돌려줍니다. */
 'const log=[];window.jQuery(document).ajaxComplete((e,xhr,s)=>{if(/movie|mvinfo/.test(s.url||""))log.push((s.url||"")+" "+xhr.status+" "+String(xhr.responseText||"").slice(0,300))});'+
 'const diag=new Promise(r=>setTimeout(()=>{const lay=document.querySelector("#mvinfo_insert_layer"),th=document.querySelector("#mv_thumb");r({diag:{layer:lay?getComputedStyle(lay).display:"none?",thumb:th?th.getAttribute("src"):null,fn:typeof window.insertMovieInfo,up:getComputedStyle(document.querySelector("#movie_upload_layer")).display,pct:(document.querySelector("#progress_bar_cur_per_txt")||{}).textContent,log,code:window.jQuery("#textbox").summernote("code").slice(0,600)}})},60000));'+
 'return await Promise.race([diag,'+inner+'])})()';
fs.writeFileSync(new URL('../tmp/t-video-dry.js',import.meta.url),`(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const c=document.createElement('canvas');c.width=320;c.height=180;const x=c.getContext('2d');
 const rec=new MediaRecorder(c.captureStream(15),{mimeType:'video/webm'}),parts=[];rec.ondataavailable=e=>parts.push(e.data);rec.start();
 for(let i=0;i<30;i++){x.fillStyle='hsl('+i*12+',70%,50%)';x.fillRect(0,0,320,180);x.fillStyle='#fff';x.font='40px sans-serif';x.fillText('MOLTALK '+i,40,100);await wait(70)}
 rec.stop();await new Promise(r=>rec.onstop=r);const buf=new Uint8Array(await new Blob(parts).arrayBuffer());let s='';for(let i=0;i<buf.length;i+=8192)s+=String.fromCharCode.apply(null,buf.subarray(i,i+8192));
 const prog=[];window.native.onProgress(j=>prog.push(j));
 const r=await window.native.drive(${JSON.stringify(mWrite({id:'programming',type:'normal'}))},${JSON.stringify(code)}.replace('__B64__',btoa(s)),{timeout:300000});
 return JSON.stringify({bytes:buf.length,prog,r})})()`);
console.log('tmp/t-video-dry.js 생성');
