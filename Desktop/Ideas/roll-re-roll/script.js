// COURSES_BY_STATE is now loaded from courses.js
// STROKE_INDEXES remains for defaulting
const STROKE_INDEXES = [17, 1, 15, 3, 13, 5, 11, 7, 9, 18, 2, 16, 4, 14, 6, 12, 8, 10]; // Mock diff

const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
    'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
    'VA', 'WA', 'WV', 'WI', 'WY', 'Custom'
];

class RollReRollGame {
    constructor() {
        this.checkEnvironment();
        this.cacheDOM();
        this.populateStates();
        this.populateCourses();
        this.loadState();
        this.bindEvents();
        this.renderLeaderboard();

        if (this.state.isActive) {
            this.homeScreen.classList.add('hidden');
            this.courseScreen.classList.add('hidden');
            this.setupScreen.classList.add('hidden');
            this.gameScreen.classList.remove('hidden');
            this.updateUI();
            this.updateScoreboardDOM();
        } else {
            this.homeScreen.classList.remove('hidden');
            this.courseScreen.classList.add('hidden');
            this.setupScreen.classList.add('hidden');
            this.gameScreen.classList.add('hidden');
        }
    }

    checkEnvironment() {
        if (window.location.protocol === 'file:') {
            const warning = document.createElement('div');
            warning.style.cssText = "position:fixed; top:0; left:0; width:100%; background:#d32f2f; color:white; text-align:center; padding:12px; z-index:99999; font-family:sans-serif; box-shadow:0 4px 6px rgba(0,0,0,0.3);";
            warning.innerHTML = "⚠️ <strong>Setup Required:</strong> You are viewing this as a file. To use GHIN Search, please use the server: <a href='http://localhost:3000' style='color:#ffd700; font-weight:bold; text-decoration:underline; margin-left:10px;'>Open http://localhost:3000</a>";
            document.body.prepend(warning);
        } else {
            // Check if API seems to be running on the same domain
            fetch('api/handicaps/search').catch(err => {
                console.warn("GHIN API seems unreachable. If you've just uploaded to your domain, make sure your Node.js server is running and the /api proxy is configured.");
            });
        }
    }

    resetState() {
        this.state = {
            isActive: false,
            course: null, // Will be populated on selection
            // Enhanced Player Data
            players: {
                p1: { name: '', hcp: 0 },
                p2: { name: '', hcp: 0 },
                p3: { name: '', hcp: 0 },
                p4: { name: '', hcp: 0 }
            },
            teams: {
                team1: { name: 'Team 1', balance: 0 },
                team2: { name: 'Team 2', balance: 0 }
            },
            settings: {
                baseBet: 10,
                enableHiLow: false // New Side Game Toggle
            },
            gameMode: 'roll', // 'roll' or 'umbrella'
            currentHole: 1,
            honor: 'team1',
            holeState: {
                multiplier: 1,
                rolledBy: null,
                reRolled: false,
                pressCount: 0
            },
            // Aggressor Log Logic
            rollsCalled: { team1: 0, team2: 0 },
            aggressorLog: [],
            // Umbrella State
            umbrellaState: {
                greenie: 'none', // 'team1', 'team2', 'none'
            },
            history: [],
            editingCourseId: null // Track if editing
        };
    }

    loadState() {
        // Retrieve it when the page loads
        const saved = localStorage.getItem('rrr_scorecard');
        if (saved) {
            this.state = JSON.parse(saved);
        } else {
            this.resetState();
        }
    }

    saveState() {
        // Save the current game state
        localStorage.setItem('rrr_scorecard', JSON.stringify(this.state));
    }

    cacheDOM() {
        // Screens
        this.homeScreen = document.getElementById('home-screen');
        this.courseScreen = document.getElementById('course-screen');
        this.setupScreen = document.getElementById('setup-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.scoreboardModal = document.getElementById('scoreboard-modal');

        // Home Inputs
        this.homeStartBtn = document.getElementById('home-start-btn');

        // Course Inputs
        this.inputs = {
            state: document.getElementById('state-select'),
            course: document.getElementById('course-select'),
            // Manual
            manualName: document.getElementById('manual-course-name'),
            manualSlope: document.getElementById('manual-course-slope'),
            manualRating: document.getElementById('manual-course-rating'),
            // Player Defaults
            p1Slope: document.getElementById('p1-slope'),
            p1Rating: document.getElementById('p1-rating'),
            p2Slope: document.getElementById('p2-slope'),
            p2Rating: document.getElementById('p2-rating'),
            p3Slope: document.getElementById('p3-slope'),
            p3Rating: document.getElementById('p3-rating'),
            p4Slope: document.getElementById('p4-slope'),
            p4Rating: document.getElementById('p4-rating'),
            // Player Names & GHINs
            baseBet: document.getElementById('base-bet')
        };

        this.setupInputs = {
            playerCountSelect: document.getElementById('player-count'),
            playerSetupArea: document.getElementById('player-setup-area'),
            dynamicInputs: document.getElementById('dynamic-inputs'),
            saveGroupToggle: document.getElementById('save-group-toggle'),
            clearSavedBtn: document.getElementById('clear-saved-btn')
        };

        // Favorites
        this.addFavoriteBtn = document.getElementById('add-favorite-btn');
        this.favoritesSection = document.getElementById('favorites-section');
        this.favoritesTableBody = document.getElementById('favorites-table-body');
        this.favorites = JSON.parse(localStorage.getItem('rollReRollFavorites')) || [];

        this.courseContinueBtn = document.getElementById('course-continue-btn');
        this.addCourseModal = document.getElementById('add-course-modal');
        this.closeAddCourseBtn = document.getElementById('close-add-course-btn');
        this.saveCourseBtn = document.getElementById('save-course-btn');

        // Add Course Inputs
        this.newCourseInputs = {
            state: document.getElementById('new-course-state'),
            name: document.getElementById('new-course-name'),
            teeRows: document.querySelectorAll('.tee-box-row'),
            holes: document.querySelectorAll('.hcp-input'),
            pars: document.querySelectorAll('.par-input')
        };

        this.courseSelectMode = document.getElementById('course-select-mode');
        this.selectedCourseDisplay = document.getElementById('selected-course-display');
        this.gameModeInputs = document.querySelectorAll('input[name="game-mode"]');

        // Setup Screen
        this.setupScreen = document.getElementById('setup-screen');
        this.currentHoleDisplay = document.getElementById('current-hole');
        this.holeIndexDisplay = document.getElementById('hole-index');
        this.scoreHoleIndexDisplay = document.getElementById('score-hole-index');
        this.startBtn = document.getElementById('start-btn');
        this.currentStakeDisplay = document.getElementById('current-stake');
        this.multiplierBadges = document.getElementById('multiplier-badges'); // Kept for legacy if needed or can be removed if redundant
        this.actionText = document.getElementById('action-text');

        // New Stakes UI
        this.stakesIndicator = document.getElementById('stakes-indicator');
        this.stakesText = document.getElementById('stakes-text');

        this.rollBtn = document.getElementById('roll-btn');
        this.reRollBtn = document.getElementById('reroll-btn');
        this.pressBtn = document.getElementById('press-btn');

        // Press Modal
        this.pressModal = document.getElementById('press-modal');
        this.closePressBtn = document.getElementById('close-press-btn');
        this.cancelPressBtn = document.getElementById('cancel-press-btn');
        this.confirmPressBtn = document.getElementById('confirm-press-btn');
        this.pressAmountInput = document.getElementById('press-amount-input');

        // Base Bet Modal
        this.baseBetModal = document.getElementById('base-bet-modal');
        this.closeBetBtn = document.getElementById('close-bet-btn');
        this.cancelBetBtn = document.getElementById('cancel-bet-btn');
        this.confirmBetBtn = document.getElementById('confirm-bet-btn');
        this.newBaseBetInput = document.getElementById('new-base-bet-input');

        // Umbrella UI
        this.umbrellaDashboard = document.getElementById('umbrella-dashboard');
        this.umbrellaPointsDisplay = document.getElementById('umbrella-points-display');
        this.umbrellaValueDisplay = document.getElementById('umbrella-value-display');

        this.greenieBtns = document.querySelectorAll('.greenie-btn');
        this.rollControls = document.querySelector('.roll-controls');

        // Hi Low UI
        this.hilowDashboard = document.getElementById('hilow-dashboard');

        // Players UI
        this.p1Display = document.getElementById('p1-display');
        this.p2Display = document.getElementById('p2-display');
        this.p3Display = document.getElementById('p3-display');
        this.p4Display = document.getElementById('p4-display');

        this.p1Pops = document.getElementById('p1-pops');
        this.p2Pops = document.getElementById('p2-pops');
        this.p3Pops = document.getElementById('p3-pops');
        this.p4Pops = document.getElementById('p4-pops');

        this.p1ScoreInput = document.getElementById('p1-score');
        this.p2ScoreInput = document.getElementById('p2-score');
        this.p3ScoreInput = document.getElementById('p3-score');
        this.p4ScoreInput = document.getElementById('p4-score');

        this.finishHoleBtn = document.getElementById('finish-hole-btn');
        this.scoreboardToggle = document.getElementById('scoreboard-toggle');
        this.closeScoreboard = document.getElementById('close-scoreboard');

        // Scoreboard
        this.t1Summary = document.getElementById('t1-summary');
        this.t2Summary = document.getElementById('t2-summary');
        this.holeHistory = document.getElementById('hole-history');

        // Payout UI
        this.payoutSummary = document.getElementById('payout-summary');
        this.payoutInstruction = document.getElementById('payout-instruction');
        this.payoutAmount = document.getElementById('payout-amount');
        this.t2Summary = document.getElementById('t2-summary');
        this.holeHistory = document.getElementById('hole-history');

        // Menu
        this.menuBtn = document.getElementById('menu-btn');
        this.menuModal = document.getElementById('menu-modal');
        this.menuOptions = document.getElementById('menu-options');
        this.menuConfirm = document.getElementById('menu-confirm');

        this.resumeBtn = document.getElementById('resume-btn');
        this.undoBtn = document.getElementById('undo-btn');
        this.endMatchBtn = document.getElementById('end-match-btn');

        // Leaderboard
        this.leaderboardBody = document.getElementById('leaderboard-body');

        this.confirmYesBtn = document.getElementById('confirm-yes-btn');
        this.confirmCancelBtn = document.getElementById('confirm-cancel-btn');
        this.setupBackBtn = document.getElementById('setup-back-btn');

        // Match Start
        this.startBtn = document.getElementById('start-btn');
        this.changeCourseBtn = document.getElementById('change-course-btn');
        this.openAddCourseBtn = document.getElementById('open-add-course-btn');
        this.editCourseBtn = document.getElementById('edit-course-btn');
    }

    bindEvents() {
        // Home Screen
        if (this.homeStartBtn) {
            this.homeStartBtn.addEventListener('click', () => {
                this.homeScreen.classList.add('hidden');
                this.courseScreen.classList.remove('hidden');
            });
        }

        // Initialize Toggles
        this.toggleHoleOptions();

        // Open Add Custom Course Modal
        // Open Add Custom Course Modal
        if (this.openAddCourseBtn) {
            this.openAddCourseBtn.addEventListener('click', () => {
                this.editingCourseId = null; // Reset editing state
                // Reset inputs
                this.newCourseInputs.name.value = '';
                this.newCourseInputs.holes.forEach(i => i.value = '');
                this.newCourseInputs.pars.forEach(i => i.value = '');

                this.addCourseModal.classList.remove('hidden');
            });
        }

        if (this.editCourseBtn) {
            this.editCourseBtn.addEventListener('click', () => this.openEditCourseModal());
        }

        // Check visibility on course change
        if (this.inputs.course) {
            this.inputs.course.addEventListener('change', () => this.updateEditButtonVisibility());
        }

        // Add Course Modal (Hidden Feature)
        if (this.inputs.state) {
            this.inputs.state.addEventListener('change', () => this.populateCourses());
        }

        if (this.addFavoriteBtn) {
            this.addFavoriteBtn.addEventListener('click', () => this.addFavorite());
        }

        // Add Course Modal (Hidden Feature)
        if (this.closeAddCourseBtn) {
            this.closeAddCourseBtn.addEventListener('click', () => {
                this.addCourseModal.classList.add('hidden');
            });
        }

        if (this.saveCourseBtn) {
            this.saveCourseBtn.addEventListener('click', () => this.saveCustomCourse());
        }

        // Back Button (Setup -> Course)
        if (this.setupBackBtn) {
            this.setupBackBtn.addEventListener('click', () => {
                this.setupScreen.classList.add('hidden');
                this.courseScreen.classList.remove('hidden');
            });
        }

        if (this.changeCourseBtn) {
            this.changeCourseBtn.addEventListener('click', () => {
                this.setupScreen.classList.add('hidden');
                this.courseScreen.classList.remove('hidden');
            });
        }

        // Continue to Setup (Course Selected)
        if (this.courseContinueBtn) {
            this.courseContinueBtn.addEventListener('click', () => {
                let finalCourse = this.getSelectedCourseData();
                if (!finalCourse) {
                    alert("⚠️ Please select a course to continue.");
                    return;
                }

                // Force the app state to update to the new selection
                this.state.course = finalCourse;

                // Update the visual label on the Setup Screen immediately
                if (this.selectedCourseDisplay) {
                    this.selectedCourseDisplay.textContent = finalCourse.name;
                }

                // Transition screens
                this.courseScreen.classList.add('hidden');
                this.setupScreen.classList.remove('hidden');

                // Re-load par/index data for the specific course (DMCC North)
                this.loadCourse(finalCourse);
            });
        }

        // START MATCH (TEE OFF)
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => {
                console.log("TEE OFF CLICKED");
                try {
                    this.startGame();
                } catch (e) {
                    alert("Start Error: " + e.message);
                    console.error(e);
                }
            });
        } else {
            console.error("CRITICAL: Start Button not found in DOM");
        }

