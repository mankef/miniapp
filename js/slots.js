const SERVER = 'https://your-server.railway.app';
const tg = Telegram.WebApp;
const uid = tg.initDataUnsafe.user.id;
const canvas = document.getElementById('slot');
const ctx = canvas.getContext('2d');
const reels = 3, rows = 3, symGold = ['🍒','🍋','🔔','BAR','💰'];
const PAYTABLE = {'💰-💰-💰':50,'BAR-BAR-BAR':15,'🔔-🔔-🔔':8,'🍋-🍋-🍋':4,'🍒-🍒-🍒':2};
let spin = false, result = [], reelPos = [0,0,0], shine = 0;

function drawReel(reel, yOffset){
  const w = canvas.width/reels, h = canvas.height/rows, cellH = h;
  ctx.save();
  ctx.beginPath(); ctx.rect(reel*w, 0, w, canvas.height); ctx.clip();
  for(let row=-1; row<=4; row++){
    const sy = (row*h + yOffset) % (cellH*symGold.length);
    const idx = Math.floor((row*h + yOffset)/cellH) % symGold.length;
    if(idx<0) idx += symGold.length;
    ctx.font='50px serif'; ctx.textAlign='center'; ctx.fillStyle='#FFD700';
    ctx.fillText(symGold[idx], reel*w + w/2, sy + cellH/2 + 15);
  }
  ctx.restore();
}
function drawFrame(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  reelPos.forEach((p,i)=>drawReel(i, p));
  if(shine>0){ ctx.globalAlpha = shine; ctx.fillStyle='rgba(255,215,0,.3)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.globalAlpha=1; shine-=0.02; }
  if(spin) requestAnimationFrame(drawFrame);
}

async function loadUser(){ const r = await fetch(SERVER+'/user/'+uid); window.user = await r.json(); document.getElementById('balance').textContent = `Balance: ${user.balance.toFixed(2)} USDT`; }
loadUser();

async function startSlots(){
  if(spin) return;
  const bet = document.getElementById('bet').value;
  if(!bet||bet<=0) return alert('Enter bet');
  spin = true;
  const r = await fetch(SERVER+'/slots/spin',{
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({uid, bet:+bet})
  });
  const {invoiceUrl, roundId} = await r.json();
  if(invoiceUrl){ tg.openLink(invoiceUrl); spin=false; return; }
  let spd = 15;
  const anim = ()=>{
    reelPos = reelPos.map((p,i)=> p + spd + i*2);
    drawFrame();
    if(spd>2) spd -= 0.2;
    else { cancelAnimationFrame(anim); stopReels(roundId); }
    if(spin) requestAnimationFrame(anim);
  };
  anim();
}
async function stopReels(roundId){
  for(let reel=0;reel<reels;reel++){
    await new Promise(res=>setTimeout(res,400));
    const r = await fetch(SERVER+'/slots/stop?roundId='+roundId+'&reel='+reel);
    const {stopRow} = await r.json();
    for(let row=0;row<rows;row++) result[row*reels + reel] = stopRow[row];
    const cellH = canvas.height/rows; reelPos[reel] = -stopRow[0]*cellH;
    shine = 1;
  }
  spin=false;
  const winR = await fetch(SERVER+'/slots/win?roundId='+roundId);
  const {win, multi} = await winR.json();
  document.getElementById('win').textContent = win ? `💰 WIN ${multi}x !` : 'No win';
  loadUser();
}