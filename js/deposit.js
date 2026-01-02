const SERVER = 'https://server-production-b3d5.up.railway.app';
const tg = Telegram.WebApp;
const uid = tg.initDataUnsafe.user.id;
let currentInvoiceId = '';

async function createDeposit() {
  const amount = document.getElementById('amount').value;
  if (!amount || amount <= 0) return alert('Enter amount');
  
  const r = await fetch(SERVER+'/deposit', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({uid, amount: +amount, refCode: null})
  });
  const data = await r.json();
  
  if (data.error) return alert(data.error);
  
  currentInvoiceId = data.invoiceId;
  document.getElementById('payLink').href = data.invoiceUrl;
  document.getElementById('invoiceSection').classList.remove('hidden');
  document.getElementById('status').textContent = '';
}

async function checkPayment() {
  if (!currentInvoiceId) return alert('No active invoice');
  
  const r = await fetch(SERVER+'/check-deposit', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({invoiceId: currentInvoiceId})
  });
  const data = await r.json();
  
  if (data.error) {
    document.getElementById('status').textContent = `❌ ${data.error}`;
  } else if (data.status === 'paid') {
    document.getElementById('status').textContent = `✅ Deposited: ${data.amount} USDT. Balance: ${data.newBalance}`;
    setTimeout(() => window.location = 'index.html', 2000);
  } else {
    document.getElementById('status').textContent = `⏳ Status: ${data.status}. Please pay and try again.`;
  }
}
