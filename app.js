const aircraft = [
 {reg:'SU-SKB',type:'A320-232',status:'SERVICEABLE',cls:'serviceable',open:3,mel:1,loc:'CAI',update:'10 min ago'},
 {reg:'SU-SKC',type:'A320-232',status:'DEFERRED',cls:'deferred',open:7,mel:2,loc:'HRG',update:'15 min ago'},
 {reg:'SU-SKD',type:'A321-231',status:'AOG',cls:'aog',open:12,mel:4,loc:'SSH',update:'1 hour ago'},
 {reg:'SU-SKE',type:'A320-232',status:'SERVICEABLE',cls:'serviceable',open:2,mel:0,loc:'CAI',update:'8 min ago'},
 {reg:'SU-SKF',type:'A320-232',status:'DEFERRED',cls:'deferred',open:5,mel:1,loc:'ASW',update:'20 min ago'}
];
const grid=document.getElementById('aircraftGrid');
function render(list){
 grid.innerHTML=list.map(a=>`<article class="aircraft-card">
  <header><div><h4>${a.reg}</h4><small>${a.type}</small></div><span class="tag ${a.cls}">${a.status}</span></header>
  <div class="plane">✈</div>
  <div class="stats"><div><small>Open Defects</small><b>${a.open}</b></div><div><small>MEL Items</small><b>${a.mel}</b></div></div>
  <div class="meta"><div><small>Location</small><b>⌖ ${a.loc}</b></div><div><small>Last Update</small><span>${a.update}</span></div></div>
 </article>`).join('');
}
render(aircraft);
document.getElementById('search').addEventListener('input',e=>{
 const q=e.target.value.toLowerCase();
 render(aircraft.filter(a=>Object.values(a).join(' ').toLowerCase().includes(q)));
});
document.getElementById('darkToggle').onclick=()=>document.body.classList.toggle('dark');
document.getElementById('menuBtn').onclick=()=>document.getElementById('sidebar').classList.toggle('open');
document.addEventListener('click',e=>{
 if(innerWidth<700 && !e.target.closest('#sidebar') && !e.target.closest('#menuBtn')) document.getElementById('sidebar').classList.remove('open');
});
