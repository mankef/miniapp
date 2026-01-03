const SERVER = 'https://server-production-b3d5.up.railway.app';
const tg = Telegram.WebApp;
const uid = tg.initDataUnsafe.user.id;
let currentBalance = 0;

console.log('[WITHDRAW] Script loaded, UID:', uid);

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
        
        console.log('[WITHDRAW] Balance response:', result);
        
        if (result.success) {
            currentBalance = result.balance;
            document.getElementById('balance').textContent = `${currentBalance.toFixed(2)} USDT 💎`;
        } else {
            document.getElementById('balance').textContent = 'Error loading balance';
        }
    } catch (error) {
        console.error('[WITHDRAW] Load balance error:', error);
        document.getElementById('balance').textContent = 'Error';
        currentBalance = 0;
    }
}

// Validate amount
function validateWithdraw() {
    const amount = parseFloat(document.getElementById('amount').value);
    const validationEl = document.getElementById('validationMessage');
    const withdrawBtn = document.getElementById('withdrawBtn');
    
    if (!amount || amount <= 0) {
        validationEl.classList.add('hidden');
        withdrawBtn.disabled = true;
        return;
    }
    
    validationEl.classList.remove('hidden');
    
    if (amount < 0.2) {
        validationEl.textContent = '❌ Minimum withdrawal is 0.20 USDT';
        validationEl.className = 'mt-2 text-sm font-medium text-red-400';
        withdrawBtn.disabled = true;
    } else if (amount > 1000) {
        validationEl.textContent = '❌ Maximum withdrawal is 1000 USDT';
        validationEl.className = 'mt-2 text-sm font-medium text-red-400';
        withdrawBtn.disabled = true;
    } else if (amount > currentBalance) {
        validationEl.textContent = `❌ Insufficient balance (you have ${currentBalance.toFixed(2)} USDT)`;
        validationEl.className = 'mt-2 text-sm font-medium text-red-400';
        withdrawBtn.disabled = true;
    } else {
        validationEl.textContent = `✅ Available for withdrawal`;
        validationEl.className = 'mt-2 text-sm font-medium text-green-400';
        withdrawBtn.disabled = false;
    }
}

// Create withdrawal check
async function createWithdraw() {
    const amount = parseFloat(document.getElementById('amount').value);
    console.log(`[WITHDRAW] Creating check for ${amount} USDT...`);
    
    if (!amount || amount < 0.2) {
        Telegram.WebApp.showAlert('⚠️ Minimum withdrawal is 0.20 USDT');
        return;
    }
    
    if (amount > currentBalance) {
        Telegram.WebApp.showAlert('💔 Insufficient balance!');
        return;
    }
    
    const withdrawBtn = document.getElementById('withdrawBtn');
    withdrawBtn.disabled = true;
    withdrawBtn.innerHTML = '<span class="anime-spinner inline-block mr-2"></span>CREATING CHECK...';
    
    try {
        const response = await fetch(`${SERVER}/withdraw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, amount })
        });
        
        const result = await response.json();
        console.log('[WITHDRAW] Response:', result);
        
        if (!result.success) {
            throw new Error(result.error || 'Withdrawal failed');
        }
        
        // Показываем чек
        document.getElementById('checkLink').href = result.checkUrl;
        document.getElementById('checkStatus').textContent = `Amount: ${amount.toFixed(2)} USDT | New Balance: ${result.newBalance.toFixed(2)} USDT`;
        document.getElementById('checkSection').classList.remove('hidden');
        
        // Обновляем баланс
        currentBalance = result.newBalance;
        document.getElementById('balance').textContent = `${currentBalance.toFixed(2)} USDT 💎`;
        
        showNotification('✅ Withdrawal check created!', 'success');
        
    } catch (error) {
        console.error('[WITHDRAW ERROR]', error);
        Telegram.WebApp.showAlert(`❌ ${error.message}`);
        
        resetForm();
    } finally {
        resetForm();
    }
}

// Reset form
function resetForm() {
    const withdrawBtn = document.getElementById('withdrawBtn');
    withdrawBtn.disabled = false;
    withdrawBtn.innerHTML = `
        <span class="flex items-center justify-center">
            <span class="mr-2">📤</span>
            CREATE WITHDRAWAL CHECK
        </span>
    `;
}

// Go back
function goBack() {
    window.location.href = 'index.html';
}

// Notification
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
