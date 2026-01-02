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
  const amount = document.getElementById('amount').value;
  if (!amount || amount <= 0) return alert('Enter amount');
  
  const r = await fetch(SERVER+'/withdraw', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({uid, amount: +amount})
  });
  const data = await r.json();
  
  if (data.error) {
    alert(data.error);
  } else {
    document.getElementById('checkLink').href = data.checkUrl;
    document.getElementById('withdrawSection').classList.remove('hidden');
    document.getElementById('status').textContent = `✅ Withdrawal: ${amount} USDT`;
    loadBalance();
  }
}
