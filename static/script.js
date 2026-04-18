/**
 * JavaScript Frontend for Turing Machine Simulator
 * Handles UI interactions, API calls, and visualization
 */

// State management
let currentSimulation = null;
let machineInfo = null;
let isAnimating = false;
let isPaused = false;
let animationIntervals = [];
let stepLogCount = 0; // Track number of steps added to log

// Animation settings
const ANIMATION_DELAY = 600; // milliseconds between steps
const TAPE_CELL_WIDTH = 60;  // pixels
const TAPE_CELL_GAP = 8;     // pixels

// Initialization
document.addEventListener('DOMContentLoaded', function() {
    fetchMachineInfo();
    setupEventListeners();
});

/**
 * Fetch machine information from backend
 */
function fetchMachineInfo() {
    const language = document.getElementById('languageSelect')?.value || 'palindrome';
    fetch(`/info?language=${language}`)
        .then(response => response.json())
        .then(data => {
            machineInfo = data;
            displayMachineInfo(data);
            updateInputLabel(data.alphabet);
        })
        .catch(error => console.error('Error fetching machine info:', error));
}

function handleLanguageChange() {
    clearAll();
    fetchMachineInfo();
}

function updateInputLabel(alphabet) {
    const label = document.getElementById('inputStringLabel');
    const input = document.getElementById('inputString');
    if (label && alphabet) {
        label.textContent = `Enter a string (use only ${alphabet.map(a => `'${a}'`).join(', ')}):`;
    }
    if (input && alphabet) {
        input.placeholder = `e.g., ${alphabet.join('')}...`;
    }
}

/**
 * Display machine information
 */
function displayMachineInfo(info) {
    const statesEl = document.getElementById('states');
    if (statesEl) statesEl.textContent = Array.isArray(info.states) ? info.states.join(', ') : info.states;
    
    const acceptStateEl = document.getElementById('acceptState');
    if (acceptStateEl) acceptStateEl.textContent = info.accept_state;
    
    const alphabetEl = document.getElementById('alphabet');
    if (alphabetEl) alphabetEl.textContent = Array.isArray(info.alphabet) ? info.alphabet.join(', ') : info.alphabet;
    
    const descEl = document.getElementById('machineDescription');
    if (descEl) descEl.textContent = info.description || '';
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    const inputField = document.getElementById('inputString');
    
    // Allow Enter key to run simulation
    inputField.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            runSimulation();
        }
    });
}

/**
 * Run the Turing Machine simulation
 */
function runSimulation() {
    const inputString = document.getElementById('inputString').value.trim();
    const language = document.getElementById('languageSelect')?.value || 'palindrome';
    
    // Validate input
    if (!inputString && !['an_bn', 'an_bn_cn', 'equal_01'].includes(language)) {
        alert('Please enter a string');
        return;
    }
    
    if (inputString && machineInfo && machineInfo.alphabet) {
        const escapedAlphabet = machineInfo.alphabet.map(a => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('');
        const regex = new RegExp(`^[${escapedAlphabet}]*$`);
        if (!regex.test(inputString)) {
            alert(`Invalid input! Only use ${machineInfo.alphabet.join(', ')}.`);
            return;
        }
    }
    
    // Disable button during simulation
    const runButton = document.getElementById('runButton');
    runButton.disabled = true;
    runButton.classList.add('loading');
    runButton.textContent = 'Running...';
    
    // Send request to backend
    fetch('/simulate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: inputString, language: language })
    })
    .then(response => response.json())
    .then(data => {
        currentSimulation = data;
        displayResults(data);
    })
    .catch(error => {
        console.error('Error:', error);
        // alert('Error running simulation: ' + error.message);
    })
    .finally(() => {
        runButton.disabled = false;
        runButton.classList.remove('loading');
        runButton.textContent = 'Run Simulation';
    });
}

/**
 * Display simulation results
 */
function displayResults(data) {
    // Show result
    const resultDisplay = document.getElementById('resultDisplay');
    resultDisplay.textContent = data.result;
    resultDisplay.className = 'result-display ' + (data.result === 'ACCEPT' ? 'accept' : 'reject');
    document.getElementById('resultSection').style.display = 'block';
    
    // Show tape display section and start animation
    if (data.steps && data.steps.length > 0) {
        document.getElementById('tapeSection').style.display = 'block';
        document.getElementById('totalSteps').textContent = data.steps.length - 1;
        
        // Scroll to tape animation
        setTimeout(() => {
            document.getElementById('tapeSection').scrollIntoView({ behavior: 'smooth' });
        }, 100);
        
        // Start animation
        animateSteps(data.steps);
    }
    
    // Show detailed steps breakdown
    if (data.steps) {
        displaySteps(data.steps);
        document.getElementById('stepCount').textContent = data.total_steps;
        document.getElementById('stepsSection').style.display = 'block';
    }
    // Note: Removed forced scrolling - user can scroll freely to view sections
}

