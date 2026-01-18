class WulfGame {
    constructor() {
        this.state = {
            currentHole: 1,
            players: [],
            wolfIndex: 0,
            history: [],
            selectedPartner: null
        };
    }

    start(players) {
        this.state.players = players;
        this.state.currentHole = 1;
        this.refreshHole();
    }

    // 1. Assign Wolf based on rotation
    updateWolf() {
        if (this.state.players.length === 0) return;

        // Wolf rotation: (Hole - 1) % PlayerCount
        this.state.wolfIndex = (this.state.currentHole - 1) % this.state.players.length;
        const wolf = this.state.players[this.state.wolfIndex];

        const wolfNameEl = document.getElementById('current-wolf-name');
        if (wolfNameEl) wolfNameEl.textContent = wolf.name;

        this.renderPartnerGrid();
    }

    // 2. Generate buttons for everyone EXCEPT the Wolf
    renderPartnerGrid() {
        const grid = document.getElementById('partner-grid');
        if (!grid) return;

        grid.innerHTML = '';
        this.state.players.forEach((player, index) => {
            if (index !== this.state.wolfIndex) {
                const btn = document.createElement('button');
                btn.className = 'partner-btn';
                btn.textContent = player.name;
                btn.onclick = () => this.selectPartner(player, btn);
                grid.appendChild(btn);
            }
        });
    }

    // 3. Move to next hole
    nextHole() {
        if (this.state.currentHole < 18) {
            this.state.currentHole++;
            this.refreshHole();
        } else {
            alert("Round Complete!");
        }
    }

    // 4. Back button logic
    prevHole() {
        if (this.state.currentHole > 1) {
            this.state.currentHole--;
            this.refreshHole();
        }
    }

    refreshHole() {
        this.updateWolf();
        const holeNumEl = document.getElementById('current-hole-num');
        if (holeNumEl) holeNumEl.textContent = this.state.currentHole;

        const backBtn = document.getElementById('prev-hole-btn');
        if (backBtn) {
            this.state.currentHole > 1 ? backBtn.classList.remove('hidden') : backBtn.classList.add('hidden');
        }

        // Reset View
        document.getElementById('phase-result').classList.add('hidden');
        document.getElementById('phase-selection').classList.remove('hidden');

        // Clear selections
        this.state.selectedPartner = null;
        document.querySelectorAll('.card-wolf').forEach(b => b.classList.remove('active-wolf-opt'));
    }

    selectPartner(player, btnElement) {
        this.state.selectedPartner = player;
        // Highlight logic
        document.querySelectorAll('.partner-btn').forEach(b => b.style.borderColor = 'var(--glass-border)');
        btnElement.style.borderColor = '#00ff9d';

        // Move to result phase after brief delay or immediately?
        // For now, let's just highlight.
        // Or maybe show the result phase immediately.
        setTimeout(() => {
            this.showResultPhase();
        }, 300);
    }

    handleWin(winnerType) {
        console.log("Winner:", winnerType);
        // Save result logic here
        this.nextHole();
    }

    showResultPhase() {
        document.getElementById('phase-selection').classList.add('hidden');
        document.getElementById('phase-result').classList.remove('hidden');
    }
}

// ----------------------------------------------
// Setup & UI Logic
// ----------------------------------------------

const game = new WulfGame();

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Inputs based on default select value
    const groupSelect = document.getElementById('group-size');
    updatePlayerInputs(parseInt(groupSelect.value));

    // 2. Listen for Group Size changes
    groupSelect.addEventListener('change', (e) => {
        updatePlayerInputs(parseInt(e.target.value));
    });

    // 3. Start Game
    document.getElementById('start-btn').addEventListener('click', () => {
        const players = getPlayers();
        if (validatePlayers(players)) {
            document.getElementById('setup-view').classList.add('hidden');
            document.getElementById('setup-view').classList.remove('active');

            const gameView = document.getElementById('game-view');
            gameView.classList.remove('hidden');
            gameView.classList.add('active');

            game.start(players);
        } else {
            alert("Please enter names for all players.");
        }
    });

    // 4. Game Controls
    document.getElementById('prev-hole-btn').addEventListener('click', () => game.prevHole());

    // Lone / Blind Wolf Handlers
    document.getElementById('btn-lone').addEventListener('click', function () {
        game.state.selectedPartner = 'lone';
        game.showResultPhase();
    });

    document.getElementById('btn-blind').addEventListener('click', function () {
        game.state.selectedPartner = 'blind';
        game.showResultPhase();
    });

    // Win Handlers
    document.getElementById('btn-win-wolf').addEventListener('click', () => game.handleWin('wolf'));
    document.getElementById('btn-win-pigs').addEventListener('click', () => game.handleWin('pigs'));
    document.getElementById('btn-win-wash').addEventListener('click', () => game.handleWin('wash'));
});

function updatePlayerInputs(count) {
    const container = document.getElementById('player-inputs');
    const existingRows = container.querySelectorAll('.player-entry');
    const currentCount = existingRows.length;

    if (count > currentCount) {
        // Add needed rows
        for (let i = currentCount; i < count; i++) {
            const index = i + 1;
            const div = document.createElement('div');
            div.className = 'player-entry';
            div.innerHTML = `
                <label>Player ${index}</label>
                <div class="entry-row">
                    <input type="text" class="name-input" placeholder="Name">
                    <input type="number" class="hcp-badge" placeholder="HCP" value="0" step="0.1">
                </div>
            `;
            container.appendChild(div);
        }
    } else if (count < currentCount) {
        // Remove excess rows (from bottom)
        for (let i = currentCount - 1; i >= count; i--) {
            existingRows[i].remove();
        }
    }
}

function getPlayers() {
    const players = [];
    document.querySelectorAll('.player-entry').forEach(entry => {
        const nameInput = entry.querySelector('input[type="text"]');
        const hcpInput = entry.querySelector('input[type="number"]');
        players.push({
            name: nameInput.value.trim(),
            hcp: parseFloat(hcpInput.value) || 0
        });
    });
    return players;
}

function validatePlayers(players) {
    return players.every(p => p.name.length > 0);
}
