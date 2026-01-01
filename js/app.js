const SERVER = 'https://your-server.railway.app';
const tg = Telegram.WebApp;
const uid = tg.initDataUnsafe.user.id;
tg.expand();

function addRipple(e){
  const btn = e.currentTarget;
  const circle = document.createElement('span');
  const diameter = Math.max(btn.clientWidth, btn.clientHeight);
  const radius = diameter/2;
  circle.style.width = circle.style.height = diameter + 'px';
  circle.style.left = e.clientX - btn.offsetLeft - radius + 'px';
  circle.style.top  = e.clientY - btn.offsetTop  - radius + 'px';
  circle.classList.add('ripple');
  btn.appendChild(circle);
  setTimeout(()=>circle.remove(),600);
}
document.querySelectorAll('.om-btn').forEach(b=>b.addEventListener('click', addRipple));

async function loadUser(){
  const r = await fetch(SERVER+'/user/'+uid);
  window.user = await r.json();
  document.getElementById('balance').textContent = `Balance: ${user.balance.toFixed(2)} USDT`;
}
loadUser();

async function playFair(side){
  const bet = document.getElementById('bet').value;
  if(!bet||bet<=0) return alert('Enter bet');
  const clientSeed = prompt('Your seed (any text):', Math.random().toString(36).slice(2));
  const r1 = await fetch(SERVER+'/fair/coin',{
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({uid, bet:+bet, side, clientSeed})
  });
  const {hash, roundId} = await r1.json();
  alert(`Round hash: ${hash}\nPay the invoice…`);
  const r2 = await fetch(SERVER+'/play',{
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({uid, bet:+bet, side})
  });
  const pay = await r2.json();
  if(pay.invoiceUrl) tg.openLink(pay.invoiceUrl);
  else { document.getElementById('result').textContent = pay.msg; loadUser(); }
}

function openRef(){
  tg.openLink(`${window.location.origin}/ref.html?code=${window.user.refCode}`);
}