/**
 * Animate simulation steps with head movement, tape updates, AND persistent step log
 * @param {Array} steps - Array of simulation steps
 */
function animateSteps(steps) {
    if (isAnimating) {
        stopAnimation();
    }
    
    isAnimating = true;
    isPaused = false;
    stepLogCount = 0; // Reset log counter
    
    // Show step log section but keep the log itself hidden by default
    document.getElementById('stepLogSection').style.display = 'block';
    const stepLog = document.getElementById('stepLog');
    if (stepLog) {
        stepLog.innerHTML = '';
        stepLog.style.display = 'none';  // Keep log hidden initially
    }
    
    // Show animation controls
    document.getElementById('pauseButton').style.display = 'inline-block';
    document.getElementById('stopButton').style.display = 'inline-block';
    
    function displayStep(stepIndex) {
        if (!isAnimating || stepIndex >= steps.length) {
            if (isAnimating) {
                // Animation complete
                isAnimating = false;
                document.getElementById('pauseButton').style.display = 'none';
                document.getElementById('resumeButton').style.display = 'none';
                document.getElementById('stopButton').style.display = 'none';
            }
            return;
        }
        
        if (isPaused) {
            const pauseTimer = setTimeout(() => {
                if (isPaused) {
                    displayStep(stepIndex);
                }
            }, 100);
            animationIntervals.push(pauseTimer);
            return;
        }
        
        const step = steps[stepIndex];
        
        // Skip error steps
        if (step.error) {
            displayStep(stepIndex + 1);
            return;
        }
        
        // Update tape display with drawTape function
        drawTape(step.tape, step.head_pos);
        
        // Append step to persistent log
        appendStepLog(step, stepIndex);
        
        // Update state and position display
        document.getElementById('currentState').textContent = step.state;
        document.getElementById('currentPosition').textContent = step.head_pos;
        document.getElementById('currentStep').textContent = stepIndex;
        
        // Schedule next step
        const timer = setTimeout(() => {
            displayStep(stepIndex + 1);
        }, ANIMATION_DELAY);
        
        animationIntervals.push(timer);
    }
    
    // Start the animation
    displayStep(0);
}

/**
 * Draw tape on the animated display
 * @param {string} tape - Tape content (e.g., "Xbaa_")
 * @param {number} head - Head position
 */
function drawTape(tape, head) {
    const tapeDisplay = document.getElementById('tapeDisplay');
    
    // Clear existing tape cells
    tapeDisplay.innerHTML = '';
    
    // Create tape cells
    for (let i = 0; i < tape.length; i++) {
        const cell = document.createElement('div');
        cell.className = 'tape-cell';
        cell.textContent = tape[i];
        cell.title = `Position ${i}`;
        
        // Add class based on symbol type
        if (tape[i] === 'X') {
            cell.classList.add('marked-a');
        } else if (tape[i] === 'Y') {
            cell.classList.add('marked-b');
        } else if (tape[i] === '_') {
            cell.style.color = '#999';
        }
        
        tapeDisplay.appendChild(cell);
    }
    
    // Update head pointer position with smooth animation
    const cellSize = TAPE_CELL_WIDTH + TAPE_CELL_GAP;
    const headPixelPos = head * cellSize + 20; // 20px padding
    const headPointer = document.getElementById('headPointer');
    headPointer.style.left = headPixelPos + 'px';
}

/**
 * Append a step entry to the step log
 * @param {Object} step - Step object with tape, head_pos, state, action
 * @param {number} index - Step index
 */
function appendStepLog(step, index) {
    const stepLog = document.getElementById('stepLog');
    if (!stepLog) return;
    
    // Create step entry
    const stepEntry = document.createElement('div');
    stepEntry.className = 'log-step';
    stepEntry.dataset.stepIndex = index;
    
    // Build tape display with HEAD marker
    let tapeDisplay = '';
    for (let i = 0; i < step.tape.length; i++) {
        const symbol = step.tape[i];
        const isHead = i === step.head_pos ? ' ◄ HEAD' : '';
        tapeDisplay += symbol + isHead + ' ';
    }
    
    // Add step content
    stepEntry.innerHTML = `
        <div class="log-step-header">Step ${index}</div>
        <div class="log-step-content">
            <div class="log-step-line"><strong>Tape:</strong> ${tapeDisplay.trim()}</div>
            <div class="log-step-line"><strong>Head Position:</strong> ${step.head_pos}</div>
            <div class="log-step-line"><strong>State:</strong> ${step.state}</div>
            <div class="log-step-line"><strong>Action:</strong> ${step.action}</div>
        </div>
    `;
    
    stepLog.appendChild(stepEntry);
    stepLogCount++;
    // Note: Removed auto-scroll - user can scroll log freely
}

/**
 * Toggle step log visibility
 */
