const SERVER = 'https://your-server.railway.app';
const tg = Telegram.WebApp;
const uid = tg.initDataUnsafe.user.id;
let currentInvoiceId = '';

async function createDeposit() {
  const amount = document.getElementById('amount').value;
  if (!amount || amount <= 0) return alert('Enter amount');
  
  const refCode = null; // можно передать если есть
  
  const r = await fetch(SERVER+'/deposit', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({uid, amount: +amount, refCode})
  });
  const {invoiceUrl, invoiceId} = await r.json();
  
  currentInvoiceId = invoiceId;
  
  document.getElementById('payLink').href = invoiceUrl;
  document.getElementById('invoiceSection').classList.remove('hidden');
  document.getElementById('status').textContent = '';
}

async function checkPayment() {
  if (!currentInvoiceId) return alert('No active invoice');
  
  const r = await fetch(SERVER+'/check-payment', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({invoiceId: currentInvoiceId})
  });
  const {status, amount} = await r.json();
  
  if (status === 'paid') {
    document.getElementById('status').textContent = `✅ Deposit confirmed: ${amount} USDT`;
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
  } else {
    document.getElementById('status').textContent = `❌ Not paid yet. Status: ${status}`;
  }
}
