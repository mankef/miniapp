const SERVER = 'https://server-production-b3d5.up.railway.app';
const tg = Telegram.WebApp;
const uid = tg.initDataUnsafe.user.id;

let currentRoundId = null;
let isSpinning = false;
let reelPositions = [0, 0, 0];

const SYMBOLS = ['🍒', '🍋', '🔔', '⭐', '💎'];
const canvas = document.getElementById('slot');
const ctx = canvas.getContext('2d');

console.log('[SPIND BET Slots] Loaded, UID:', uid);

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadBalance();
    drawFrame();
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

// Draw frame
function drawFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const reelWidth = canvas.width / 3;
    const cellHeight = canvas.height / 3;
    
    for (let reel = 0; reel < 3; reel++) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(reel * reelWidth, 0, reelWidth, canvas.height);
        ctx.clip();
        
        for (let row = -2; row <= 4; row++) {
            const yOffset = (row * cellHeight + reelPositions[reel]) % (cellHeight * SYMBOLS.length);
            const symbolIndex = Math.floor((row + reelPositions[reel] / cellHeight) % SYMBOLS.length);
            
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFD700';
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 15;
            
            ctx.fillText(
                SYMBOLS[(symbolIndex + SYMBOLS.length) % SYMBOLS.length],
                reel * reelWidth + reelWidth / 2,
                yOffset + cellHeight / 2 + 15
            );
        }
        
        ctx.restore();
    }
    
    // Draw win lines
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, cellHeight * 1.5);
    ctx.lineTo(canvas.width, cellHeight * 1.5);
    ctx.stroke();
    ctx.setLineDash([]);
    
    if (isSpinning) {
        requestAnimationFrame(drawFrame);
    }
}

// Start slots
async function startSlots() {
    if (isSpinning) return;
    
    const bet = parseFloat(document.getElementById('bet').value);
    if (!bet || bet < 0.01) {
        Telegram.WebApp.showAlert('💰 Enter a valid bet!');
        return;
    }
    
    const response = await fetch(`${SERVER}/user/${uid}`);
    const userData = await response.json();
    if (userData.balance < bet) {
        Telegram.WebApp.showAlert('💔 Insufficient balance!');
        return;
    }
    
    isSpinning = true;
    const spinBtn = document.getElementById('spinBtn');
    spinBtn.disabled = true;
    spinBtn.innerHTML = '<span class="anime-spinner inline-block mr-2"></span>SPINNING...';
    
    document.getElementById('resultSection').classList.add('hidden');
    
    try {
        // Start round
        const startResponse = await fetch(`${SERVER}/spin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, bet })
        });
        
        const startData = await startResponse.json();
        if (!startData.success) throw new Error(startData.error);
        
        currentRoundId = startData.roundId;
        document.getElementById('balance').textContent = `Balance: ${startData.balance.toFixed(2)} USDT 💎`;
        
        // Spin animation
        let speed = 25;
        const animate = () => {
            reelPositions = reelPositions.map((pos, i) => pos + speed + i * 5);
            speed -= 0.5;
            
            if (speed > 2) {
                requestAnimationFrame(animate);
            } else {
                stopReels();
            }
        };
        
        animate();
        drawFrame();
        
    } catch (error) {
        console.error('[SPIND BET] Slots error:', error);
        Telegram.WebApp.showAlert(`❌ ${error.message}`);
        resetSlots();
    }
}

// Stop reels
async function stopReels() {
    for (let reel = 0; reel < 3; reel++) {
        await new Promise(resolve => setTimeout(resolve, 500 + reel * 300));
        
        try {
            const clientSeed = Date.now().toString();
            const stopResponse = await fetch(`${SERVER}/stop?roundId=${currentRoundId}&reel=${reel}&clientSeed=${clientSeed}`);
            const stopData = await stopResponse.json();
            
            if (stopData.success) {
                reelPositions[reel] = stopData.stopRow[0] * (canvas.height / 3);
            }
        } catch (error) {
            console.error(`[SPIND BET] Stop reel ${reel} error:`, error);
        }
    }
    
    // Get result
    setTimeout(async () => {
        try {
            const resultResponse = await fetch(`${SERVER}/result?roundId=${currentRoundId}`);
            const resultData = await resultResponse.json();
            
            if (!resultData.success) throw new Error(resultData.error);
            
            document.getElementById('balance').textContent = `Balance: ${resultData.newBalance.toFixed(2)} USDT 💎`;
            showResult(resultData);
            
        } catch (error) {
            console.error('[SPIND BET] Result error:', error);
            Telegram.WebApp.showAlert('❌ Failed to get result');
        } finally {
            isSpinning = false;
        }
    }, 500);
}

// Show result
function showResult(data) {
    const resultSection = document.getElementById('resultSection');
    const resultTitle = document.getElementById('resultTitle');
    const resultDetails = document.getElementById('resultDetails');
    
    resultSection.classList.remove('hidden');
    
    if (data.win) {
        resultSection.className = 'w-full max-w-md mx-auto';
        resultTitle.innerHTML = '🎉 <span class="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">WINNER!</span>';
        resultDetails.innerHTML = `
            <div class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                +${data.winAmount.toFixed(2)} USDT
            </div>
            <div class="text-sm mt-2 text-purple-300">
                Multiplier: ${data.multiplier}x
            </div>
            <div class="text-xs mt-2 text-purple-400">
                Winning lines: ${data.winningLines.map(l => l.name).join(', ')}
            </div>
        `;
    } else {
        resultDetails.innerHTML = `
            <div class="text-lg text-gray-400">No win this time</div>
            <div class="text-sm mt-2 text-purple-300">Try again, Senpai!</div>
        `;
    }
    
    updateFairData(data.serverSeed);
    resultSection.scrollIntoView({ behavior: 'smooth' });
}

// Update fairness display
function updateFairData(serverSeed = 'Pending...') {
    document.getElementById('fairData').innerHTML = `
        Server Seed: ${serverSeed}<br>
        Hash: ${serverSeed !== 'Pending...' ? crypto.createHash('sha256').update(serverSeed).digest('hex') : 'Pending...'}<br>
        Verify: Use server + client seed to verify result
    `;
}

// Reset slots
function resetSlots() {
    currentRoundId = null;
    isSpinning = false;
    reelPositions = [0, 0, 0];
    
    drawFrame();
    
    document.getElementById('resultSection').classList.add('hidden');
    document.getElementById('spinBtn').disabled = false;
    document.getElementById('spinBtn').innerHTML = `
        <span class="flex items-center justify-center">
            <span class="mr-2">🎰</span>
            SPIN THE REELS!
        </span>
    `;
    
    loadBalance();
}

// Go back
function goBack() {
    window.location.href = 'index.html';
}
