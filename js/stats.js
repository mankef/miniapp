const SERVER = 'https://server-production-b3d5.up.railway.app';
const tg = Telegram.WebApp;
const uid = tg.initDataUnsafe.user.id;
tg.expand();

console.log('[SPIND BET Stats] Loaded, UID:', uid);

// Load stats
async function loadStats() {
    try {
        // Global stats
        const globalResponse = await fetch(`${SERVER}/stats/global`);
        const globalData = await globalResponse.json();
        
        if (globalData.success) {
            const stats = globalData.stats;
            document.getElementById('globalUsers').textContent = stats.users.total || 0;
            document.getElementById('globalDeposits').textContent = `${stats.financial.totalDeposited.toFixed(2)} USDT`;
            document.getElementById('globalWithdraws').textContent = `${stats.financial.totalWithdrawn.toFixed(2)} USDT`;
            document.getElementById('globalProfit').textContent = `${stats.financial.houseProfit.toFixed(2)} USDT`;
        }
        
        // User stats
        const userResponse = await fetch(`${SERVER}/stats/user/${uid}`);
        const userData = await userResponse.json();
        
        if (userData.success) {
            const stats = userData.stats;
            document.getElementById('userBalance').textContent = `${stats.balance.toFixed(2)} USDT`;
            document.getElementById('userWagered').textContent = `${stats.totalWagered.toFixed(2)} USDT`;
            document.getElementById('userWins').textContent = `${stats.totalWins.toFixed(2)} USDT`;
            document.getElementById('userGames').textContent = stats.totalGames || 0;
        }
        
        // Referral stats
        const refResponse = await fetch(`${SERVER}/ref/stats/${uid}`);
        const refData = await refResponse.json();
        
        if (refData.success) {
            const stats = refData.stats;
            document.getElementById('directRefs').textContent = stats.directCount;
            document.getElementById('level2Refs').textContent = stats.level2Count;
            document.getElementById('refEarned').textContent = `${stats.totalEarned.toFixed(2)} USDT`;
            document.getElementById('refDeposits').textContent = `${(stats.directDeposits + stats.level2Deposits).toFixed(2)} USDT`;
        }
        
    } catch (error) {
        console.error('[SPIND BET] Load stats error:', error);
        Telegram.WebApp.showAlert('❌ Failed to load statistics');
    }
}

// Go back
function goBack() {
    window.location.href = 'index.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('username').textContent = `User ID: ${uid}`;
    await loadStats();
});
