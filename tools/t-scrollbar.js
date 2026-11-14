// 확인용: 스크롤 막대가 자리를 차지하지 않는지(폭 0) 봅니다.
(()=>{const s=document.querySelector('#fscroll');return JSON.stringify({barWidth:s.offsetWidth-s.clientWidth,scrollable:s.scrollHeight>s.clientHeight,display:getComputedStyle(s,'::-webkit-scrollbar').display})})()
