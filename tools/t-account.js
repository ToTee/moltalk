// 확인용: 설정 > 계정을 열어 숨은 공식 화면 작업(로그인 상태 확인)을 한 번 일으킵니다.
(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms)),q=s=>document.querySelector(s);
 q('[data-ov="set"]').click();await wait(300);q('[data-stab="계정"]').click();await wait(9000);
 return [...document.querySelectorAll('#setf p')].map(p=>p.textContent).join(' | ');
})()
