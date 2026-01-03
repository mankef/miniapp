const SERVER = 'https://server-production-b3d5.up.railway.app';
const tg = Telegram.WebApp;
const uid = tg.initDataUnsafe.user.id;
tg.expand();

let currentGameId = null;
let currentChoice = null;
let isFlipping = false;

console.log('[SPIND BET Coinflip] Loaded, UID:', uid);

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadBalance();
    updateFairData();
});

// Load balance
async function loadBalance() {
    try {
        const response = await fetch(`${SERVER}/user/${uid}`);
        const result = await response.json();
        
        if (result.success === false) throw new Error(result.error);
        
        const balanceEl = document.getElementById('balance');
        if (balanceEl) {
            balanceEl.textContent = `Balance: ${result.balance.toFixed(2)} USDT 💎`;
        }
    } catch (error) {
        console.error('[SPIND BET] Load balance error:', error);
    }
}

// Select choice
function selectChoice(choice) {
    if (isFlipping) return;
    
    currentChoice = choice;
    
    document.getElementById('headsBtn').classList.remove('ring-4');
    document.getElementById('tailsBtn').classList.remove('ring-4');
    document.getElementById(choice + 'Btn').classList.add('ring-4', 'ring-white');
    
    document.getElementById('status').textContent = `You chose ${choice.toUpperCase()}!`;
}

// Start coinflip
async function startCoinflip() {
    if (isFlipping) return;
    if (!currentChoice) {
        Telegram.WebApp.showAlert('🎯 Choose HEADS or TAILS first!');
        return;
    }
    
    const bet = parseFloat(document.getElementById('bet').value);
    if (!bet || bet < 0.01) {
        Telegram.WebApp.showAlert('💰 Enter a valid bet amount!');
        return;
    }
    
    const response = await fetch(`${SERVER}/user/${uid}`);
    const userData = await response.json();
    if (userData.balance < bet) {
        Telegram.WebApp.showAlert('💔 Insufficient balance!');
        return;
    }
    
    isFlipping = true;
    const flipBtn = document.getElementById('flipBtn');
    flipBtn.disabled = true;
    flipBtn.innerHTML = '<span class="anime-spinner inline-block mr-2"></span>FLIPPING...';
    
    document.getElementById('headsBtn').disabled = true;
    document.getElementById('tailsBtn').disabled = true;
    
    try {
        // Start game
        const startResponse = await fetch(`${SERVER}/coinflip/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, bet, choice: currentChoice })
        });
        
        const startData = await startResponse.json();
        if (!startData.success) throw new Error(startData.error);
        
        currentGameId = startData.gameId;
        document.getElementById('balance').textContent = `Balance: ${startData.balance.toFixed(2)} USDT 💎`;
        
        // Flip coin
        const clientSeed = Date.now().toString();
        
        const flipResponse = await fetch(`${SERVER}/coinflip/flip?gameId=${currentGameId}&clientSeed=${clientSeed}`);
        const flipData = await flipResponse.json();
        if (!flipData.success) throw new Error(flipData.error);
        
        // Animate coin
        animateCoin(flipData.heads);
        
        // Settle
        setTimeout(async () => {
            const settleResponse = await fetch(`${SERVER}/coinflip/settle?gameId=${currentGameId}`);
            const settleData = await settleResponse.json();
            
            if (!settleData.success) throw new Error(settleData.error);
            
            document.getElementById('balance').textContent = `Balance: ${settleData.newBalance.toFixed(2)} USDT 💎`;
            
            showResult(settleData.win, settleData.winAmount, settleData.outcome, flipData.serverSeed);
        }, 2000);
        
    } catch (error) {
        console.error('[SPIND BET] Coinflip error:', error);
        Telegram.WebApp.showAlert(`❌ ${error.message}`);
        resetGame();
    }
}

// Animate coin
function animateCoin(isHeads) {
    const coin = document.getElementById('coin');
    coin.style.transition = 'transform 2s cubic-bezier(0.4, 0, 0.2, 1)';
    
    const flips = 10 + Math.floor(Math.random() * 5);
    const finalRotation = flips * 1800 + (isHeads ? 0 : 180);
    
    coin.style.transform = `rotateY(${finalRotation}deg)`;
    
    document.getElementById('status').textContent = isHeads ? 'HEADS!' : 'TAILS!';
}

// Show result
function showResult(win, winAmount, outcome, serverSeed) {
    const resultSection = document.getElementById('resultSection');
    const resultTitle = document.getElementById('resultTitle');
    const resultDetails = document.getElementById('resultDetails');
    
    resultSection.classList.remove('hidden');
    
    if (win) {
        resultSection.className = 'w-full max-w-md mx-auto';
        resultTitle.innerHTML = '🎉 <span class="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">YOU WIN!</span>';
        resultDetails.innerHTML = `
            <div class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                +${winAmount.toFixed(2)} USDT
            </div>
            <div class="text-sm mt-2 text-yellow-300">
                You chose ${currentChoice.toUpperCase()}, got ${outcome.toUpperCase()}
            </div>
        `;
    } else {
        resultSection.className = 'w-full max-w-md mx-auto';
        resultTitle.innerHTML = '💔 <span class="text-gray-300">You Lose</span>';
        resultDetails.innerHTML = `
            <div class="text-lg text-gray-400">
                Better luck next time, Senpai!
            </div>
            <div class="text-sm mt-2 text-purple-300">
                You chose ${currentChoice.toUpperCase()}, got ${outcome.toUpperCase()}
            </div>
        `;
    }
    
    updateFairData(serverSeed);
    resultSection.scrollIntoView({ behavior: 'smooth' });
    
    isFlipping = false;
}

// Reset game
function resetGame() {
    currentGameId = null;
    currentChoice = null;
    isFlipping = false;
    
    document.getElementById('coin').style.transform = 'rotateY(0deg)';
    document.getElementById('status').textContent = 'Choose your side, Senpai!';
    document.getElementById('resultSection').classList.add('hidden');
    
    document.getElementById('headsBtn').disabled = false;
    document.getElementById('tailsBtn').disabled = false;
    document.getElementById('flipBtn').disabled = false;
    document.getElementById('flipBtn').innerHTML = `
        <span class="flex items-center justify-center">
            <span class="mr-2">🪙</span>
            FLIP THE COIN!
        </span>
    `;
    
    document.getElementById('headsBtn').classList.remove('ring-4', 'ring-white');
    document.getElementById('tailsBtn').classList.remove('ring-4', 'ring-white');
    
    loadBalance();
}

// Update fairness data
function updateFairData(serverSeed = 'Pending...') {
    document.getElementById('fairData').innerHTML = `
        Server Hash: ${serverSeed !== 'Pending...' ? crypto.createHash('sha256').update(serverSeed).digest('hex') : 'Pending...'}<br>
        Client Seed: Generated on flip<br>
        Verify: ${serverSeed !== 'Pending...' ? 'Use server + client seed to verify result' : 'Flip to see verification data'}
    `;
}

// Go back
function goBack() {
    window.location.href = 'index.html';
}
