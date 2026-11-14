// 확인용: 글쓰기 조작을 실제 등록 없이 끝까지 돌려 보는 화면 스크립트(tmp/t-write-dry.js)를 만듭니다.
// 등록 함수(write_submit)를 가짜로 바꿔, 디시 편집기에 들어간 본문만 읽어 옵니다. 글은 올라가지 않습니다.
import fs from 'node:fs';
import {script,mWrite} from '../src/core/drive.js';
/* 사람인지 확인은 건너뜁니다(등록하지 않으므로 필요 없습니다). */
const code='(async()=>{window.dcTsLoad=null;window.write_submit=()=>{alert("DRY "+JSON.stringify({subject:document.querySelector("#subject").value,head:(document.querySelector("#headtext")||{}).value,code:window.jQuery("#textbox").summernote("code")}))};return await '+script('write',{title:'양지톡 확인',head:'',blocks:[{t:'text',v:'첫 줄\n둘째 줄'},{t:'text',v:'다음 말풍선'}]})+'})()';
fs.writeFileSync(new URL('../tmp/t-write-dry.js',import.meta.url),'(async()=>{const r=await window.native.drive('+JSON.stringify(mWrite({id:'programming',type:'normal'}))+','+JSON.stringify(code)+',{timeout:120000});return JSON.stringify(r)})()');
