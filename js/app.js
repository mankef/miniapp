const SERVER = 'https://server-production-b3d5.up.railway.app';
const tg = Telegram.WebApp;
const uid = tg.initDataUnsafe.user.id;
tg.expand();

// Ripple
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

// Игра с анимацией
async function playCoin(side){
  const bet = document.getElementById('bet').value;
  if(!bet||bet<=0) return alert('Enter bet');
  if(bet > window.user.balance) return alert('Insufficient balance');
  
  const clientSeed = prompt('Your seed:', Math.random().toString(36).slice(2));
  
  const coin = document.getElementById('coinAnimation');
  coin.classList.remove('hidden');
  coin.classList.add('spinning');
  
  const r = await fetch(SERVER+'/play/coin',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({uid, betAmount:+bet, side, clientSeed})
  });
  const {win, prize, newBalance, serverSeed, hash} = await r.json();
  
  setTimeout(()=>{
    coin.classList.add('hidden');
    coin.classList.remove('spinning');
    document.getElementById('result').innerHTML = `
      ${win ? '✅ WIN' : '❌ LOSS'} ${prize} USDT<br>
      Balance: ${newBalance} USDT<br>
      <small>Hash: ${hash.slice(0,16)}...</small><br>
      <button onclick="verify('${serverSeed}','${clientSeed}','${hash}')" class="om-btn mt-2">Verify</button>
    `;
    loadUser();
  }, 2000);
}

function verify(serverSeed, clientSeed, hash) {
  alert(`Server Seed: ${serverSeed}\nClient Seed: ${clientSeed}\nHash: ${hash}\n\nSHA256(serverSeed) should match hash.`);
}
