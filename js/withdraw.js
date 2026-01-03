const SERVER = 'https://server-production-b3d5.up.railway.app';
const tg = Telegram.WebApp;
const uid = tg.initDataUnsafe.user.id;

let currentBalance = 0;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadBalance();
        Telegram.WebApp.ready();
    } catch (error) {
        console.error('[SPIND BET] Withdraw init error:', error);
        showNotification('❌ Failed to load balance', 'error');
    }
});

// Load balance
async function loadBalance() {
    try {
        const response = await fetch(`${SERVER}/user/${uid}`);
        const result = await response.json();
        
        if (result.success === false) {
            throw new Error(result.error || 'Failed to load balance');
        }
        
        currentBalance = result.balance;
        document.getElementById('balance').textContent = 
            `Balance: ${currentBalance.toFixed(2)} USDT 💎`;
        
    } catch (error) {
        console.error('[SPIND BET] Load balance error:', error);
        document.getElementById('balance').textContent = '❌ Error loading balance';
        throw error;
    }
}

// Validate withdrawal amount
function validateWithdraw() {
    const input = document.getElementById('amount');
    const validationEl = document.getElementById('validationMessage');
    const amount = parseFloat(input.value);
    
    if (!amount || amount <= 0) {
        validationEl.classList.add('hidden');
        document.getElementById('withdrawBtn').disabled = true;
        return;
    }
    
    validationEl.classList.remove('hidden');
    
    if (amount < 0.2) {
        validationEl.textContent = '❌ Minimum withdrawal is 0.20 USDT';
        validationEl.className = 'mt-2 text-sm font-medium text-red-400';
        document.getElementById('withdrawBtn').disabled = true;
    } else if (amount > 1000) {
        validationEl.textContent = '❌ Maximum withdrawal is 1000 USDT';
        validationEl.className = 'mt-2 text-sm font-medium text-red-400';
        document.getElementById('withdrawBtn').disabled = true;
    } else if (amount > currentBalance) {
        validationEl.textContent = `❌ Insufficient balance (you have ${currentBalance.toFixed(2)} USDT)`;
        validationEl.className = 'mt-2 text-sm font-medium text-red-400';
        document.getElementById('withdrawBtn').disabled = true;
    } else {
        validationEl.textContent = `✅ Available for withdrawal`;
        validationEl.className = 'mt-2 text-sm font-medium text-green-400';
        document.getElementById('withdrawBtn').disabled = false;
    }
}

// Create withdrawal check
async function createWithdraw() {
    const amount = parseFloat(document.getElementById('amount').value);
    
    // Final validation
    if (!amount || amount < 0.2) {
        Telegram.WebApp.showAlert('⚠️ Minimum withdrawal is 0.20 USDT');
        return;
    }
    
    if (amount > currentBalance) {
        Telegram.WebApp.showAlert('💔 Insufficient balance, Senpai!');
        return;
    }
    
    const withdrawBtn = document.getElementById('withdrawBtn');
    withdrawBtn.disabled = true;
    withdrawBtn.innerHTML = `
        <span class="anime-spinner inline-block mr-2"></span>
        CREATING CHECK...
    `;
    
    try {
        const response = await fetch(`${SERVER}/withdraw`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Bot-Token': tg.initData
            },
            body: JSON.stringify({ uid, amount })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Withdrawal failed');
        }
        
        // Show success
        document.getElementById('checkLink').href = result.checkUrl;
        document.getElementById('checkStatus').textContent = 
            `Amount: ${amount.toFixed(2)} USDT | New Balance: ${result.newBalance.toFixed(2)} USDT`;
        
        document.getElementById('checkSection').classList.remove('hidden');
        document.getElementById('winSection')?.classList.add('hidden');
        
        // Update balance
        currentBalance = result.newBalance;
        document.getElementById('balance').textContent = 
            `Balance: ${currentBalance.toFixed(2)} USDT 💎`;
        
        showNotification('✅ Withdrawal check created!', 'success');
        
    } catch (error) {
        console.error('[SPIND BET] Withdraw error:', error);
        Telegram.WebApp.showAlert(`❌ ${error.message}`);
        
        withdrawBtn.disabled = false;
        withdrawBtn.innerHTML = `
            <span class="flex items-center justify-center">
                <span class="mr-2">📤</span>
                CREATE WITHDRAWAL CHECK
            </span>
        `;
    }
}

// Go back
function goBack() {
    window.location.href = 'index.html';
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
