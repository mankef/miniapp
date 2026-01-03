const SERVER = 'https://server-production-b3d5.up.railway.app';
const tg = Telegram.WebApp;
const uid = tg.initDataUnsafe.user.id;
const canvas = document.getElementById('slot');
const ctx = canvas.getContext('2d');
const reelsCount = 3, rowsCount = 3;
const SYMBOLS = ['🍒', '🍋', '🔔', 'BAR', '💎'];
let isSpinning = false, reelPositions = [0, 0, 0], shine = 0;

// Animation loop
function drawFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const reelWidth = canvas.width / reelsCount;
    const cellHeight = canvas.height / rowsCount;
    
    // Draw reels
    for (let reel = 0; reel < reelsCount; reel++) {
        ctx.save();
        
        // Clip reel area
        ctx.beginPath();
        ctx.rect(reel * reelWidth, 0, reelWidth, canvas.height);
        ctx.clip();
        
        // Draw symbols
        for (let row = -1; row <= 4; row++) {
            const yOffset = (row * cellHeight + reelPositions[reel]) % (cellHeight * SYMBOLS.length);
            const symbolIndex = Math.floor((row + reelPositions[reel] / cellHeight) % SYMBOLS.length);
            
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFD700';
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 10;
            ctx.fillText(
                SYMBOLS[(symbolIndex + SYMBOLS.length) % SYMBOLS.length],
                reel * reelWidth + reelWidth / 2,
                yOffset + cellHeight / 2 + 15
            );
        }
        
        ctx.restore();
    }
    
    // Draw shine effect
    if (shine > 0) {
        ctx.globalAlpha = shine;
        ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        shine -= 0.02;
    }
    
    if (isSpinning) {
        requestAnimationFrame(drawFrame);
    }
}

// Start spinning
async function startSlots() {
    if (isSpinning) return;
    
    const bet = parseFloat(document.getElementById('bet').value);
    
    // Validation
    if (!bet || bet <= 0) {
        Telegram.WebApp.showAlert('⚠️ Please enter a valid bet amount!');
        return;
    }
    
    if (bet > window.user.balance) {
        Telegram.WebApp.showAlert('💔 Insufficient balance, Senpai!');
        return;
    }
    
    // Hide previous win
    document.getElementById('winSection').classList.add('hidden');
    
    isSpinning = true;
    const spinBtn = document.getElementById('spinBtn');
    spinBtn.disabled = true;
    spinBtn.innerHTML = '<span class="anime-spinner inline-block mr-2"></span>SPINNING...';
    
    try {
        // Start round
        const response = await fetch(`${SERVER}/slots/spin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, bet })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to start spin');
        }
        
        // Animate reels
        let speed = 20;
        const animate = () => {
            reelPositions = reelPositions.map((pos, i) => pos + speed + i * 3);
            speed -= 0.3;
            
            if (speed > 2) {
                requestAnimationFrame(animate);
            } else {
                stopReels(result.roundId, bet);
            }
        };
        
        animate();
        drawFrame();
        
    } catch (error) {
        console.error('[SPIND BET] Spin error:', error);
        Telegram.WebApp.showAlert('❌ Spin failed. Try again!');
        resetSpinButton();
    }
}

// Stop reels one by one
async function stopReels(roundId, bet) {
    for (let reel = 0; reel < 3; reel++) {
        await new Promise(resolve => setTimeout(resolve, 500 + reel * 200));
        
        try {
            const response = await fetch(
                `${SERVER}/slots/stop?roundId=${roundId}&reel=${reel}`
            );
            const result = await response.json();
            
            if (result.success) {
                // Snap to position
                reelPositions[reel] = result.stopRow[0] * (canvas.height / 3);
            }
        } catch (error) {
            console.error(`[SPIND BET] Stop reel ${reel} error:`, error);
        }
    }
    
    // Calculate win
    await calculateWin(roundId, bet);
}

// Calculate and show win
async function calculateWin(roundId, bet) {
    try {
        const response = await fetch(`${SERVER}/slots/win?roundId=${roundId}`);
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to calculate win');
        }
        
        // Show win animation
        if (result.win) {
            shine = 1;
            document.getElementById('winTitle').textContent = '🎉 JACKPOT! 🎉';
            document.getElementById('winDetails').innerHTML = `
                <div class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                    +${result.winAmount.toFixed(2)} USDT
                </div>
                <div class="text-sm mt-1">
                    Multiplier: ${result.multiplier}x
                </div>
                <div class="text-xs mt-2 text-purple-300">
                    Lines: ${result.winningLines.map(l => `Line ${l.line} (${l.multiplier}x)`).join(', ')}
                </div>
            `;
        } else {
            document.getElementById('winTitle').textContent = '💔 Try Again';
            document.getElementById('winDetails').innerHTML = `
                <div class="text-lg">No win this time, Senpai!</div>
                <div class="text-sm mt-1 text-purple-300">Better luck next spin! 🌸</div>
            `;
        }
        
        document.getElementById('winSection').classList.remove('hidden');
        
        // Update balance
        animateBalance(result.newBalance);
        window.user.balance = result.newBalance;
        
    } catch (error) {
        console.error('[SPIND BET] Calculate win error:', error);
        Telegram.WebApp.showAlert('❌ Failed to calculate win');
    } finally {
        resetSpinButton();
        isSpinning = false;
    }
}

// Reset button
function resetSpinButton() {
    const spinBtn = document.getElementById('spinBtn');
    spinBtn.disabled = false;
    spinBtn.innerHTML = `
        <span class="flex items-center justify-center">
            <span class="mr-2">🎰</span>
            SPIN THE REELS!
        </span>
    `;
}

// Go back
function goBack() {
    window.location.href = 'index.html';
}

// Load user on start
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch(`${SERVER}/user/${uid}`);
        const result = await response.json();
        
        if (result.success !== false) {
            window.user = result;
            document.getElementById('balance').textContent = 
                `Balance: ${result.balance.toFixed(2)} USDT 💎`;
        }
    } catch (error) {
        console.error('[SPIND BET] Load user error:', error);
    }
});
