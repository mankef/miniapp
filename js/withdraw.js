const SERVER = 'https://server-production-b3d5.up.railway.app';
const tg = Telegram.WebApp;
const uid = tg.initDataUnsafe.user.id;

async function loadBalance() {
  const r = await fetch(SERVER+'/user/'+uid);
  const user = await r.json();
  document.getElementById('balance').textContent = `Balance: ${user.balance.toFixed(2)} USDT`;
}
loadBalance();

async function createWithdraw() {
  const amount = parseFloat(document.getElementById('amount').value);
  
  // ВАЛИДАЦИЯ МИНИМУМА 0.2 USDT
  if (!amount || amount < 0.2) {
    return alert('Minimum withdrawal is 0.20 USDT');
  }
  
  const r = await fetch(SERVER+'/withdraw', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({uid, amount})
  });
  const data = await r.json();
  
  if (data.error) {
    alert(data.error);
  } else {
    // ✅ ОТКРЫВАЕМ ЧЕК В TELEGRAM
    document.getElementById('checkLink').href = data.checkLink;
    document.getElementById('withdrawSection').classList.remove('hidden');
    document.getElementById('status').textContent = `✅ Check created: ${amount} USDT`;
    loadBalance();
  }
}