function toggleStepLog() {
    const stepLog = document.getElementById('stepLog');
    const toggleBtn = document.getElementById('toggleLogBtn');
    
    if (stepLog.style.display === 'none') {
        stepLog.style.display = 'block';
        toggleBtn.textContent = 'Hide Log';
        toggleBtn.style.background = '#27ae60';
        // Scroll to log when showing
        stepLog.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        stepLog.style.display = 'none';
        toggleBtn.textContent = 'Show Log';
        toggleBtn.style.background = '#95a5a6';
    }
}

/**
 * Update the tape display for a given step (legacy - calls drawTape)
 * @param {Object} step - Step object containing tape, head_pos, state
 */
function updateTapeDisplay(step) {
    drawTape(step.tape, step.head_pos);
}

/**
 * Pause the animation
 */
function togglePauseAnimation() {
    if (!isAnimating) return;
    
    isPaused = true;
    document.getElementById('pauseButton').style.display = 'none';
    document.getElementById('resumeButton').style.display = 'inline-block';
}

/**
 * Resume the animation
 */
function resumeAnimation() {
    if (!isAnimating) return;
    
    isPaused = false;
    document.getElementById('pauseButton').style.display = 'inline-block';
    document.getElementById('resumeButton').style.display = 'none';
}

/**
 * Stop the animation
 */
function stopAnimation() {
    isAnimating = false;
    isPaused = false;
    
    // Clear all scheduled timeouts
    animationIntervals.forEach(interval => clearTimeout(interval));
    animationIntervals = [];
    
    // Hide animation controls
    document.getElementById('pauseButton').style.display = 'none';
    document.getElementById('resumeButton').style.display = 'none';
    document.getElementById('stopButton').style.display = 'none';
}

/**
 * Display the final tape visualization (deprecated - using animation instead)
 */
function displayTape(step) {
    updateTapeDisplay(step);
}

/**
 * Display execution steps in the steps section
 */
function displaySteps(steps) {
    const stepsContainer = document.getElementById('stepsContainer');
    stepsContainer.innerHTML = '';
    
    steps.forEach((step, index) => {
        if (step.error) {
            // Display error step
            const errorItem = document.createElement('div');
            errorItem.className = 'step-item expanded';
            errorItem.innerHTML = `
                <div class="step-header" style="background: #fadbd8;">
                    <span style="color: #e74c3c;">Error: ${step.error}</span>
                </div>
            `;
            stepsContainer.appendChild(errorItem);
            return;
        }
        
        const stepItem = document.createElement('div');
        stepItem.className = 'step-item';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'step-header';
        header.textContent = `Step ${step.step}: ${step.state}`;
        header.onclick = () => stepItem.classList.toggle('expanded');
        
        // Create details
        const details = document.createElement('div');
        details.className = 'step-details';
        
        let tapeDisplay = '';
        const headPos = step.head_pos;
        for (let i = 0; i < step.tape.length; i++) {
            let marker = '';
            if (i === headPos) {
                marker = ' ◄ HEAD';
            }
            tapeDisplay += step.tape[i] + marker + ' ';
        }
        
        details.innerHTML = `
            <div class="step-detail-item">
                <strong>Tape:</strong> ${tapeDisplay}
            </div>
            <div class="step-detail-item">
                <strong>Head Position:</strong> ${step.head_pos}
            </div>
            <div class="step-detail-item">
                <strong>State:</strong> ${step.state}
            </div>
            <div class="step-detail-item">
                <strong>Action:</strong> ${step.action}
            </div>
        `;
        
        stepItem.appendChild(header);
        stepItem.appendChild(details);
        stepsContainer.appendChild(stepItem);
    });
}

/**
 * Toggle all steps expanded/collapsed
 */
function toggleAllSteps() {
    const stepItems = document.querySelectorAll('.step-item');
    const allExpanded = Array.from(stepItems).every(item => item.classList.contains('expanded'));
    
    stepItems.forEach(item => {
        if (allExpanded) {
            item.classList.remove('expanded');
        } else {
            item.classList.add('expanded');
        }
    });
}

/**
 * Scroll to a specific step
 */
function scrollToStep(stepIndex) {
    const stepItems = document.querySelectorAll('.step-item');
    if (stepIndex === -1) {
        stepIndex = stepItems.length - 1;
    }
    
    if (stepIndex >= 0 && stepIndex < stepItems.length) {
        stepItems[stepIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
        stepItems[stepIndex].classList.add('expanded');
    }
}

/**
 * Clear all results and input
 */
function clearAll() {
    stopAnimation();
    document.getElementById('inputString').value = '';
    document.getElementById('resultSection').style.display = 'none';
    document.getElementById('tapeSection').style.display = 'none';
    document.getElementById('stepsSection').style.display = 'none';
    document.getElementById('stepLogSection').style.display = 'none';
    const stepLog = document.getElementById('stepLog');
    if (stepLog) {
        stepLog.innerHTML = '';
    }
    stepLogCount = 0;
    currentSimulation = null;
    document.getElementById('inputString').focus();
}
