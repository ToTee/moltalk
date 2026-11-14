// 확인용(디시 요청 없음): 원본 보기용 HTML 변환이 꾸밈은 살리고 위험한 것은 버리는지 봅니다.
import {parseHTML} from 'linkedom';
import fs from 'node:fs';
import {toHtml} from '../src/core/dc.js';
const conv=h=>toHtml(parseHTML('<html><body><div class="write_div">'+h+'</div></body></html>').document.querySelector('.write_div'));
const bad=conv('<div style="position:fixed;top:0;color:red;background:url(https://x/y.png)" onclick="alert(1)" class="ov" id="app">가<script>alert(1)</script><img src="https://a.b/c.png" onerror="alert(2)" style="width:716px"><a href="javascript:alert(3)">나</a><a href="https://ok.example/">다</a><iframe src="https://www.youtube.com/embed/x"></iframe><form><input name="q"></form><b>라&lt;x&gt;</b></div>');
console.log(bad);
const sneaky=conv('<div style="-webkit-app-region:drag;background-image:image-set(\'https://x/y\' 1x);background:#fee500;color:rgb(1,2,3);width:calc(100% - 4px);padding-top:4px;border-left:4px solid #fee500;position:fixed;font-size:17px">x</div>');
console.log(sneaky);
const checks={sneakyClean:!/app-region|image-set|position/.test(sneaky)&&/background:#fee500;color:rgb\(1,2,3\);width:calc\(100% - 4px\);padding-top:4px;border-left:4px solid #fee500;font-size:17px/.test(sneaky),noScript:!/script|onclick|onerror|javascript:/i.test(bad),noPosition:!/position|url\(/.test(bad),noClassId:!/ class="ov"| id=/.test(bad),keepsColor:/color:red/.test(bad),keepsImg:/<img[^>]+src="https:\/\/a\.b\/c\.png"/.test(bad),linkOk:/data-url="https:\/\/ok\.example\/"/.test(bad),escaped:/라&lt;x&gt;/.test(bad),embed:/class="embed" data-url="https:\/\/www\.youtube\.com\/embed\/x"/.test(bad)};
const intro=conv(fs.readFileSync(process.argv[2],'utf8'));
Object.assign(checks,{introStyled:(intro.match(/ style="/g)||[]).length,introImgs:(intro.match(/<img /g)||[]).length,introHasYellow:/#fee500/.test(intro),introAlign:/align="center"/.test(intro)});
console.log(JSON.stringify(checks,null,1));
