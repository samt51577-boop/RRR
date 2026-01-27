function handleRoll() {
    const display = document.getElementById('game-display');
    const roll = Math.floor(Math.random() * 6) + 1;

    // Create the state object
    const currentScorecard = { lastRoll: roll, timestamp: new Date().toISOString() };

    // Save the current game state
    localStorage.setItem('rrr_scorecard', JSON.stringify(currentScorecard));

    display.innerText = `You rolled a ${roll}!`;
    console.log(`Roll: ${roll}`);
}

// Retrieve it when the page loads
window.addEventListener('load', () => {
    const savedGame = JSON.parse(localStorage.getItem('rrr_scorecard'));
    if (savedGame && savedGame.lastRoll) {
        document.getElementById('game-display').innerText = `Last saved roll: ${savedGame.lastRoll}`;
    }
});
