const SERVER = 'https://server-production-b3d5.up.railway.app';
const tg = Telegram.WebApp;
const uid = tg.initDataUnsafe.user.id;

if (!uid) {
    console.error('[SPIND BET] No user ID found!');
    Telegram.WebApp.showAlert('❌ Authentication error. Please open via Telegram.');
}

tg.expand();
console.log('[SPIND BET] App loaded, UID:', uid);

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadUser();
        animateCards();
    } catch (error) {
        console.error('[SPIND BET] Init error:', error);
        showNotification('❌ Failed to load data', 'error');
    }
});

// Load user data
async function loadUser() {
    try {
        console.log('[SPIND BET] Loading user data...');
        
        const response = await fetch(`${SERVER}/user/${uid}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        console.log('[SPIND BET] User response:', result);
        
        if (result.success === false) {
            throw new Error(result.error || 'Failed to load user');
        }
        
        if (typeof result.balance !== 'number' || isNaN(result.balance)) {
            console.warn('[SPIND BET] Invalid balance type:', typeof result.balance);
            result.balance = 0;
        }
        
        window.user = result;
        
        const balanceEl = document.getElementById('balance');
        if (balanceEl) {
            balanceEl.textContent = `Balance: ${result.balance.toFixed(2)} USDT 💎`;
        } else {
            console.error('[SPIND BET] Balance element not found');
        }
        
        return result;
    } catch (error) {
        console.error('[SPIND BET] Load user error:', error);
        window.user = { balance: 0, refEarn: 0 };
        
        const balanceEl = document.getElementById('balance');
        if (balanceEl) {
            balanceEl.textContent = 'Balance: 0.00 USDT 💎';
        }
        
        throw error;
    }
}

// Animate balance
function animateBalance(newBalance) {
    const balanceEl = document.getElementById('balance');
    if (!balanceEl) return;
    
    const current = parseFloat(balanceEl.textContent.match(/[\d.]+/)?.[0] || '0');
    const target = parseFloat(newBalance);
    const duration = 1000;
    const start = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        const value = current + (target - current) * progress;
        
        balanceEl.textContent = `Balance: ${value.toFixed(2)} USDT 💎`;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Animate cards on load
function animateCards() {
    const cards = document.querySelectorAll('.anime-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
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

// Open support
function openSupport() {
    Telegram.WebApp.openLink('https://t.me/YourSupportUsername');
}

function showComingSoon() {
    Telegram.WebApp.showAlert('✨ Coming soon, Senpai! 🌸\n\nStay tuned for updates!');
}