        // Game Actions
        if (this.finishHoleBtn) this.finishHoleBtn.addEventListener('click', () => this.finishHole());
        if (this.continueBtn) this.continueBtn.addEventListener('click', () => this.continueGame());
        if (this.rollBtn) this.rollBtn.addEventListener('click', () => this.handleRoll());
        if (this.reRollBtn) this.reRollBtn.addEventListener('click', () => this.handleReRoll());
        if (this.pressBtn) this.pressBtn.addEventListener('click', () => this.handlePress());

        // Allow editing Base Bet by clicking Pot
        // Allow editing Base Bet by clicking Pot (Delegated for robustness)
        document.addEventListener('click', (e) => {
            const potCard = e.target.closest('#bet-card-interactive');
            if (potCard) {
                console.log("Delegated Click on Pot");

                // Safety check: Don't allow if action started
                const hState = this.state.holeState;
                const hasAction = hState && (hState.rolledBy || (hState.presses && hState.presses.length > 0));

                if (hasAction) {
                    alert("Cannot change base bet after action has started.");
                    return;
                }

                const current = this.state.settings.baseBet;

                // Open Custom Modal
                if (this.baseBetModal) {
                    this.newBaseBetInput.value = current;
                    this.baseBetModal.classList.remove('hidden');
                    this.newBaseBetInput.focus();
                } else {
                    console.error("Base Bet Modal not found");
                }
            }
        });

        // Base Bet Modal Events
        const closeBetModal = () => this.baseBetModal && this.baseBetModal.classList.add('hidden');
        if (this.closeBetBtn) this.closeBetBtn.addEventListener('click', closeBetModal);
        if (this.cancelBetBtn) this.cancelBetBtn.addEventListener('click', closeBetModal);
        if (this.confirmBetBtn) {
            this.confirmBetBtn.addEventListener('click', () => {
                const val = this.newBaseBetInput.value;
                if (val && !isNaN(val) && val > 0) {
                    this.state.settings.baseBet = parseInt(val);
                    this.saveState();
                    this.updateUI();
                    closeBetModal();
                    console.log("Base Bet Updated via Modal");
                } else {
                    alert("Please enter a valid amount.");
                }
            });
        }

        if (this.scoreboardToggle) this.scoreboardToggle.addEventListener('click', () => this.toggleScoreboard(true));
        if (this.closeScoreboard) this.closeScoreboard.addEventListener('click', () => this.toggleScoreboard(false));

        // Press Modal
        const closePress = () => this.pressModal && this.pressModal.classList.add('hidden');
        if (this.closePressBtn) this.closePressBtn.addEventListener('click', closePress);
        if (this.cancelPressBtn) this.cancelPressBtn.addEventListener('click', closePress);
        if (this.confirmPressBtn) this.confirmPressBtn.addEventListener('click', () => this.submitPress());

        // Menu & Navigation
        if (this.menuBtn) this.menuBtn.addEventListener('click', () => this.toggleMenu(true));
        if (this.resumeBtn) this.resumeBtn.addEventListener('click', () => this.toggleMenu(false));

        // Export helper for direct access if needed
        window.openBaseBetModal = () => {
            console.log("Direct Call to Open Modal");
            if (this.baseBetModal) {
                this.newBaseBetInput.value = this.state.settings.baseBet;
                this.baseBetModal.classList.remove('hidden');
            }
        };

        window.saveBaseBet = () => {
            if (this.newBaseBetInput) {
                const val = parseInt(this.newBaseBetInput.value);
                if (val && !isNaN(val) && val > 0) {
                    this.state.settings.baseBet = val;
                    this.saveState();
                    this.updateUI();
                    if (this.baseBetModal) this.baseBetModal.classList.add('hidden');
                    console.log("Base Bet Saved via Global Helper:", val);
                } else {
                    alert("Please enter a valid amount.");
                }
            }
        };


        if (this.undoBtn) {
            this.undoBtn.addEventListener('click', () => {
                this.undoLastHole();
                this.toggleMenu(false);
            });
        }

        // End Match Flow
        if (this.endMatchBtn) {
            this.endMatchBtn.addEventListener('click', () => {
                this.menuOptions.classList.add('hidden');
                this.menuConfirm.classList.remove('hidden');
            });
        }

        if (this.confirmCancelBtn) {
            this.confirmCancelBtn.addEventListener('click', () => {
                this.menuConfirm.classList.add('hidden');
                this.menuOptions.classList.remove('hidden');
            });
        }

        if (this.confirmYesBtn) {
            this.confirmYesBtn.addEventListener('click', () => {
                // Ensure final stats are calculated and visible for archiving
                this.updateScoreboardDOM();
                this.archiveRound();

                this.endMatch();
                this.toggleMenu(false);
            });
        }

