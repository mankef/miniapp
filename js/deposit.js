const SERVER = 'https://server-production-b3d5.up.railway.app';
const tg = Telegram.WebApp;
const uid = tg.initDataUnsafe.user.id;
let currentInvoiceId = '';

console.log('[SPIND BET Deposit] Script loaded, UID:', uid);

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    Telegram.WebApp.ready();
    await loadBalance();
});

// Load balance
async function loadBalance() {
    try {
        const response = await fetch(`${SERVER}/user/${uid}`);
        const result = await response.json();
        
        if (result.success === false) {
            throw new Error(result.error);
        }
        
        const balance = typeof result.balance === 'number' ? result.balance : 0;
        const balanceEl = document.getElementById('balance');
        if (balanceEl) {
            balanceEl.textContent = `Balance: ${balance.toFixed(2)} USDT 💎`;
        }
        
        window.user = result;
    } catch (error) {
        console.error('[SPIND BET] Load balance error:', error);
        const balanceEl = document.getElementById('balance');
        if (balanceEl) {
            balanceEl.textContent = 'Balance: 0.00 USDT 💎';
        }
    }
}

// Create deposit
async function createDeposit() {
    const amount = parseFloat(document.getElementById('amount').value);
    
    console.log('[SPIND BET] Creating deposit, amount:', amount);
    
    if (!amount || amount < 0.01) {
        Telegram.WebApp.showAlert('⚠️ Minimum deposit is 0.01 USDT');
        return;
    }
    
    const button = event.target;
    button.disabled = true;
    button.innerHTML = '<span class="anime-spinner inline-block mr-2"></span>CREATING...';
    
    try {
        const response = await fetch(`${SERVER}/deposit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, amount, refCode: null })
        });
        
        const result = await response.json();
        console.log('[SPIND BET] Deposit response:', result);
        
        if (!result.success) {
            throw new Error(result.error || 'Invoice creation failed');
        }
        
        currentInvoiceId = result.invoiceId;
        document.getElementById('payLink').href = result.invoiceUrl;
        document.getElementById('invoiceSection').classList.remove('hidden');
        document.getElementById('status').textContent = '';
        
        document.getElementById('invoiceSection').scrollIntoView({ behavior: 'smooth' });
        
        showNotification('✅ Invoice created! Click to pay', 'success');
        
    } catch (error) {
        console.error('[SPIND BET] Create deposit error:', error);
        Telegram.WebApp.showAlert(`❌ ${error.message}`);
    } finally {
        button.disabled = false;
        button.innerHTML = `
            <span class="flex items-center justify-center">
                <span class="mr-2">💎</span>
                CREATE DEPOSIT
            </span>
        `;
    }
}

// Check payment
async function checkPayment() {
    if (!currentInvoiceId) {
        Telegram.WebApp.showAlert('⚠️ No active invoice');
        return;
    }
    
    const statusEl = document.getElementById('status');
    statusEl.textContent = '⏳ Checking payment...';
    statusEl.className = 'mt-4 text-center text-sm font-medium text-yellow-400';
    
    try {
        const response = await fetch(`${SERVER}/check-deposit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invoiceId: currentInvoiceId })
        });
        
        const result = await response.json();
        console.log('[SPIND BET] Check payment response:', result);
        
        if (!result.success) {
            throw new Error(result.error || 'Check failed');
        }
        
        if (result.status === 'paid') {
            statusEl.innerHTML = `✅ <strong>Deposited: ${result.amount} USDT</strong><br>New Balance: ${result.newBalance?.toFixed(2)} USDT`;
            statusEl.className = 'mt-4 text-center text-sm font-medium text-green-400';
            
            showNotification('💰 Deposit confirmed!', 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
        } else if (result.status === 'expired') {
            statusEl.textContent = '❌ Invoice expired. Create new one.';
            statusEl.className = 'mt-4 text-center text-sm font-medium text-red-400';
        } else {
            statusEl.textContent = `⏳ Status: ${result.status}. Please pay and check again.`;
            statusEl.className = 'mt-4 text-center text-sm font-medium text-yellow-400';
        }
        
    } catch (error) {
        console.error('[SPIND BET] Check payment error:', error);
        statusEl.textContent = `❌ Error: ${error.message}`;
        statusEl.className = 'mt-4 text-center text-sm font-medium text-red-400';
    }
}

// Calculate bonus
function calculateBonus() {
    const amount = parseFloat(document.getElementById('amount').value);
    const bonusEl = document.getElementById('bonusCalc');
    
    if (amount > 0) {
        bonusEl.classList.remove('hidden');
        document.getElementById('depositAmount').textContent = `${amount.toFixed(2)} USDT`;
        document.getElementById('bonusAmount').textContent = `${(amount * 0.05).toFixed(2)} USDT`;
    } else {
        bonusEl.classList.add('hidden');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-2xl anime-notification ${
        type === 'error' ? 'bg-red-500' : 'bg-green-500'
    } text-white font-bold shadow-2xl`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}
