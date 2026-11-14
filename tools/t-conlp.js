/* 확인용: 디시콘 창에서 꾹 누르면 첫 번째가 골라지고 그 상태가 유지되는지 봅니다. 두 번째는 누르지 않으므로 아무것도 등록되지 않습니다. */
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};
 document.querySelector('.row[data-g="normal:dcbest"]')?.click();await wait(2500);
 document.querySelector('#cscroll .row.post')?.click();await wait(3500);
 document.querySelector('[data-cpanel]')?.click();for(let i=0;i<80&&!document.querySelector('.cons .con');i++)await wait(500);
 const con=n=>document.querySelectorAll('.cons .con')[n],sel=()=>[...document.querySelectorAll('.cons .con')].findIndex(x=>x.classList.contains('sel'));
 out.cons=document.querySelectorAll('.cons .con').length;if(!out.cons)return JSON.stringify(out);
 const ev=(el,type,C=PointerEvent)=>el.dispatchEvent(new C(type,{bubbles:true,cancelable:true,clientX:5,clientY:5,button:0}));
 /* PC: 마우스로 꾹 누름 */
 ev(con(1),'pointerdown');await wait(700);out.pcHeld=sel();ev(document.body,'pointerup');await wait(120);out.pcAfterUp=sel();
 /* 같은 것을 다시 꾹 눌러도 풀리지 않아야 함 */
 ev(con(1),'pointerdown');await wait(700);ev(document.body,'pointerup');await wait(120);out.pcHeldAgain=sel();
 /* 다른 것을 꾹 누르면 그쪽으로 바뀜 */
 ev(con(2),'pointerdown');await wait(700);ev(document.body,'pointerup');await wait(120);out.pcOther=sel();
 /* 휴대폰: 꾹 누르는 중에 contextmenu가 먼저 오고, 손을 떼면 pointercancel이 옴 */
 ev(con(3),'pointerdown');await wait(420);ev(con(3),'contextmenu',MouseEvent);await wait(300);out.mHeld=sel();ev(document.body,'pointercancel');await wait(120);out.mAfter=sel();
 out.hint=document.querySelector('.cpanel .hint,.hint')?.textContent.slice(0,40);
 return JSON.stringify(out)})()