        // Umbrella Greenie Toggles
        this.greenieBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.state.umbrellaState.greenie = e.target.dataset.team;
                this.updateUI();
            });
        });

        // Game Mode Toggles
        document.querySelectorAll('input[name="game-mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                document.querySelectorAll('.radio-card').forEach(c => c.classList.remove('selected'));
                e.target.closest('.radio-card').classList.add('selected');
            });
        });

        if (this.setupInputs.playerCountSelect) {
            this.setupInputs.playerCountSelect.addEventListener('change', () => this.togglePlayerInputs());
            // Trigger immediately in case browser restored state or default is set
            if (this.setupInputs.playerCountSelect.value > 0) {
                this.togglePlayerInputs();
            }
        }

        // Clear Saved Group
        if (this.setupInputs.clearSavedBtn) {
            this.setupInputs.clearSavedBtn.addEventListener('click', () => this.clearSavedGroup());
        }

        console.log("BindEvents Complete");
    }

    toggleMenu(show) {
        if (show) {
            // Always reset to options view when opening
            this.menuOptions.classList.remove('hidden');
            this.menuConfirm.classList.add('hidden');
            this.menuModal.classList.remove('hidden');
        } else {
            this.menuModal.classList.add('hidden');
        }
    }

    endMatch() {
        this.resetState(); // Reset object to initial
        this.saveState();  // Save it as "inactive"
        location.reload();
    }

    undoLastHole() {
        if (this.state.history.length === 0) {
            alert("No holes to undo!");
            return;
        }

        const lastHole = this.state.history.pop();

        // Revert Balances
        if (lastHole.winner === 'team1') {
            this.state.teams.team1.balance -= lastHole.amount;
            this.state.teams.team2.balance += lastHole.amount;
        } else if (lastHole.winner === 'team2') {
            this.state.teams.team2.balance -= lastHole.amount;
            this.state.teams.team1.balance += lastHole.amount;
        }

        // Revert State
        this.state.currentHole--;
        this.state.honor = lastHole.previousHonor;
        this.state.holeState = lastHole.finalHoleState; // Restore the multiplier/roll status

        this.saveState();
        this.updateUI();
        this.updateScoreboardDOM();
        alert(`Undid Hole ${lastHole.hole}. Score reverted.`);
    }

    populateStates() {
        const optionsHtml = US_STATES.map(s =>
            `<option value="${s}" ${s === 'CA' ? 'selected' : ''}>${s}</option>`
        ).join('');

        this.inputs.state.innerHTML = optionsHtml;

        if (this.newCourseInputs && this.newCourseInputs.state) {
            this.newCourseInputs.state.innerHTML = optionsHtml;
            // Maybe select AL by default or just let CA be default as per above logic
            // If user selects AL, we should probably default to AL?
            // "CA" is selected above.
            // I'll leave it as is.
        }
    }

    populateCourses() {
        if (!this.inputs || !this.inputs.state) return;

        // Safety check for data
        if (typeof COURSES_BY_STATE === 'undefined') {
            console.error("COURSES_BY_STATE is undefined. Check courses.js for syntax errors.");
            this.inputs.course.innerHTML = '<option value="">Error loading courses</option>';
            return;
        }

        const selectedState = this.inputs.state.value;
        // Merge built-in courses with custom courses for that state
        let courses = COURSES_BY_STATE[selectedState] || [];

        try {
            const savedCustom = localStorage.getItem('customCourses');
            if (savedCustom) {
                const customAll = JSON.parse(savedCustom);
                const customState = customAll.filter(c => c.state === selectedState);
                courses = [...courses, ...customState];
            }
        } catch (e) {
            console.error("Error loading custom courses", e);
        }

        // Sort alphabetically
        courses.sort((a, b) => a.name.localeCompare(b.name));

        if (courses.length === 0) {
            this.inputs.course.innerHTML = '<option value="">No courses found</option>';
        } else {
            this.inputs.course.innerHTML = courses.map(c =>
                `<option value="${c.id}">${c.name}</option>`
            ).join('');
        }

        this.updateEditButtonVisibility();

        // Also render favorites list initially if not done
        this.renderFavorites();
    }

    loadCourse(course) {
        if (!course) return;
        this.selectedCourseDisplay.textContent = course.name;

        // Populate Tees
        const teeSelect = document.getElementById('courseTee');
        if (teeSelect) {
            teeSelect.innerHTML = '<option value="default">Default / Middle</option>';
            if (course.tees) {
                course.tees.forEach((tee, index) => {
                    const opt = document.createElement('option');
                    opt.value = index;
                    opt.textContent = `${tee.name} (${tee.gender}) - R:${tee.rating} / S:${tee.slope}`;
                    teeSelect.appendChild(opt);
                });
            }
        }
    }

    toggleHoleOptions() {
        // Update active class on labels
        document.querySelectorAll('input[type="radio"]').forEach(inp => {
            const parent = inp.parentElement;
            if (parent.classList.contains('toggle-btn')) {
                if (inp.checked) parent.classList.add('active');
                else parent.classList.remove('active');
            }
        });

        // Ensure manual listeners are attached (idempotent or attached once)
        ['holeCount', 'startHole'].forEach(name => {
            document.querySelectorAll(`input[name="${name}"]`).forEach(inp => {
                // Avoid duplicate listeners if possible, but simple overwrite is okay for this scope
                inp.parentElement.onclick = () => {
                    document.querySelectorAll(`input[name="${name}"]`).forEach(i => i.parentElement.classList.remove('active'));
                    inp.parentElement.classList.add('active');
                    inp.checked = true;
                    // Trigger change event if needed? 
                    // The click on parent doesn't auto-trigger input change if we manually handle it?
                    // Actually, label click triggers input change naturally. 
                    // But we are using div logic? No, <label>.
                    // If we prevent default or something. But here we just update classes.
                }
            });
        });
    }
    async fetchGhin(playerIndex, btnElement) {
        const input = document.getElementById(`p${playerIndex}-ghin`);
        const nameInput = document.getElementById(`p${playerIndex}-name`);
        const val = input.value.trim();
        const nameVal = nameInput.value.trim();

        // Smart API Discovery
        let apiBase = window.API_BASE || '';
        if (!apiBase) {
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                apiBase = 'http://localhost:3000/';
            } else if (window.location.hostname === 'samtierney10.com') {
                // Render hosted backend
                apiBase = 'https://wolf-golf-game.onrender.com/';
            }
        }

        let url = '';

        if (val && /^\d+$/.test(val) && val.length > 4) {
            // Numeric -> GHIN ID search
            url = `${apiBase}api/handicaps/${val}`;
        } else if (nameVal) {
            // Clean up name: remove common separators like commas or dots
            const cleanedName = nameVal.replace(/[,.]/g, ' ').trim();
            const parts = cleanedName.split(/\s+/);

            // Check for State Override at end of string (e.g. "Joe Smarro TX")
            let state = 'IA'; // Default fallback
            if (this.inputs && this.inputs.state && this.inputs.state.value) {
                state = this.inputs.state.value;
            }

            const potentialState = parts[parts.length - 1].toUpperCase();
            if (US_STATES.includes(potentialState)) {
                state = potentialState;
                parts.pop(); // Remove state from name
            }

            let firstName = '';
            let lastName = '';

            if (parts.length > 1) {
                lastName = parts.pop();
                firstName = parts.join(' ');
            } else if (parts.length === 1) {
                lastName = parts[0];
            }

            if (state === 'Custom') state = '';

            url = `${apiBase}api/handicaps/search?last_name=${encodeURIComponent(lastName)}`;
            if (firstName) url += `&first_name=${encodeURIComponent(firstName)}`;
            if (state) url += `&state=${encodeURIComponent(state)}`;

            this.lastSearchState = state;
            console.log(`[GHIN Fetch] URL: ${url}`);
        } else {
            alert("Please enter a GHIN number OR a Name to search.");
            return;
        }

        // Visual feedback
        const originalText = btnElement.innerHTML;
        btnElement.innerHTML = '⏳';

        try {
            const response = await fetch(url);
            let data;

            try {
                data = await response.json();
            } catch (jsonErr) {
                // If not JSON, it might be a 404 HTML page from the host
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error(`The GHIN API was not found (404). Please ensure the Node.js server is running and accessible at ${apiBase}`);
                    }
                    throw new Error(`Server returned ${response.status}: ${response.statusText}.`);
                }
                throw new Error("Invalid response from server");
            }

            if (!response.ok) {
                const errorMsg = data.details || data.error || `Error ${response.status}: ${response.statusText}`;
                throw new Error(errorMsg);
            }

            if (Array.isArray(data)) {
                // Search Results
                if (data.length === 0) {
                    throw new Error("No golfers found with that name in " + (this.lastSearchState || 'Location'));
                } else if (data.length === 1) {
                    // Exact match
                    const p = data[0];
                    nameInput.value = p.name;
                    input.value = p.handicap_index;
                } else {
                    // Multiple matches - Allow user to pick
                    this.showGolferSelectionModal(data, (selected) => {
                        nameInput.value = selected.name;
                        input.value = selected.handicap_index;
                        if (selected.ghin) input.setAttribute("title", "GHIN: " + selected.ghin);
                    });
                }
            } else {
                // Single object (direct lookup)
                if (data.name) nameInput.value = data.name;
                if (data.handicap_index !== undefined) input.value = data.handicap_index;
            }

            btnElement.innerHTML = '✅';
            setTimeout(() => btnElement.innerHTML = originalText, 2000);

        } catch (e) {
            console.error("Fetch Error:", e);

            let message = e.message;
            if (message === "Failed to fetch") {
                message = "Could not connect to the search server. This usually means the Node.js backend is not running at " + (apiBase || window.location.origin) + ".";
            }

            if (window.location.protocol === 'file:') {
                alert("⚠️ Connection Error: GHIN Search requires the local server.\n\nPlease open http://localhost:3000 in your browser.");
            } else {
                alert("Search Error: " + message);
            }
            btnElement.innerHTML = '❌';
            setTimeout(() => btnElement.innerHTML = originalText, 2000);
        }
    }

    showGolferSelectionModal(golfers, callback) {
        // Remove existing if any
        const existing = document.getElementById('golfer-select-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'golfer-select-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); backdrop-filter: blur(5px);
            display: flex; justify-content: center; align-items: center; z-index: 10000;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: var(--card-bg, #222); border: 1px solid var(--neon-blue, #0ff);
            padding: 20px; border-radius: 12px; max-width: 400px; width: 90%;
            max-height: 80vh; overflow-y: auto; text-align: center;
        `;

        const title = document.createElement('h3');
        title.textContent = "Select Golfer";
        title.style.color = "white";
        content.appendChild(title);

        const list = document.createElement('div');
        list.style.cssText = "display: flex; flex-direction: column; gap: 10px; margin-top: 15px;";

        golfers.slice(0, 50).forEach(g => { // Increased limit to 50 to see more results
            const btn = document.createElement('button');
            btn.style.cssText = `
                background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
                padding: 10px; color: white; border-radius: 6px; cursor: pointer; text-align: left;
            `;
            btn.innerHTML = `
                <div style="font-weight:bold; color:var(--neon-blue, #0ff)">${g.name}</div>
                <div style="font-size:0.8rem; color:#aaa;">HCP: ${g.handicap_index} | GHIN: ${g.ghin}</div>
                <div style="font-size:0.75rem; color:#888;">${g.club || ''} (${g.state})</div>
            `;
            btn.onclick = () => {
                callback(g);
                modal.remove();
            };
            list.appendChild(btn);
        });

        const cancel = document.createElement('button');
        cancel.textContent = "Cancel";
        cancel.style.cssText = "margin-top: 15px; padding: 8px 16px; background: #444; color: white; border: none; border-radius: 4px; cursor: pointer;";
        cancel.onclick = () => modal.remove();

        content.appendChild(list);
        content.appendChild(cancel);
        modal.appendChild(content);
        document.body.appendChild(modal);
    }

    togglePlayerInputs() {
        console.log("Toggle Player Inputs Triggered");
        if (!this.setupInputs || !this.setupInputs.playerCountSelect) {
            console.error("Setup inputs missing");
            return;
        }

        const count = parseInt(this.setupInputs.playerCountSelect.value);
        const setupArea = this.setupInputs.playerSetupArea;
        const inputContainer = this.setupInputs.dynamicInputs;

        let savedPlayers = [];
        try {
            const stored = localStorage.getItem('savedRollGroup');
            if (stored) savedPlayers = JSON.parse(stored);
            if (!Array.isArray(savedPlayers)) savedPlayers = [];
        } catch (e) {
            console.error("Error loading saved group", e);
            savedPlayers = [];
        }

        console.log("Count:", count, "Saved:", savedPlayers);

        if (count > 0) {
            setupArea.style.display = 'block';
            inputContainer.innerHTML = '';

            for (let i = 1; i <= count; i++) {
                // Check if we have saved data for this player slot
                const saved = savedPlayers[i - 1] || { name: '', hcp: '' };
                let defaultName = saved.name || '';
                let defaultHcp = saved.hcp || '';

                if (i === 1 && !defaultName) defaultName = "Sam";
                if (i === 1 && !defaultHcp) defaultHcp = "10.2";

                const playerRow = document.createElement('div');
                playerRow.className = 'player-input-group';
                playerRow.style.marginBottom = '15px';
                playerRow.innerHTML = `
                    <div class="input-row" style="display: flex; gap: 8px; align-items: center;">
                        <input type="text" id="p${i}-name" value="${defaultName}" placeholder="Player ${i} Name (e.g. Joe Smith IA)" style="flex: 2; padding:10px; border-radius:8px; border:1px solid var(--glass-border); background:rgba(0,0,0,0.3); color:white;">
                        <input type="text" id="p${i}-ghin" value="${defaultHcp}" placeholder="HCP or GHIN" style="flex: 1; text-align: center; padding:10px; border-radius:8px; border:1px solid var(--glass-border); background:rgba(0,0,0,0.3); color:white;">
                        <button type="button" id="p${i}-search-btn" onclick="window.game.fetchGhin(${i}, this)" style="padding: 10px; background: var(--neon-blue); border: none; border-radius: 8px; color: black; font-weight: bold; cursor: pointer;">🔍</button>
                    </div>`;
                inputContainer.appendChild(playerRow);

                // Automatically trigger search if we have data and we haven't already searched
                if (defaultName || defaultHcp) {
                    setTimeout(() => {
                        const btn = document.getElementById(`p${i}-search-btn`);
                        if (btn) this.fetchGhin(i, btn);
                    }, 500 + (i * 200)); // Stagger them slightly
                }
            }
        } else {
            setupArea.style.display = 'none';
        }
    }
    clearSavedGroup() {
        if (confirm("Clear all saved names and handicaps?")) {
            // Remove only the Roll Re-Roll group data
            localStorage.removeItem('savedRollGroup');

            // Reset the UI
            if (this.setupInputs.saveGroupToggle) {
                this.setupInputs.saveGroupToggle.checked = false;
            }
            this.togglePlayerInputs(); // Refreshes the inputs to be empty (or default)

            // Optional: Hide button if no data? But for now simple alert.
            // alert("Saved group cleared."); // User requested alert, but maybe cleaner without? I'll keep it.
        }
    }

    // --- Favorites Logic ---

    addFavorite() {
        const courseId = this.inputs.course.value;
        if (!courseId) return;

        if (!this.favorites.includes(courseId)) {
            this.favorites.push(courseId);
            localStorage.setItem('rollReRollFavorites', JSON.stringify(this.favorites));
            this.renderFavorites();
        }
    }

    removeFavorite(courseId) {
        const index = this.favorites.indexOf(courseId);
        if (index > -1) {
            this.favorites.splice(index, 1);
            localStorage.setItem('rollReRollFavorites', JSON.stringify(this.favorites));
            this.renderFavorites();
        }
    }

    renderFavorites() {
        this.favoritesTableBody.innerHTML = '';

        if (this.favorites.length === 0) {
            this.favoritesSection.classList.add('hidden');
            return;
        }

        this.favoritesSection.classList.remove('hidden');

        this.favorites.forEach(favId => {
            // Find course info
            let course = null;
            // Search all states
            for (const state in COURSES_BY_STATE) {
                const found = COURSES_BY_STATE[state].find(c => c.id === favId);
                if (found) {
                    course = found;
                    course.state = state;
                    break;
                }
            }

            // Check custom
            if (!course) {
                const customs = JSON.parse(localStorage.getItem('customCourses')) || [];
                course = customs.find(c => c.id === favId);
                if (course) course.state = 'Custom';
            }

            if (course) {
                const row = document.createElement('tr');
                row.style.borderBottom = '1px solid rgba(255,255,255,0.05)';

                row.innerHTML = `
                    <td style="padding: 12px 15px;">
                        <div style="font-weight: 500;">${course.name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-dim);">${course.state}</div>
                    </td>
                    <td style="padding: 12px 15px; text-align: center;">
                        <span style="background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 6px; font-size: 0.8rem;">
                            ${course.rating} / ${course.slope}
                        </span>
                    </td>
                    <td style="padding: 12px 15px; text-align: right;">
                        <div style="display: flex; gap: 8px; justify-content: flex-end;">
                           <button class="play-fav-btn primary-btn" style="padding: 6px 12px; font-size: 0.75rem; min-width: auto;">Play</button>
                           <button class="remove-fav-btn" style="background: none; border: none; color: #ff5555; cursor: pointer; padding: 4px;">✕</button>
                        </div>
                    </td>
                `;

                // Bind events
                const playBtn = row.querySelector('.play-fav-btn');
                playBtn.addEventListener('click', () => {
                    this.inputs.state.value = course.state;
                    this.populateCourses();
                    this.inputs.course.value = course.id;
                    // Trigger continue directly? Or just select. User probably wants to select.
                    // Optional: scroll top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });

                const removeBtn = row.querySelector('.remove-fav-btn');
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeFavorite(course.id);
                });

                this.favoritesTableBody.appendChild(row);
            }
        });
    }

    saveCustomCourse() {
        const state = this.newCourseInputs.state ? this.newCourseInputs.state.value : 'Custom';
        const name = this.newCourseInputs.name.value.trim();

        // Tee Boxes
        const tees = [];
        // User removed UI inputs, so auto-generate "Standard" tee
        tees.push({
            name: "Standard",
            yards: "",
            slope: 113,
            rating: 72.0
        });

        if (!name) {
            alert("Please enter a Course Name.");
            return;
        }

        // Tee validation check removed

        const slope = tees[0].slope;
        const rating = tees[0].rating;

        // Duplicate Check
        const normName = name.toLowerCase();

        // Check built-in
        if (COURSES_BY_STATE[state]) {
            const exists = COURSES_BY_STATE[state].find(c => c.name.toLowerCase() === normName);
            if (exists) {
                alert(`Course "${name}" already exists in ${state}.`);
                return;
            }
        }

        // Check custom
        const saved = localStorage.getItem('customCourses');
        const customCourses = saved ? JSON.parse(saved) : [];
        const existsCustom = customCourses.find(c => c.state === state && c.name.toLowerCase() === normName);
        if (existsCustom) {
            alert(`Custom Course "${name}" already exists in ${state}.`);
            return;
        }

        const indexes = [];
        let missingHoles = false;
        this.newCourseInputs.holes.forEach(input => {
            const val = parseInt(input.value);
            if (isNaN(val)) missingHoles = true;
            indexes.push(val);
        });

        const pars = [];
        let missingPars = false;
        if (this.newCourseInputs.pars) {
            this.newCourseInputs.pars.forEach(input => {
                const val = parseInt(input.value);
                if (isNaN(val)) missingPars = true;
                pars.push(val);
            });
        }

        if (missingHoles) {
            alert("Please enter Handicap Indexes for all 18 holes.");
            return;
        }

        if (missingPars) {
            alert("Please enter Pars for all 18 holes.");
            return;
        }

        // Check for duplicates in indexes (Normally 1-18 unique). 
        const unique = new Set(indexes);
        if (unique.size !== 18) {
            alert("Handicap Indexes must be unique numbers from 1 to 18.");
            return;
        }

        // Prepare Course Object
        const courseObj = {
            name: name,
            slope: slope,
            rating: rating,
            tees: tees,
            indexes: indexes,
            pars: pars,
            state: state
        };

        // Load existing custom courses (Already loaded above)
        // const saved = localStorage.getItem('customCourses');
        // let customCourses = saved ? JSON.parse(saved) : [];

        if (this.editingCourseId) {
            // Update Existing
            const idx = customCourses.findIndex(c => c.id === this.editingCourseId);
            if (idx !== -1) {
                customCourses[idx] = { ...customCourses[idx], ...courseObj }; // Preserve ID
            } else {
                // Fallback if ID not found? Treat as new
                courseObj.id = 'custom_' + Date.now();
                customCourses.push(courseObj);
            }
        } else {
            // Create New
            // Duplicate Check (Name in State)
            const normName = name.toLowerCase();
            if (COURSES_BY_STATE[state]) {
                const exists = COURSES_BY_STATE[state].find(c => c.name.toLowerCase() === normName);
                if (exists) {
                    alert(`Course "${name}" already exists in ${state}.`);
                    return;
                }
            }
            const existsCustom = customCourses.find(c => c.state === state && c.name.toLowerCase() === normName);
            if (existsCustom) {
                alert(`Custom Course "${name}" already exists in ${state}.`);
                return;
            }

            courseObj.id = 'custom_' + Date.now();
            customCourses.push(courseObj);
        }

        // Save to LocalStorage
        localStorage.setItem('customCourses', JSON.stringify(customCourses));

        // Close Modal & Reset
        this.addCourseModal.classList.add('hidden');
        this.newCourseInputs.name.value = '';
        this.newCourseInputs.teeRows.forEach(row => {
            row.querySelector('.tee-name').value = '';
            row.querySelector('.tee-yards').value = '';
        });
        this.newCourseInputs.holes.forEach(i => i.value = '');
        this.populateCourses(); // Refresh list to show changes
        this.editingCourseId = null; // Clear editing state
    }

    updateEditButtonVisibility() {
        if (!this.editCourseBtn || !this.inputs.course) return;
        const cId = this.inputs.course.value;
        if (cId && cId.startsWith('custom_')) {
            this.editCourseBtn.classList.remove('hidden');
        } else {
            this.editCourseBtn.classList.add('hidden');
        }
    }

    openEditCourseModal() {
        const cId = this.inputs.course.value;
        if (!cId || !cId.startsWith('custom_')) return;

        // Find course data
        const saved = localStorage.getItem('customCourses');
        const customCourses = saved ? JSON.parse(saved) : [];
        const course = customCourses.find(c => c.id === cId);
        if (!course) return;

        this.editingCourseId = cId;

        // Populate Inputs
        this.newCourseInputs.state.value = course.state || 'Custom'; // Should be in dropdown if populated
        this.newCourseInputs.name.value = course.name;

        // Populate Pars
        if (course.pars) {
            this.newCourseInputs.pars.forEach((input, i) => {
                if (course.pars[i] !== undefined) input.value = course.pars[i];
            });
        }

        // Populate Indexes
        if (course.indexes) {
            this.newCourseInputs.holes.forEach((input, i) => {
                if (course.indexes[i] !== undefined) input.value = course.indexes[i];
            });
        }

        this.addCourseModal.classList.remove('hidden');
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            let newCourses = [];

            try {
                if (file.name.endsWith('.json')) {
                    const jsonContent = JSON.parse(content);
                    // Handle wrapped format { code, data: [...], ... } OR { courses: [...] }
                    if (jsonContent.courses && Array.isArray(jsonContent.courses)) {
                        newCourses = jsonContent.courses;
                    } else if (Array.isArray(jsonContent)) {
                        newCourses = jsonContent;
                    } else {
                        // Try to find any array property? Or just assume single object? 
                        newCourses = [jsonContent];
                    }
                } else if (file.name.endsWith('.csv')) {
                    newCourses = this.parseCSV(content);
                } else {
                    alert("Unsupported file format. Please use .json or .csv");
                    return;
                }

                if (!Array.isArray(newCourses)) newCourses = [newCourses];

                // Basic Validation & Transformation
                const validCourses = newCourses.map(c => {
                    // Try to map varied keys
                    let name = c.name || c.Name || c.course_name || c.CourseName || "Unknown Course";
                    if (c.city && !name.includes(c.city)) {
                        name = `${name} (${c.city})`;
                    }

                    const slope = parseInt(c.slope || c.Slope || c.slope_rating || 113);
                    const rating = parseFloat(c.rating || c.Rating || c.course_rating || 72.0);

                    // Indexes: try 'indexes', or 'Handicap 1'...'Handicap 18' logic? 
                    // For now, assume array or generic default
                    let indexes = c.indexes || c.Indexes;
                    if (!indexes || !Array.isArray(indexes) || indexes.length !== 18) {
                        indexes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
                    }

                    return {
                        id: 'import_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                        name, slope, rating, indexes
                    };
                });

                if (validCourses.length === 0) {
                    alert("No valid courses found in file.");
                    return;
                }

                // Merge with existing
                const saved = localStorage.getItem('customCourses');
                const existing = saved ? JSON.parse(saved) : [];
                const merged = [...existing, ...validCourses];

                localStorage.setItem('customCourses', JSON.stringify(merged));

                alert(`Successfully imported ${validCourses.length} courses!`);

                // Refresh
                this.inputs.state.value = 'Custom';
                this.populateCourses();

            } catch (err) {
                console.error(err);
                alert("Failed to parse file: " + err.message);
            }

            // Reset input
            this.importFileInput.value = '';
        };
        reader.readAsText(file);
    }

    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(l => l.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        return lines.slice(1).map(line => {
            const values = line.split(','); // Simple split, doesn't handle quoted commas well suited for complex CSV
            const obj = {};
            headers.forEach((h, i) => {
                obj[h] = values[i] ? values[i].trim() : '';
            });
            return obj;
        });
    }

    getSelectedCourseData() {
        try {
            const s = this.inputs.state.value;
            const cId = this.inputs.course.value;

            console.log("Getting course data for:", s, cId); // Debug

            if (!s || !cId) return null;

            let course = null;
            if (COURSES_BY_STATE[s]) {
                course = COURSES_BY_STATE[s].find(c => c.id === cId);
            }

            if (!course) {
                const saved = localStorage.getItem('customCourses');
                const customCourses = saved ? JSON.parse(saved) : [];
                course = customCourses.find(c => c.id === cId);
            }

            return course;
        } catch (e) {
            alert("Error fetching course data: " + e.message);
            console.error(e);
            return null;
        }
    }

    startGame() {
        console.log("startGame called");

        // Legacy check removed as inputs are dynamic now.
        // We will validate dynamic values later if needed.


        // Preserve selected course and settings before reset
        const selectedCourse = this.state.course;
        // Check if there is a 'persisted' base bet the user might have set previously
        const previousBaseBet = this.state.settings ? this.state.settings.baseBet : 10;
        const playerCount = parseInt(this.setupInputs.playerCountSelect.value) || 2;

        this.resetState();
        this.state.playerCount = playerCount;

        // Restore course
        if (selectedCourse) {
            this.state.course = selectedCourse;
        }

        // Restore Base Bet (Priority: Input on Setup Screen -> persisted value -> default 10)
        const setupInput = document.getElementById('base-bet');
        const setupVal = setupInput ? parseInt(setupInput.value) : null;

        if (setupVal && !isNaN(setupVal) && setupVal > 0) {
            this.state.settings.baseBet = setupVal;
        } else if (previousBaseBet) {
            this.state.settings.baseBet = previousBaseBet;
        }

        console.log("Game Started with Base Bet:", this.state.settings.baseBet);

        const getVal = (input, def) => input.value || def;
        const getIndex = (input) => this.fetchHandicapIndex(input.value);

        // Get Course Data
        let courseData = this.state.course || { slope: 113, rating: 72 };
        // Ensure slope/rating exists (if course has tees but no root slope)
        if (!courseData.slope && courseData.tees && courseData.tees.length > 0) {
            courseData.slope = courseData.tees[0].slope;
            courseData.rating = courseData.tees[0].rating;
        }
        if (!courseData.slope) courseData.slope = 113;
        if (!courseData.rating) courseData.rating = 72;

        // Calculate Course Handicap: (Index * Slope) / 113
        const calcCH = (index) => Math.round(index * (courseData.slope / 113));

        // Initialize Players with Specific Tee Data (Defaults)
        let defaultSlope = courseData.slope || 113;
        let defaultRating = courseData.rating || 72;

        // Helper to safely get value directly from DOM since cache is gone/dynamic
        const getDynVal = (id) => {
            const el = document.getElementById(id);
            return el ? el.value : '';
        };

        this.state.players = {
            p1: { name: 'Player 1', index: 0, ch: 0 },
            p2: { name: 'Player 2', index: 0, ch: 0 },
            p3: { name: 'Player 3', index: 0, ch: 0 },
            p4: { name: 'Player 4', index: 0, ch: 0 }
        };

        if (playerCount === 2) {
            // 1v1 Mode: Map Input 1 -> P1, Input 2 -> P3 (Team 2)
            const p1Name = getDynVal('p1-name') || 'Player 1';
            const p1Idx = this.fetchHandicapIndex(getDynVal('p1-ghin'));
            const p2Name = getDynVal('p2-name') || 'Player 2';
            const p2Idx = this.fetchHandicapIndex(getDynVal('p2-ghin'));

            const slp = defaultSlope;

            this.state.players.p1 = { name: p1Name, index: p1Idx, ch: Math.round(p1Idx * (slp / 113)), slope: slp };
            this.state.players.p3 = { name: p2Name, index: p2Idx, ch: Math.round(p2Idx * (slp / 113)), slope: slp };
            // P2 and P4 remain dummies
            this.state.teams.team1.name = p1Name;
            this.state.teams.team2.name = p2Name;

        } else {
            // 4 Players (2v2)
            for (let i = 1; i <= 4; i++) {
                if (i <= playerCount) {
                    const name = getDynVal(`p${i}-name`) || `Player ${i}`;
                    const idxVal = getDynVal(`p${i}-ghin`);
                    const idx = this.fetchHandicapIndex(idxVal);
                    const slp = defaultSlope;

                    this.state.players[`p${i}`] = {
                        name: name,
                        index: idx,
                        ch: Math.round(idx * (slp / 113)),
                        slope: slp
                    };
                } else {
                    this.state.players[`p${i}`] = { name: `Player ${i}`, index: 0, ch: 0, slope: defaultSlope };
                }
            }
            this.state.teams.team1.name = `${this.state.players.p1.name} & ${this.state.players.p2.name}`;
            this.state.teams.team2.name = `${this.state.players.p3.name} & ${this.state.players.p4.name}`;
        }



        // Get Game Mode
        const selectedMode = document.querySelector('input[name="game-mode"]:checked').value;
        this.state.gameMode = selectedMode;

        // Force enable Hi-Low for Roll Re-Roll
        if (this.state.gameMode === 'roll') {
            this.state.settings.enableHiLow = true;
        } else {
            this.state.settings.enableHiLow = false;
        }

        this.state.isActive = true;
        this.saveState();

        this.updateUI();
        this.setupScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');

        this.initHole();
        this.saveState();

        // Handle Persistent Data (Save Group)
        const saveToggle = document.getElementById('save-group-toggle');
        if (saveToggle && saveToggle.checked) {
            const playersToSave = [];
            for (let i = 1; i <= playerCount; i++) {
                const p = this.state.players[`p${i}`];
                // Map back to index or ch? Index is better for saving handicap generally.
                // But users enter "GHIN" or Index. We store 'index'. 
                // Let's store what they entered (Name + Index).
                playersToSave.push({
                    name: p.name,
                    hcp: p.index // or input value? 'p.index' is parsed.
                });
            }
            localStorage.setItem('savedRollGroup', JSON.stringify(playersToSave));
        }
    }

    fetchHandicapIndex(inputVal) {
        if (!inputVal) return 0;
        if (typeof inputVal === 'string' && inputVal.trim().startsWith('+')) {
            return -1 * parseFloat(inputVal); // Converts +1.8 to -1.8
        }
        const val = parseFloat(inputVal);
        return isNaN(val) ? 0 : val;
    }

    initHole() {
        this.state.holeState = { multiplier: 1, rolledBy: null, reRolled: false, presses: [] };
        this.state.umbrellaState = { greenie: 'none' }; // Reset per hole
        this.p1ScoreInput.value = '';
        this.p2ScoreInput.value = '';
        this.p3ScoreInput.value = '';
        this.p4ScoreInput.value = '';
        this.updateUI();
    }

    getPops(hcp, holeIndex) {
        // Simple logic:
        // If Hcp 18, get 1 pop every hole.
        // If Hcp 10, get 1 pop on hardest 10 holes (Index 1-10).
        // If Hcp > 18 (e.g. 20), get 1 pop all holes + 1 extra on hardest 2.

        let pops = Math.floor(hcp / 18);
        const remainder = hcp % 18;

        if (remainder >= holeIndex) {
            pops += 1;
        }
        return pops;
    }

    getPlayingHandicaps() {
        // Use 'ch' (Course Handicap) which is calculated in startGame
        const h1 = this.state.players.p1.ch || 0;
        const h2 = this.state.players.p2.ch || 0;
        const h3 = this.state.players.p3.ch || 0;
        const h4 = this.state.players.p4.ch || 0;

        const minHcp = Math.min(h1, h2, h3, h4);

        return {
            p1: h1 - minHcp,
            p2: h2 - minHcp,
            p3: h3 - minHcp,
            p4: h4 - minHcp
        };
    }

    updateUI() {
        // Update Names & Pops
        const indexes = this.state.course ? this.state.course.indexes : STROKE_INDEXES;
        const currentHoleIndex = indexes[(this.state.currentHole - 1) % 18];

        if (this.holeIndexDisplay) this.holeIndexDisplay.textContent = currentHoleIndex;
        if (this.scoreHoleIndexDisplay) this.scoreHoleIndexDisplay.textContent = currentHoleIndex;

        const playingHcps = this.getPlayingHandicaps();

        const updatePlayerUI = (pid, displayEl, popsEl) => {
            // Show Name AND Match Handicap (based off lowest)
            const matchHcp = playingHcps[pid];
            displayEl.textContent = `${this.state.players[pid].name} (${matchHcp})`;

            const pops = this.getPops(matchHcp, currentHoleIndex);

            // Create dots
            let dotsHtml = '';
            for (let i = 0; i < pops; i++) dotsHtml += '<span class="pop-dot"></span>';
            popsEl.innerHTML = dotsHtml;
        };

        updatePlayerUI('p1', this.p1Display, this.p1Pops);
        updatePlayerUI('p2', this.p2Display, this.p2Pops);
        updatePlayerUI('p3', this.p3Display, this.p3Pops);
        updatePlayerUI('p4', this.p4Display, this.p4Pops);

        // Visibility Toggles for 1v1
        const count = this.state.playerCount || 4;
        const p2Row = document.getElementById('p2-score-row');
        const p4Row = document.getElementById('p4-score-row');

        if (count === 2) {
            if (p2Row) p2Row.style.display = 'none';
            if (p4Row) p4Row.style.display = 'none';
        } else {
            if (p2Row) p2Row.style.display = 'flex';
            if (p4Row) p4Row.style.display = 'flex';
        }

        // Update Hole & Stake
        this.currentHoleDisplay.textContent = this.state.currentHole;

        if (this.state.gameMode === 'roll') {
            const pressTotal = (this.state.holeState.presses || []).reduce((a, b) => a + b, 0);
            const currentBet = (this.state.settings.baseBet + pressTotal) * this.state.holeState.multiplier;
            this.currentStakeDisplay.textContent = currentBet;

            // Update Visual Stakes Header
            const m = this.state.holeState.multiplier;
            let label = 'Standard';
            if (m === 2) label = "ROLL 'EM!";
            if (m === 4) label = "RE-ROLL!";

            if (this.stakesIndicator && this.stakesText) {
                this.stakesIndicator.className = `stakes-badge stakes-${m}x`;
                this.stakesText.innerText = `STAKES: ${m}x (${label})`;
            }

            // Badges (Legacy support if needed, or remove)
            if (this.multiplierBadges) {
                this.multiplierBadges.innerHTML = '';
                if (pressTotal > 0) {
                    this.multiplierBadges.innerHTML += `<span class="badge" style="border-color: var(--accent-gold); color: var(--accent-gold);">PRESSED +$${pressTotal}</span>`;
                }
            }

            // Buttons Logic
            const teamWithHonor = this.state.honor;
            const teamWithoutHonor = teamWithHonor === 'team1' ? 'team2' : 'team1';
            const honorName = this.state.teams[teamWithHonor].name;
            const otherName = this.state.teams[teamWithoutHonor].name;

            // Press Logic: Only before rolling, and only once per hole.
            const hasPressed = (this.state.holeState.presses || []).length > 0;
            if (!this.state.holeState.rolledBy && !hasPressed) {
                this.pressBtn.classList.remove('hidden');
            } else {
                this.pressBtn.classList.add('hidden');
            }

            if (!this.state.holeState.rolledBy) {
                this.rollBtn.classList.remove('hidden');
                this.reRollBtn.classList.add('hidden');
                this.actionText.textContent = `${otherName} can ROLL`;
            } else if (!this.state.holeState.reRolled) {
                const roller = this.state.holeState.rolledBy;
                const reRoller = roller === 'team1' ? 'team2' : 'team1';
                const reRollerName = this.state.teams[reRoller].name;

                this.rollBtn.classList.add('hidden');
                this.reRollBtn.classList.remove('hidden');
                this.actionText.textContent = `${reRollerName} can RE-ROLL`;
            } else {
                this.rollBtn.classList.add('hidden');
                this.reRollBtn.classList.add('hidden');
                this.actionText.textContent = "Pot is maxed out!";
            }
        } else if (this.state.gameMode === 'umbrella') {
            // Umbrella Mode UI updates...
            // Hide roll controls
            if (this.stakesIndicator) this.stakesIndicator.style.display = 'none'; // Or standard
            // Actually, keep it but maybe just 1x? The user prompts didn't specify Umbrella behavior for this badge.
            // Usually Umbrella doesn't roll.

            // Existing Umbrella Logic
            this.hilowDashboard.classList.add('hidden');
            this.umbrellaDashboard.classList.remove('hidden');

            this.rollBtn.classList.add('hidden');
            this.reRollBtn.classList.add('hidden');
            this.pressBtn.classList.add('hidden');
            if (this.multiplierBadges) this.multiplierBadges.innerHTML = '';
            this.actionText.textContent = '';

            const pointsPerCat = this.state.currentHole;
            const valuePerCat = pointsPerCat * this.state.settings.baseBet;

            this.umbrellaPointsDisplay.textContent = pointsPerCat;
            this.umbrellaValueDisplay.textContent = '$' + valuePerCat;
            this.currentStakeDisplay.textContent = valuePerCat + '/pt';

            this.greenieBtns.forEach(btn => {
                const team = btn.dataset.team;
                if (team === this.state.umbrellaState.greenie) {
                    btn.classList.add('selected');
                    btn.style.background = 'var(--primary-green)';
                    btn.style.color = 'black';
                } else {
                    btn.classList.remove('selected');
                    btn.style.background = 'none';
                    btn.style.color = 'white';
                }
            });
        }
    }

    applyMultiplier(value, label, team) {
        // Validation handled by caller (handleRoll/ReRoll) typically, 
        // but here we just execute the state change requested by the UI interaction.
        // Actually, handleRoll logic (who can roll) should be checked beforehand.
        // We will assume handleRoll/handleReRoll calls this after validation.

        this.state.holeState.multiplier = value;

        // Log the aggression
        if (team && value > 1) {
            // Update UI with Aggressor info
            if (this.stakesText) {
                const teamName = this.state.teams[team].name;
                this.stakesText.innerText = `STAKES: ${value}x (${label} By ${teamName})`;
            }

            // Update Stats
            if (!this.state.rollsCalled) this.state.rollsCalled = { team1: 0, team2: 0 };
            if (!this.state.aggressorLog) this.state.aggressorLog = [];

            this.state.rollsCalled[team]++;
            this.state.aggressorLog.push({
                hole: this.state.currentHole,
                multiplier: value,
                calledBy: team
            });
        }

        this.updateUI();
        this.saveState();
    }

    handleRoll() {
        if (this.state.gameMode !== 'roll') return;
        const teamWithHonor = this.state.honor;
        const rollingTeam = teamWithHonor === 'team1' ? 'team2' : 'team1';

        this.state.holeState.rolledBy = rollingTeam;
        this.applyMultiplier(2, "ROLL 'EM!", rollingTeam);
    }

    handleReRoll() {
        const roller = this.state.holeState.rolledBy;
        const reRoller = roller === 'team1' ? 'team2' : 'team1';

        this.state.holeState.reRolled = true;
        this.applyMultiplier(4, "RE-ROLL!", reRoller);
    }

    handlePress() {
        try {
            if (this.state.holeState.rolledBy) return;

            const amount = parseInt(this.state.settings.baseBet) || 1;

            // Immediate Action (No Confirm Dialog)
            if (!this.state.holeState.presses) this.state.holeState.presses = [];
            this.state.holeState.presses.push(amount);

            if (this.pressModal) this.pressModal.classList.add('hidden');

            this.updateUI();
            this.saveState();

            // Optional: Small toast notification? 
            // For now, the UI update (Pot change + Badge) triggers immediately.
        } catch (e) {
            alert("Error in Press: " + e.message);
            console.error(e);
        }
    }

    calculateUmbrellaPoints(result) {
        let basePoints = 6; // Standard Umbrella value
        let multiplier = result.isRoll || 1;

        // Check for the Sweep
        // Ensure we have a winner (not 'tie') and all match
        const isSweep = (result.lowBallWinner !== 'tie') &&
            (result.lowBallWinner === result.lowTotalWinner) &&
            (result.lowBallWinner === result.birdieWinner);

        if (isSweep) {
            multiplier *= 2; // Double for the Sweep
            this.displayMessage("🧹 SWEEP! Points Doubled!");
        }

        let finalPoints = basePoints * multiplier;
        return finalPoints;
    }

    displayMessage(msg) {
        // Create a simple toast
        const toast = document.createElement('div');
        toast.textContent = msg;
        toast.style.position = 'fixed';
        toast.style.top = '100px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.backgroundColor = 'var(--accent, #d4af37)';
        toast.style.color = 'black';
        toast.style.padding = '15px 30px';
        toast.style.borderRadius = '50px';
        toast.style.fontWeight = '800';
        toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
        toast.style.zIndex = '9999';
        toast.style.opacity = '0';
        toast.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        toast.style.textAlign = 'center';
        toast.style.border = '2px solid white';
        toast.style.fontSize = '1.2rem';

        document.body.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) scale(1.1)';
        });

        // Slight bounce back
        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) scale(1)';
        }, 300);

        // Remove after 3s
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // submitPress() { ... } // Deprecated by Auto-Double Press logic

    finishHole() {
        try {
            // Check for duplicate submission (Safety Check)
            if (this.state.history.find(h => h.hole === this.state.currentHole)) {
                // If hole already exists, maybe we just need to advance?
                // Or Alert user.
                // alert(`Hole ${this.state.currentHole} already recorded. Advancing...`);
                // Force advance
                let next = this.state.currentHole + 1;
                if (next > 18) next = 1;
                this.state.currentHole = next;
                this.initHole();
                this.saveState();
                this.updateUI();
                return;
            }

            const s1 = parseInt(this.p1ScoreInput.value);
            const s2 = parseInt(this.p2ScoreInput.value);
            const s3 = parseInt(this.p3ScoreInput.value);
            const s4 = parseInt(this.p4ScoreInput.value);

            const count = this.state.playerCount || 4;
            let valid = !isNaN(s1);
            if (count > 2) valid = valid && !isNaN(s2);
            valid = valid && !isNaN(s3);
            if (count > 2) valid = valid && !isNaN(s4);

            if (!valid) {
                alert("Please enter scores for all players");
                return;
            }

            const indexes = this.state.course ? this.state.course.indexes : STROKE_INDEXES;
            const currentHoleIndex = indexes[(this.state.currentHole - 1) % 18];
            const playingHcps = this.getPlayingHandicaps();

            const calcNet = (gross, pid) => gross - this.getPops(playingHcps[pid], currentHoleIndex);

            const n1 = calcNet(s1, 'p1');
            const n2 = isNaN(s2) ? 999 : calcNet(s2, 'p2');
            const n3 = calcNet(s3, 'p3');
            const n4 = isNaN(s4) ? 999 : calcNet(s4, 'p4');

            let t1Best, t2Best;
            if (count === 2) {
                t1Best = n1;
                t2Best = n3;
            } else {
                t1Best = Math.min(n1, n2);
                t2Best = Math.min(n3, n4);
            }

            let winner = null;
            let amount = 0;
            let previousHonor = this.state.honor;
            let finalHoleState = JSON.parse(JSON.stringify(this.state.holeState));
            let holeResult = null;

            if (this.state.gameMode === 'roll') {
                const pressTotal = (this.state.holeState.presses || []).reduce((a, b) => a + b, 0);
                const currentPoint = (this.state.settings.baseBet + pressTotal) * this.state.holeState.multiplier;
                amount = currentPoint;

                if (!this.state.settings.enableHiLow) {
                    if (t1Best < t2Best) {
                        winner = 'team1';
                        this.state.teams.team1.balance += amount;
                        this.state.teams.team2.balance -= amount;
                        this.state.honor = 'team1';
                    } else if (t2Best < t1Best) {
                        winner = 'team2';
                        this.state.teams.team2.balance += amount;
                        this.state.teams.team1.balance -= amount;
                        this.state.honor = 'team2';
                    } else {
                        winner = 'tie';
                    }
                }

                // Hi-Low Logic
                if (this.state.settings.enableHiLow) {
                    let netSwing = 0;
                    // Check Low Score
                    if (t1Best < t2Best) netSwing += currentPoint;
                    else if (t2Best < t1Best) netSwing -= currentPoint;

                    // Check High Score (High Net)
                    // Point goes to team WITHOUT the high score (so LOWER High Score wins)
                    const t1W = Math.max(n1, n2);
                    const t2W = Math.max(n3, n4);

                    if (t1W < t2W) netSwing += currentPoint;
                    else if (t2W < t1W) netSwing -= currentPoint;

                    if (netSwing !== 0) {
                        this.state.teams.team1.balance += netSwing;
                        this.state.teams.team2.balance -= netSwing;
                    }
                    amount = Math.abs(netSwing);
                    if (netSwing > 0) winner = 'team1';
                    else if (netSwing < 0) winner = 'team2';
                    else winner = 'tie';

                    if (t1Best < t2Best) this.state.honor = 'team1';
                    else if (t2Best < t1Best) this.state.honor = 'team2';
                }

                // Auto-Press
                if ((this.state.holeState.presses || []).length > 0) {
                    this.state.settings.baseBet = this.state.settings.baseBet + pressTotal;
                }

            } else if (this.state.gameMode === 'umbrella') {
                // Determine Winners for each component
                let lowBallWinner = 'tie';
                if (t1Best < t2Best) lowBallWinner = 'team1';
                else if (t2Best < t1Best) lowBallWinner = 'team2';

                let lowTotalWinner = 'tie';
                const t1Sum = n1 + n2;
                const t2Sum = n3 + n4;
                if (t1Sum < t2Sum) lowTotalWinner = 'team1';
                else if (t2Sum < t1Sum) lowTotalWinner = 'team2';

                // Map 'greenie' from state to 'birdieWinner'
                // 'greenie' in state is 'team1', 'team2', or 'none'/'tie'
                let birdieWinner = this.state.umbrellaState.greenie;
                if (birdieWinner === 'none') birdieWinner = 'tie';

                // Construct result object
                holeResult = {
                    lowBallWinner: lowBallWinner,
                    lowTotalWinner: lowTotalWinner,
                    birdieWinner: birdieWinner,
                    isRoll: this.state.holeState.multiplier // Use existing multiplier (default 1)
                };

                // Calculate Total Points Value for the hole
                const totalPoints = this.calculateUmbrellaPoints(holeResult);

                // Value per component (Low Ball, Low Total, Birdie)
                const pointsPerComponent = totalPoints / 3;

                let ptsT1 = 0;
                let ptsT2 = 0;

                // Sum points based on winners
                if (lowBallWinner === 'team1') ptsT1 += pointsPerComponent;
                else if (lowBallWinner === 'team2') ptsT2 += pointsPerComponent;

                if (lowTotalWinner === 'team1') ptsT1 += pointsPerComponent;
                else if (lowTotalWinner === 'team2') ptsT2 += pointsPerComponent;

                if (birdieWinner === 'team1') ptsT1 += pointsPerComponent;
                else if (birdieWinner === 'team2') ptsT2 += pointsPerComponent;

                // Calculate Net Amount
                const netPts = ptsT1 - ptsT2;
                amount = netPts * this.state.settings.baseBet;

                this.state.teams.team1.balance += amount;
                this.state.teams.team2.balance -= amount;

                if (amount > 0) winner = 'team1';
                else if (amount < 0) winner = 'team2';
                else winner = 'tie';
                amount = Math.abs(amount);

                if (t1Best < t2Best) this.state.honor = 'team1';
                else if (t2Best < t1Best) this.state.honor = 'team2';
            }

            // SIDE GAME: Hi Low (Runs if enabled AND not Umbrella mode? Or allow with Umbrella? Let's allow with Roll only for now as requested)
            // User said "included in Roll Re-Roll".
            // Duplicate Hi-Low Logic Removed (Step 827 Fix)

            // Log history with snapshot
            this.state.history.push({
                hole: this.state.currentHole,
                winner,
                amount,
                scores: `(${n1},${n2}) vs (${n3},${n4})`,
                detailedScores: { p1: s1, p2: s2, p3: s3, p4: s4 },
                previousHonor,
                finalHoleState,
                holeResult
            });

            // Advance Hole Logic
            this.updateScoreboardDOM(); // Save history to board first

            if (this.state.history.length >= this.state.totalHoles) {
                alert("Match Complete! View Final Standings.");
                this.toggleScoreboard(true);
            } else {
                let nextHole = this.state.currentHole + 1;
                if (nextHole > 18) nextHole = 1; // Wrap around for 9-hole matches starting on 10, or restarts

                this.state.currentHole = nextHole;
                console.log(`Advancing to Hole ${this.state.currentHole}`);

                // Reset UI for next hole
                this.resetHoleUI();

                this.initHole();
                this.saveState();
                this.updateUI();
            }
        } catch (e) {
            alert("Critical Error finishing hole: " + e.message);
            console.error(e);
        }
    }

    updateScoreboardDOM() {
        this.t1Summary.querySelector('.money').textContent = this.formatMoney(this.state.teams.team1.balance);
        this.t2Summary.querySelector('.money').textContent = this.formatMoney(this.state.teams.team2.balance);

        // Update Aggressor Stats
        const stats = this.state.rollsCalled || { team1: 0, team2: 0 };
        const elA = document.getElementById('team-a-presses');
        const elB = document.getElementById('team-b-presses');

        if (elA) elA.textContent = stats.team1;
        if (elB) elB.textContent = stats.team2;

        // Calculate Payouts
        const bal = this.state.teams.team1.balance;
        const amount = Math.abs(bal);

        if (this.payoutSummary) {
            this.payoutSummary.classList.remove('hidden');
            if (bal > 0) {
                this.payoutInstruction.textContent = `${this.state.teams.team2.name} owes ${this.state.teams.team1.name}`;
                this.payoutAmount.textContent = `$${amount}`;
                this.payoutAmount.style.color = 'var(--primary-green)'; // Winner Green
            } else if (bal < 0) {
                this.payoutInstruction.textContent = `${this.state.teams.team1.name} owes ${this.state.teams.team2.name}`;
                this.payoutAmount.textContent = `$${amount}`;
                this.payoutAmount.style.color = '#ff4444'; // Loser/Negative Red (or green for winner perspective? User said "Winner's circle feel special", usually payout is winner amount. Let's keep it green/accent.)
                // User CSS: color: #39FF14; (Neon Green). So let's stick to the CSS class default mostly, or override if needed.
                // Actually the CSS sets it to #39FF14. I shouldn't override to red. Payout is usually positive "Amount Owed".
                this.payoutAmount.style.color = ''; // Use CSS default
            } else {
                this.payoutInstruction.textContent = "Match is All Square";
                this.payoutAmount.textContent = "$0";
            }
        }

        // History text removed as per request
        this.holeHistory.innerHTML = '';

        // Generate Scorecard Table
        const scorecardContainer = document.getElementById('scorecard-container');
        if (scorecardContainer && this.state.course) {

            // Get MATCH Handicaps (pops relative to low player)
            const playingHcps = this.getPlayingHandicaps();

            // Header Row
            let tableHTML = '<table class="scorecard-table"><thead><tr><th style="min-width:70px; text-align:left;">Hole</th>';
            for (let i = 1; i <= 9; i++) tableHTML += `<th>${i}</th>`;
            tableHTML += '<th>OUT</th>';
            for (let i = 10; i <= 18; i++) tableHTML += `<th>${i}</th>`;
            tableHTML += '<th>IN</th><th>TOT</th></tr></thead><tbody>';

            // Par Row
            const pars = this.state.course.pars || Array(18).fill(4);
            const indexes = this.state.course.indexes || Array(18).fill('-');

            let parOut = 0;
            let parIn = 0;


            tableHTML += '<tr><td class="player-name-cell" style="color:var(--text-dim)">Par</td>';
            for (let i = 0; i < 9; i++) {
                parOut += pars[i];
                tableHTML += `<td>${pars[i]}</td>`;
            }
            tableHTML += `<td class="total-cell">${parOut}</td>`;
            for (let i = 9; i < 18; i++) {
                parIn += pars[i];
                tableHTML += `<td>${pars[i]}</td>`;
            }
            tableHTML += `<td class="total-cell">${parIn}</td><td class="total-cell">${parOut + parIn}</td></tr>`;

            // Hcp Row
            tableHTML += '<tr><td class="player-name-cell" style="color:var(--text-dim)">Hcp</td>';
            for (let i = 0; i < 9; i++) tableHTML += `<td>${indexes[i]}</td>`;
            tableHTML += '<td class="total-cell"></td>';
            for (let i = 9; i < 18; i++) tableHTML += `<td>${indexes[i]}</td>`;
            tableHTML += '<td class="total-cell"></td><td class="total-cell"></td></tr>';

            // Hcp Row Removed as per request

            const players = ['p1', 'p2', 'p3', 'p4'];
            players.forEach(pid => {
                tableHTML += `<tr><td class="player-name-cell">${this.state.players[pid].name}</td>`;

                let outTotal = 0;
                let inTotal = 0;
                // Match Hcp for this player
                const pHcp = playingHcps[pid];

                // Front 9 (1-9)
                for (let i = 1; i <= 9; i++) {
                    const h = this.state.history.find(hist => hist.hole === i);

                    // Score with indicators
                    let displayScore = '-';
                    let indicators = '';

                    // Calculate Pop Dot
                    const cIndexes = (this.state.course && this.state.course.indexes) ? this.state.course.indexes : STROKE_INDEXES;
                    const hIdx = cIndexes[(i - 1) % 18];
                    const pop = this.getPops(pHcp, hIdx);
                    if (pop > 0) {
                        indicators += `<span style="display:inline-block; width:4px; height:4px; border-radius:50%; background:gold; margin-left:2px; vertical-align:top;" title="${pop} Pops"></span>`;
                    }

                    if (h && h.detailedScores && h.detailedScores[pid] !== undefined) {
                        displayScore = h.detailedScores[pid];
                        outTotal += displayScore;

                        // Find Min/Max for this hole to show indicators
                        const scores = h.detailedScores;
                        const vals = Object.values(scores).filter(v => typeof v === 'number');

                        if (vals.length > 0) {
                            // HI-LO LOGIC (Strict, using Net Scores)
                            if (this.state.settings.enableHiLow) {
                                // Helper to get Net Score
                                const getNet = (p) => {
                                    const gross = scores[p];
                                    if (typeof gross !== 'number') return 999;
                                    const cIndexes = (this.state.course && this.state.course.indexes) ? this.state.course.indexes : STROKE_INDEXES;
                                    const hIdx = cIndexes[(i - 1) % 18];
                                    const pop = this.getPops(playingHcps[p], hIdx);
                                    return gross - pop;
                                };

                                const net1 = getNet('p1'), net2 = getNet('p2'), net3 = getNet('p3'), net4 = getNet('p4');

                                if (net1 < 900 && net2 < 900 && net3 < 900 && net4 < 900) {
                                    const t1Best = Math.min(net1, net2);
                                    const t2Best = Math.min(net3, net4);

                                    // Tie Rule: No dots if Low is tied
                                    if (t1Best !== t2Best) {
                                        const t1Worst = Math.max(net1, net2);
                                        const t2Worst = Math.max(net3, net4);

                                        const isT1 = (pid === 'p1' || pid === 'p2');
                                        const myTeam = isT1 ? 'team1' : 'team2';

                                        // Low Win
                                        const lowWinner = (t1Best < t2Best) ? 'team1' : 'team2';
                                        if (lowWinner === myTeam) {
                                            const myNet = getNet(pid);
                                            const teamBest = isT1 ? t1Best : t2Best;

                                            // Mark if I contributed the best score
                                            if (myNet === teamBest) {
                                                indicators += '<span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:var(--primary-green); margin-left:4px; vertical-align:middle;" title="Low Winner"></span>';
                                            }
                                        }

                                        // High Loss (Higher Worst Ball)
                                        let highLoser = null;
                                        if (t1Worst < t2Worst) highLoser = 'team2';
                                        else if (t2Worst < t1Worst) highLoser = 'team1';

                                        if (highLoser === myTeam) {
                                            const myNet = getNet(pid);
                                            const teamWorst = isT1 ? t1Worst : t2Worst;
                                            // Mark if I contributed the worst score
                                            if (myNet === teamWorst) {
                                                indicators += '<span style="color:#ff4444; font-weight:900; margin-left:4px; font-size:12px;" title="High Total">✕</span>';
                                            }
                                        }
                                    }
                                }
                            } else {
                                // STANDARD LOGIC (Min/Max)
                                const minVal = Math.min(...vals);
                                const maxVal = Math.max(...vals);

                                // Low Score (Green)
                                if (displayScore === minVal) {
                                    indicators += '<span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:var(--primary-green); margin-left:4px; vertical-align:middle;"></span>';
                                }
                                // High Score (Red)
                                if (displayScore === maxVal && minVal !== maxVal) {
                                    indicators += '<span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#ff4444; margin-left:4px; vertical-align:middle;"></span>';
                                }
                            }
                        }
                    }

                    // Always show indicators (like pops) even if score not entered
                    displayScore = `${displayScore}${indicators}`;
                    tableHTML += `<td>${displayScore}</td>`;
                }
                tableHTML += `<td class="total-cell">${outTotal || '-'}</td>`;

                // Back 9 (10-18)
                for (let i = 10; i <= 18; i++) {
                    const h = this.state.history.find(hist => hist.hole === i);
                    let displayScore = '-';
                    let indicators = '';

                    // Calculate Pop Dot
                    const cIndexes = (this.state.course && this.state.course.indexes) ? this.state.course.indexes : STROKE_INDEXES;
                    const hIdx = cIndexes[(i - 1) % 18];
                    const pop = this.getPops(pHcp, hIdx);
                    if (pop > 0) {
                        indicators += `<span style="display:inline-block; width:4px; height:4px; border-radius:50%; background:gold; margin-left:2px; vertical-align:top;" title="${pop} Pops"></span>`;
                    }

                    if (h && h.detailedScores && h.detailedScores[pid] !== undefined) {
                        displayScore = h.detailedScores[pid];
                        inTotal += displayScore;

                        const scores = h.detailedScores;
                        const vals = Object.values(scores).filter(v => typeof v === 'number');
                        if (vals.length > 0) {
                            const minVal = Math.min(...vals);
                            const maxVal = Math.max(...vals);

                            if (displayScore === minVal) {
                                indicators += '<span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:var(--primary-green); margin-left:4px; vertical-align:middle;"></span>';
                            }
                            if (displayScore === maxVal && minVal !== maxVal) {
                                indicators += '<span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#ff4444; margin-left:4px; vertical-align:middle;"></span>';
                            }
                        }
                    }

                    // Always show indicators (like pops) even if score not entered
                    displayScore = `${displayScore}${indicators}`;
                    tableHTML += `<td>${displayScore}</td>`;
                }
                tableHTML += `<td class="total-cell">${inTotal || '-'}</td>`;

                // Grand Total
                const grandTotal = (outTotal || 0) + (inTotal || 0);
                const grandDisplay = (outTotal || inTotal) ? grandTotal : '-';
                tableHTML += `<td class="total-cell" style="color:white; border-left:1px solid rgba(255,255,255,0.1)">${grandDisplay}</td></tr>`;

                // Team Total Insertion
                if (pid === 'p2' || pid === 'p4') {
                    const isT1 = (pid === 'p2');
                    const teamName = isT1 ? 'Team 1 Total' : 'Team 2 Total';
                    const targetWinner = isT1 ? 'team1' : 'team2';

                    tableHTML += `<tr style="border-top:1px solid rgba(255,255,255,0.1); background:rgba(0,0,0,0.15); font-weight:bold;">
                        <td style="text-align:left; color:var(--accent); font-size:0.9rem;">${teamName}</td>`;

                    let tOut = 0;
                    // Front 9
                    for (let i = 1; i <= 9; i++) {
                        const h = this.state.history.find(hist => hist.hole === i);
                        let disp = '';
                        if (h) {
                            const amt = h.amount || 0;
                            if (h.winner === targetWinner) {
                                disp = `<span style="color:var(--primary-green)">+${amt}</span>`;
                                tOut += amt;
                            } else if (h.winner !== 'tie' && h.winner) {
                                disp = `<span style="color:#ff4444">-${amt}</span>`;
                                tOut -= amt;
                            }
                        }
                        tableHTML += `<td>${disp}</td>`;
                    }
                    tableHTML += `<td class="total-cell" style="color:${tOut >= 0 ? 'var(--primary-green)' : '#ff4444'}">${this.formatMoney(tOut)}</td>`;

                    let tIn = 0;
                    // Back 9
                    for (let i = 10; i <= 18; i++) {
                        const h = this.state.history.find(hist => hist.hole === i);
                        let disp = '';
                        if (h) {
                            const amt = h.amount || 0;
                            if (h.winner === targetWinner) {
                                disp = `<span style="color:var(--primary-green)">+${amt}</span>`;
                                tIn += amt;
                            } else if (h.winner !== 'tie' && h.winner) {
                                disp = `<span style="color:#ff4444">-${amt}</span>`;
                                tIn -= amt;
                            }
                        }
                        tableHTML += `<td>${disp}</td>`;
                    }
                    tableHTML += `<td class="total-cell" style="color:${tIn >= 0 ? 'var(--primary-green)' : '#ff4444'}">${this.formatMoney(tIn)}</td>`;

                    const tGrand = tOut + tIn;
                    tableHTML += `<td class="total-cell" style="color:${tGrand >= 0 ? 'var(--primary-green)' : '#ff4444'}">${this.formatMoney(tGrand)}</td></tr>`;
                }
            });
            tableHTML += '</tbody></table>';

            scorecardContainer.innerHTML = tableHTML;
        }
    }

    formatMoney(amount) {
        return amount >= 0 ? `+${amount}` : `${amount}`;
    }

    resetHoleUI() {
        // Clear input boxes for the next hole
        document.querySelectorAll('.score-input').forEach(input => input.value = '');

        // Reset the "Roll 'Em" multiplier to 1x and clear umbrella states
        if (this.state.holeState) {
            this.state.holeState.multiplier = 1;
        }

        // If you had a separate pot display function in User snippet, standard `updateUI` covers it here.
    }

    toggleScoreboard(show) {
        if (this.state.history.length > 0) this.updateScoreboardDOM();
        if (show) this.scoreboardModal.classList.remove('hidden');
        else this.scoreboardModal.classList.add('hidden');
    }

    archiveRound() {
        const history = JSON.parse(localStorage.getItem('wolfSeasonHistory')) || [];

        // Safety check
        if (!this.state.teams.team1 || !this.state.teams.team2) return;

        const bal = this.state.teams.team1.balance;
        const winner = bal > 0 ? this.state.teams.team1.name : (bal < 0 ? this.state.teams.team2.name : "Tie");

        // Determine Aggressor
        const stats = this.state.rollsCalled || { team1: 0, team2: 0 };
        const aggressor = stats.team1 > stats.team2 ? this.state.teams.team1.name : (stats.team2 > stats.team1 ? this.state.teams.team2.name : "Even");

        const currentRound = {
            date: new Date().toLocaleDateString(),
            course: this.state.course ? this.state.course.name : "Unknown Course",
            finalPayout: this.payoutAmount ? this.payoutAmount.textContent : "$0",
            winner: winner,
            aggressor: aggressor
        };

        // Avoid duplicates if clicked multiple times? 
        // Simple check: same date and time? or just push.
        history.push(currentRound);
        localStorage.setItem('wolfSeasonHistory', JSON.stringify(history));
        this.renderLeaderboard();

        // Optional: Alert user
        alert("Round Archived to Season Standings!");
    }

    renderLeaderboard() {
        if (!this.leaderboardBody) return;
        const history = JSON.parse(localStorage.getItem('wolfSeasonHistory')) || [];
        this.leaderboardBody.innerHTML = '';

        history.slice().reverse().forEach(round => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${round.date}</td>
                <td style="color:var(--text-light); font-weight:600;">${round.course}</td>
                <td><span style="color:var(--primary-green); font-weight:800;">${round.winner}</span> (${round.finalPayout})</td>
                <td style="color:var(--accent);">${round.aggressor}</td>
            `;
            this.leaderboardBody.appendChild(row);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new RollReRollGame();
});
