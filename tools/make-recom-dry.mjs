// 확인용 스크립트를 만듭니다: 추천 조작을 실행하되 디시로 가는 요청은 가짜 응답으로 바꿔, 실제로는 추천하지 않습니다.
import fs from 'node:fs';
import {script,mView} from '../src/core/drive.js';
const fake=res=>`jQuery.ajax=function(o){const r=${JSON.stringify(res)};if(o.success)o.success(r);jQuery(document).trigger('ajaxComplete',[{responseJSON:r,responseText:JSON.stringify(r)},{url:o.url}])};`;
const run=(res,args)=>`(async()=>{${fake(res)}return await ${script('recommend',args)}})()`;
const url=JSON.stringify(mView({id:'programming',type:'normal'},2942913));
fs.writeFileSync(new URL('./t-recomdry.js',import.meta.url),`// make-recom-dry.mjs 가 만든 파일입니다.\n(async()=>{const d=(c)=>window.native.drive(${url},c,{timeout:40000});return JSON.stringify({ok:await d(${JSON.stringify(run({result:1},{down:false}))}),already:await d(${JSON.stringify(run({result:0,cause:'이미 추천하셨습니다.'},{down:false}))}),captcha:await d(${JSON.stringify(run({result:0,cause:'captcha'},{down:true}))})},null,1)})()\n`);
console.log('t-recomdry.js 생성');