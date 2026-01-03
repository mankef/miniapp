// SPIND BET Casino App
const SERVER = 'https://server-production-b3d5.up.railway.app';
const tg = Telegram.WebApp;
const uid = tg.initDataUnsafe.user.id;
tg.expand();

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
        const response = await fetch(`${SERVER}/user/${uid}`, {
            method: 'GET',
            headers: {
                'X-Bot-Token': tg.initData  // Auth header
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success === false) {
            throw new Error(result.error || 'Failed to load user');
        }
        
        window.user = result;
        
        // Animate balance update
        animateBalance(result.balance);
        
        return result;
    } catch (error) {
        console.error('[SPIND BET] Load user error:', error);
        document.getElementById('balance').textContent = '❌ Error';
        throw error;
    }
}

// Animate balance
function animateBalance(newBalance) {
    const balanceEl = document.getElementById('balance');
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
        type === 'error' ? 'bg-red-500' : 'bg-purple-500'
    } text-white font-bold shadow-2xl`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Show coming soon
function showComingSoon() {
    Telegram.WebApp.showAlert('✨ This feature is coming soon, Senpai! 🌸\n\nStay tuned for updates!');
}
