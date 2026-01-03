const SERVER = 'https://server-production-b3d5.up.railway.app';
const tg = Telegram.WebApp;
const uid = tg.initDataUnsafe.user.id;
const botUsername = 'SPINDBET_bot'; // Замените на вашего бота

tg.expand();

console.log('[SPIND BET Ref] Loaded, UID:', uid);

// Load referral data
async function loadRefData() {
    try {
        // Get user data
        const userResponse = await fetch(`${SERVER}/user/${uid}`);
        const userData = await userResponse.json();
        
        if (userData.success) {
            const refLink = `https://t.me/${botUsername}?start=${uid}`;
            document.getElementById('refLink').textContent = refLink;
        }
        
        // Get referral stats
        const statsResponse = await fetch(`${SERVER}/ref/stats/${uid}`);
        const statsData = await statsResponse.json();
        
        if (statsData.success) {
            const stats = statsData.stats;
            
            document.getElementById('directCount').textContent = stats.directCount;
            document.getElementById('level2Count').textContent = stats.level2Count;
            document.getElementById('totalEarned').textContent = `${stats.totalEarned.toFixed(2)} USDT`;
            document.getElementById('fromDeposits').textContent = `${(stats.directDeposits + stats.level2Deposits).toFixed(2)} USDT`;
            
            // Display referrals
            displayReferrals(stats.directRefs, stats.level2Refs);
        }
        
    } catch (error) {
        console.error('[SPIND BET] Load referral data error:', error);
        Telegram.WebApp.showAlert('❌ Failed to load referral data');
    }
}

// Display referrals
function displayReferrals(directRefs, level2Refs) {
    const refListEl = document.getElementById('refList');
    refListEl.innerHTML = '';
    
    if (directRefs.length === 0 && level2Refs.length === 0) {
        refListEl.innerHTML = `
            <div class="text-center text-purple-400 p-6">
                <p>No referrals yet. Share your link!</p>
            </div>
        `;
        return;
    }
    
    // Direct referrals
    if (directRefs.length > 0) {
        const directSection = document.createElement('div');
        directSection.className = 'bg-indigo-800/30 rounded-2xl p-4 border border-indigo-400/30';
        directSection.innerHTML = `
            <h3 class="text-indigo-300 font-bold mb-3">Direct Referrals (5%)</h3>
            <div class="space-y-2">
                ${directRefs.map(ref => `
                    <div class="flex justify-between text-sm">
                        <span class="text-indigo-400">User ${ref.uid}</span>
                        <span class="text-white">${ref.deposited.toFixed(2)} USDT</span>
                    </div>
                `).join('')}
            </div>
        `;
        refListEl.appendChild(directSection);
    }
    
    // Level 2 referrals
    if (level2Refs.length > 0) {
        const level2Section = document.createElement('div');
        level2Section.className = 'bg-purple-800/30 rounded-2xl p-4 border border-purple-400/30 mt-3';
        level2Section.innerHTML = `
            <h3 class="text-purple-300 font-bold mb-3">Level 2 Referrals (2%)</h3>
            <div class="space-y-2">
                ${level2Refs.map(ref => `
                    <div class="flex justify-between text-sm">
                        <span class="text-purple-400">User ${ref.uid}</span>
                        <span class="text-white">${ref.deposited.toFixed(2)} USDT</span>
                    </div>
                `).join('')}
            </div>
        `;
        refListEl.appendChild(level2Section);
    }
}

// Copy referral link
function copyRefLink() {
    const link = document.getElementById('refLink').textContent;
    
    if (navigator.share) {
        navigator.share({
            title: 'SPIND BET Referral',
            text: 'Join SPIND BET and get a bonus!',
            url: link
        });
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(link).then(() => {
            showNotification('✅ Link copied to clipboard!', 'success');
        });
    } else {
        Telegram.WebApp.showAlert('📋 ' + link);
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

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadRefData();
});
