// ====================================================================
// PASTE YOUR FIREBASE CONFIG HERE AGAIN
// ====================================================================
const firebaseConfig = {
    apiKey: "AIzaSyC1yRE-ql0TzjcdtVfRJxCGfMwikF9oBos",
    authDomain: "cosmiccollectorapp.firebaseapp.com",
    projectId: "cosmiccollectorapp", 
};
// ====================================================================

const app = firebase.initializeApp(firebaseConfig);
const db = app.firestore();
const auth = app.auth();

// DOM Elements
const playerStatus = document.getElementById('playerStatus');
const logoutButton = document.getElementById('logoutButton');
const gameArea = document.getElementById('gameArea');
const missionTitle = document.getElementById('missionTitle');
const challengeContainer = document.getElementById('challengeContainer');
const actionButton = document.getElementById('actionButton');

// Level Data
const EARTH_LEVEL = {
    title: "Mission 1: The Water Cycle",
    points: 100,
    next: "moon"
};

// --- AUTH CHECK ---
auth.onAuthStateChanged((user) => {
    if (user) {
        playerStatus.textContent = `Commander: ${user.displayName}`;
        // Load data and start game
        loadDataAndStart(user.uid);
    } else {
        // If not logged in, kick them back to login page
        window.location.href = "index.html";
    }
});

// --- LOGOUT ---
logoutButton.addEventListener('click', () => {
    auth.signOut().then(() => {
        window.location.href = "index.html";
    });
});

// --- DATA LOADING ---
async function loadDataAndStart(userId) {
    const docRef = db.collection("users").doc(userId);
    let userData;

    try {
        const doc = await docRef.get();
        
        if (doc.exists) {
            userData = doc.data();
        } else {
            // Create Default Data
            userData = { 
                fuelPoints: 0, 
                unlockedPlanets: ["earth"] 
            };
            await docRef.set(userData);
        }

        // Update UI with loaded data
        playerStatus.textContent += ` | Fuel: ${userData.fuelPoints}`;
        
        // START THE LEVEL UI (This runs ONLY on success)
        startGameUI(userData);

    } catch (error) {
        console.error("Firestore Load Error:", error);
        playerStatus.textContent += " | ❌ Offline Mode";
        // Start game with default data if offline so user sees something
        startGameUI({ fuelPoints: 0, unlockedPlanets: ["earth"] }); 
    }
}

// --- GAME UI FUNCTIONS ---
function startGameUI(userData) {
    // Show the game container
    gameArea.style.display = "block";
    missionTitle.textContent = EARTH_LEVEL.title;

    // Check if user has finished this planet
    if (userData.unlockedPlanets.includes(EARTH_LEVEL.next)) {
        challengeContainer.innerHTML = "<p>✅ Mission Complete! You've mastered the Water Cycle.</p>";
        actionButton.style.display = "none";
    } else {
        // Show Interactive Intro
        challengeContainer.innerHTML = `
            <div style="text-align:center;">
                <p>Commander! We need to understand how water moves on Earth.</p>
                <p><strong>Tap the Orange Buttons</strong> below to see the cycle in action!</p>
            </div>

            <div class="scene-container" id="waterScene">
                <div class="sun">☀️</div>
                <div id="darkCloud" style="position: absolute; top: -100px; left: -100px; font-size: 100px; opacity: 0; color: #444444; z-index: 50;">⛈️</div>
                <div id="aircraft" style="position: absolute; top: 150px; left: 100%; font-size: 50px; z-index: 40; animation: flyLoop 20s linear infinite;">🚁</div>
                <div class="cloud" id="cloudMain" style="opacity:0.3; top: 30px; right: 50px; font-size: 60px;">☁️</div>
                <div class="cloud" id="cloudSmall1" style="opacity:0.2; top: 80px; left: 150px; font-size: 30px;">☁️</div>
                <div class="cloud" id="cloudSmall2" style="opacity:0.2; top: 50px; right: 10px; font-size: 40px;">☁️</div>
                <div class="cloud" id="cloudBig1" style="opacity:0.2; top: 90px; right: 25px; font-size: 100px;">☁️</div>
                <div class="cloud" id="cloudCenter" style="opacity:0.3; top: 100px; left: 300px; font-size: 70px;">☁️</div>
                <div class="cloud" id="cloudCenterC1" style="opacity:0.3; top: 90px; left: 500px; font-size: 90px;">☁️</div>
                <div class="cloud" id="cloudCenterC2" style="opacity:0.3; top: 90px; left: 50px; font-size: 90px;">☁️</div>
                </div>

            <div style="text-align:center;">
                <button id="evapBtn" class="cycle-btn" onclick="animateEvaporation()">1. Evaporation 🔥</button>
                <button id="condBtn" class="cycle-btn" onclick="animateCondensation()">2. Condensation ☁️</button>
                <button id="precipBtn" class="cycle-btn" onclick="animatePrecipitation()">3. Precipitation 🌧️</button>
            </div>
            <div style="text-align:center;">
                 <button id="soundButton" class="cycle-btn" onclick="toggleBackgroundMusic()" style="background-color: #4CAF50;">
                    ▶️ Play Sound
                </button>
            </div>
            
            <p id="cycleStatus" style="text-align:center; font-style:italic; height: 30px;">Waiting for input...</p>
        `;
        
        actionButton.textContent = "I'm Ready! Start Challenge";
        
        // Define what happens when clicking Start
        actionButton.onclick = () => {
            startChallengeOne();
        };
        startBackgroundMusic();
        enableRandomInteractions();
    }
}
// ====================================================================
// 4. CHALLENGE LOGIC
// ====================================================================

// These variables manage the state of the quiz.
let challengeScore = 0;
let currentQIndex = 0;
let isChallengeActive = false;
// Define simple questions for the water cycle
const questions = [
    { id: 1, text: "The process where liquid water turns into vapor is called:", type: 'mc', correct: 'Evaporation', options: ['Precipitation', 'Condensation', 'Evaporation', 'Collection'] },
    { id: 2, text: "When water vapor cools and turns back into liquid droplets, forming clouds, this is:", type: 'mc', correct: 'Condensation', options: ['Evaporation', 'Infiltration', 'Condensation'] },
    { id: 3, text: "The term for water (rain, snow, hail) falling back to Earth is:", type: 'mc', correct: 'Precipitation', options: ['Condensation', 'Transpiration', 'Precipitation'] },
    { id: 4, text: "What is the primary energy source that drives the water cycle?", type: 'mc', correct: 'The Sun', options: ['The Moon', 'Earth’s Core', 'The Sun'] },
    { id: 5, text: "Which molecule is the main component of the water cycle?", type: 'mc', correct: 'H2O', options: ['CO2', 'O2', 'H2O'] }
];
/**
 * Initiates the challenge/quiz sequence.
 * @param {HTMLButtonElement} button - The button element that triggered the function.
 */
window.startChallengeOne = function(button) {
    isChallengeActive = true;
    // Disable simulation interaction buttons while the quiz is running
    disableCycleButtons(); 
    if (button) button.disabled = true;

    challengeScore = 0;
    currentQIndex = 0;
    renderQuestion();
}
/**
 * Renders the current question to the UI, or finishes the challenge if questions are complete.
 */
function renderQuestion() {
    if (!isChallengeActive) return;

    const container = document.getElementById('challengeContainer');
    if (currentQIndex >= questions.length) {
        finishChallenge();
        return;
    }
    const q = questions[currentQIndex];
    
    let html = `
        <div class="question-card">
            <h3 class="text-xl font-bold text-gray-800">Challenge Question ${currentQIndex + 1} of ${questions.length}</h3>
            <p class="text-lg my-4">${q.text}</p>
            <div class="flex flex-wrap justify-center challenge-options">
    `;
    
    q.options.forEach(opt => {
        // Attach checkAnswer function to each button click
        html += `<button class="challenge-option-btn" onclick="checkAnswer('${opt}', '${q.correct}')">${opt}</button>`;
    });
    
    html += `</div></div>`;
    container.innerHTML = html;
}
/**
 * Checks the user's multiple-choice answer against the correct answer.
 * @param {string} ans - The user's selected answer.
 * @param {string} corr - The correct answer.
 */
window.checkAnswer = function(ans, corr) {
    if(ans === corr) { 
        challengeScore++; 
        showModal("Correct! Great job, Commander.");
    } else {
        showModal(`Incorrect. The correct answer was: ${corr}`);
    }
    
    // Delay before moving to the next question
    setTimeout(() => {
        currentQIndex++;
        renderQuestion();
    }, 1000);
}
// --- ANIMATION HELPER FUNCTIONS ---
window.animateEvaporation = function() {
    const scene = document.getElementById('waterScene');
    document.getElementById('cycleStatus').textContent = "The Sun warms the ocean, turning water into invisible VAPOR (Gas)! Vapor is rising! 💨🔥";
    
    // Use a loop to create and animate three "puffs" of vapor
    for(let i = 0; i < 5; i++) {
        setTimeout(() => {
            const vapor = document.createElement('div');
            // Using a simple character or text to represent gas/vapor
            vapor.textContent = '⚬'; // Small white circle for vapor
            vapor.className = 'vapor-puff'; 
            vapor.style.color = '#FFFFFF'; // White color
            vapor.style.fontSize = '18px';
            
            // Positioning (similar to drops before, starting at the ocean)
            const startX = 25 + (i * 10); 
            vapor.style.bottom = '20px';
            vapor.style.left = startX + '%';
            vapor.style.position = 'absolute';
            vapor.style.opacity = '1';
            vapor.style.transition = 'all 2.5s ease-out';
            scene.appendChild(vapor);

            // Trigger the rise and fade (Evaporation)
            setTimeout(() => {
                vapor.style.bottom = '220px'; 
                vapor.style.left = (startX + 5) + '%';
                vapor.style.opacity = '0'; // Completely invisible at the top
            }, 50);

            // Clean up element after animation
            setTimeout(() => { vapor.remove(); }, 2600);
        }, i * 400); 
    }
}

window.animateCondensation = function() {
    document.getElementById('cycleStatus').textContent = "Water vapor cools down high up and CONDENSES into liquid droplets, forming BIGGER CLOUDS! 💧☁️";
    
    const cloudMain = document.getElementById('cloudMain');
    const cloudSmall1 = document.getElementById('cloudSmall1');
    const cloudSmall2 = document.getElementById('cloudSmall2');
    const cloudCenter = document.getElementById('cloudCenter');
    const cloudCenterC1 = document.getElementById('cloudCenterC1');
    const cloudCenterC2 = document.getElementById('cloudCenterC2');
    const scene = document.getElementById('waterScene');

    // 1. Cloud Appearance and Growth
    cloudMain.style.opacity = '1';
    cloudMain.style.transform = "scale(2.0)";
    cloudMain.style.color = "#bbbbbb";
    cloudCenter.style.opacity = '1';
    cloudCenter.style.transform = "scale(2.0)";
    cloudCenter.style.color = "#bbbbbb";
    cloudCenterC1.style.opacity = '1';
    cloudCenterC1.style.transform = "scale(2.0)";
    cloudCenterC1.style.color = "#bbbbbb";
    cloudCenterC2.style.opacity = '1';
    cloudCenterC2.style.transform = "scale(2.0)";
    cloudCenterC2.style.color = "#bbbbbb";
    
    cloudSmall1.style.opacity = '0';
    cloudSmall2.style.opacity = '0';
    cloudBig1.style.opacity = '0';
    cloudSmall1.style.transitionDuration = '1.5s';
    cloudSmall2.style.transitionDuration = '1.5s';
    cloudBig1.style.transitionDuration = '1.5s';

    // 2. Condensing Droplets Effect
    for (let i = 0; i < 5; i++) {
        // Create small liquid drops inside the cloud zone
        setTimeout(() => {
            const droplet = document.createElement('div');
            droplet.textContent = '💧';
            droplet.style.position = 'absolute';
            droplet.style.fontSize = '10px'; // Small droplet size
            droplet.style.opacity = '0';

            // Random position near the main cloud
            droplet.style.top = (40 + Math.random() * 50) + 'px';
            droplet.style.right = (50 + Math.random() * 80) + 'px';
            scene.appendChild(droplet);

            // Animate them to appear (fade in) inside the cloud
            setTimeout(() => {
                droplet.style.opacity = '1';
                droplet.style.transition = 'opacity 0.5s';
            }, 50);

            // Remove them shortly after the main cloud resets
            setTimeout(() => { droplet.remove(); }, 2000);
        }, i * 200);
    }
    
    // 3. Reset after animation
    setTimeout(() => { 
        cloudMain.style.transform = "scale(1.0)"; 
        cloudMain.style.color = ""; 
        cloudMain.style.opacity = "0.3";
        cloudCenter.style.transform = "scale(1.0)"; 
        cloudCenter.style.color = ""; 
        cloudCenter.style.opacity = "0.3";
        cloudCenterC1.style.transform = "scale(1.0)"; 
        cloudCenterC1.style.color = "";
        cloudCenterC1.style.opacity = "0.5";
        cloudCenterC2.style.transform = "scale(1.0)"; 
        cloudCenterC2.style.color = "";
        cloudCenterC2.style.opacity = "0.5";

        cloudSmall1.style.opacity = '0.2';
        cloudSmall2.style.opacity = '0.2';
        //cloudBig1.style.opacity = '0.2';
    }, 2000);
}

window.animatePrecipitation = function() {
    const scene = document.getElementById('waterScene');
    document.getElementById('cycleStatus').textContent = "The clouds get heavy and water falls as Rain (Precipitation)! 🌧️";
    
    const sun = document.querySelector('.sun'); // Get the sun element
    const darkCloud = document.getElementById('darkCloud'); // Get the dark cloud

    if (darkCloud) {
        // 1. Instant Reset to start position (off-screen, hidden, and blurred)
        darkCloud.style.transition = 'none'; // Disable transition for instant reset
        darkCloud.style.opacity = '0';
        darkCloud.style.top = '-100px';    
        darkCloud.style.left = '-100px';
        darkCloud.style.filter = 'blur(15px)'; // Start highly blurred
    
        // 2. Schedule the Slide-In (Transition enabled)
        setTimeout(() => {
            darkCloud.style.transition = 'all 0.5s ease-out'; // Enable transition
            darkCloud.style.opacity = '1';
            darkCloud.style.top = '10px';    // Slide it into position
            darkCloud.style.left = '10px';   
        }, 50); // Small delay to force the transition to take effect
        
        // 3. Schedule the Solid Appearance (Transition enabled, blur reduces)
        setTimeout(() => {
            darkCloud.style.transition = 'filter 0.5s ease-in'; // Switch transition focus
            darkCloud.style.filter = 'blur(0px)'; // Sharpen the cloud to solid
        }, 550); // Wait 50ms (delay) + 500ms (slide-in)
    }
    
    // 1. Define the source clouds (The ones that condensed and grew)
    const sourceClouds = [
        document.getElementById('cloudMain'),
        document.getElementById('cloudCenter'),
        document.getElementById('cloudCenterC1')
    ];

    // 2. Loop to create 15 falling drops from various clouds
    for(let i = 0; i < 35; i++) {
        setTimeout(() => {
            // Select a random cloud source for this drop
            const randomCloud = sourceClouds[Math.floor(Math.random() * sourceClouds.length)];

            // Get the current position of the chosen cloud (using its computed style properties)
            const cloudTop = parseInt(randomCloud.style.top);
            const cloudLeft = parseInt(randomCloud.style.left) || 0;
            const cloudRight = parseInt(randomCloud.style.right) || 0;
            
            // Determine the drop's horizontal starting point (must be within the cloud's width)
            // If using 'right', convert it to 'left' relative to the scene container (1004px width)
            let startLeft;
            if (cloudRight > 0) {
                // Approximate left position: Total width - cloud right position - some random offset
                startLeft = 1004 - cloudRight - (Math.random() * 50); 
            } else {
                // If using 'left', use its position + random offset within the cloud
                startLeft = cloudLeft + (Math.random() * 50); 
            }
            
            // Create the rain drop element
            const drop = document.createElement('div');
            drop.textContent = '💧';
            drop.className = 'water-drop';
            drop.style.position = 'absolute';
            
            // Set the starting position (just below the cloud)
            drop.style.top = (cloudTop + 50) + 'px'; // Start 50px below the cloud's top edge
            drop.style.left = startLeft + 'px';
            drop.style.fontSize = '20px'; // Make drops more visible

            scene.appendChild(drop);

            // 3. Trigger the fall animation
            setTimeout(() => {
                // We calculate the end position based on the PNG image height (617px)
                // Assuming the ocean/ground starts around the 450px mark of the 617px height
                drop.style.top = '500px'; // End position near the bottom
                // Optional: add a slight horizontal drift during the fall
                drop.style.left = (startLeft + (Math.random() * 20 - 10)) + 'px'; 
            }, 50);

            // Clean up element after animation
            setTimeout(() => { 
                drop.remove(); 
                if (i === 34) { // Check if this is the last drop being cleaned up
                     resetScene(); // Call the new reset function
                }
            }, 2200);

        }, i * 150); // Stagger timing
    }
}
const waterScene = document.getElementById('waterScene');
function enableRandomInteractions() {
    const scene = document.getElementById('waterScene');
    if (scene) {
        scene.addEventListener('click', spawnMolecule);
        scene.addEventListener('touchstart', spawnMolecule);
    }
}

// --- MOLECULE SPAWN ANIMATION (O₂ or H₂O) ---
function spawnMolecule(event) {
    event.preventDefault(); 
    
    const scene = event.currentTarget;
    const rect = scene.getBoundingClientRect();
    
    let clientX, clientY;
    
    // Handle both touch and mouse events
    if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }

    // Get click position relative to the scene container
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // 🔥 RANDOM DECISION STEP
    //const isWater = Math.random() < 0.5; // 50% chance for Water (H₂O)
    const choice = Math.floor(Math.random() * 3);
    
    let moleculeHTML;
    let moleculeColor;
    let moleculeSize = '30px';
    let moleculePhrase;

    if (choice===0) {
        // Water (H₂O)
        moleculeHTML = 'H<sub style="font-size: 60%;">2</sub>O';
        moleculeColor = '#4DD2FF'; // Light blue/cyan for water
        moleculePhrase = "H two O is Water";
    } else if(choice===1) {
        // Oxygen (O₂)
        moleculeHTML = 'O<sub style="font-size: 60%;">2</sub>';
        moleculeColor = '#7FFFD4'; // Light green/turquoise for oxygen
        moleculePhrase = "O two is Oxygen";
    } else {
        // 🔥 Hydrogen Atom (H)
        moleculeHTML = 'H';
        moleculeColor = '#FFFFFF'; // White for a basic atom
        moleculeSize = '40px'; // Make the single atom slightly larger for visibility
        moleculePhrase = "H is Hydrogen";
    }
    
    // Create the Molecule element
    const molecule = document.createElement('div');
    
    // Set the chosen molecule structure
    molecule.innerHTML = moleculeHTML; 
    
    // Apply initial styles
    molecule.style.position = 'absolute';
    molecule.style.left = `${x}px`;
    molecule.style.top = `${y}px`; 
    molecule.style.color = moleculeColor; // Use the chosen color
    molecule.style.fontSize = '30px'; 
    molecule.style.fontWeight = 'bold';
    molecule.style.opacity = '1';
    molecule.style.transition = 'all 1s ease-out';
    molecule.style.pointerEvents = 'none';
    molecule.style.zIndex = '100';

    scene.appendChild(molecule);
    speakMolecule(moleculePhrase);

    // Trigger the animation: move up slightly and fade out
    setTimeout(() => {
        molecule.style.transform = 'translateY(-20px)';
        molecule.style.opacity = '0';
    }, 10); 

    // Remove the element
    setTimeout(() => {
        molecule.remove();
    }, 1050); 
}
// --- OXYGEN SPAWN ANIMATION ---
function spawnOxygen(event) {
    // Prevent the default action (like scrolling/zooming on mobile)
    event.preventDefault(); 
    
    const scene = event.currentTarget;
    const rect = scene.getBoundingClientRect();
    
    let clientX, clientY;
    
    // Handle both touch and mouse events for phone compatibility
    if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }

    // Get click position relative to the scene container
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Create the Oxygen element
    const oxygen = document.createElement('div');
    
    // 🔥 FIX: Use innerHTML to render the subscript tag 
    // This creates the proper chemical notation: O₂
    oxygen.innerHTML = 'O<sub style="font-size: 60%;">2</sub>'; 
    
    // Apply initial styles
    oxygen.style.position = 'absolute';
    // Set position using calculated coordinates
    oxygen.style.left = `${x}px`;
    oxygen.style.top = `${y}px`; 
    oxygen.style.color = '#7FFFD4'; 
    oxygen.style.fontSize = '30px'; // Increased size for visibility
    oxygen.style.fontWeight = 'bold';
    oxygen.style.opacity = '1';
    oxygen.style.transition = 'all 1s ease-out'; // Animation duration
    oxygen.style.pointerEvents = 'none'; // Prevent the spawned element from blocking future clicks
    oxygen.style.zIndex = '100'; // Ensure it appears above everything else

    scene.appendChild(oxygen);

    // Trigger the animation: move up slightly and fade out
    setTimeout(() => {
        // Move up 20px and fade to 0 opacity
        oxygen.style.transform = 'translateY(-20px)';
        oxygen.style.opacity = '0';
    }, 10); 

    // Remove the element after the transition finishes (1 second + small buffer)
    setTimeout(() => {
        oxygen.remove();
    }, 1050); 
}

// --- AUDIO CONTROL FUNCTIONS ---
const backgroundAudio = document.getElementById('backgroundAudio');
let isAudioPlaying = false;

function toggleBackgroundMusic() {
    if (!backgroundAudio) return; // Exit if audio element wasn't found

    if (isAudioPlaying) {
        backgroundAudio.pause();
        isAudioPlaying = false;
        document.getElementById('soundButton').textContent = "▶️ Play Sound";
    } else {
        // Browsers require user interaction to start audio, so this needs to be inside a click handler
        backgroundAudio.play().catch(error => {
            console.error("Audio playback failed (usually due to browser autoplay policy):", error);
        });
        isAudioPlaying = true;
        document.getElementById('soundButton').textContent = "⏸️ Stop Sound";
    }
}

// Function to start the sound automatically when the game loads (will rely on user interaction)
function startBackgroundMusic() {
    // Attempt to start playing. If the browser blocks it, the user will need to click the button.
    backgroundAudio.play().then(() => {
        isAudioPlaying = true;
        // Optionally update the button text if it starts successfully
        const soundButton = document.getElementById('soundButton');
        if(soundButton) soundButton.textContent = "⏸️ Stop Sound";
    }).catch(error => {
        console.log("Audio requires user interaction to start. Please click the button.");
        isAudioPlaying = false;
    });
}
// --- SPEECH SYNTHESIS HELPER WITH AUDIO DUCKING ---
function speakMolecule(textToSpeak) {
    // Get the background audio element (Ensure it's accessible globally or passed in)
    const bgAudio = document.getElementById('backgroundAudio'); 

    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        
        // 1. Duck the volume when speech starts
        utterance.onstart = () => {
            if (bgAudio) {
                // Reduce volume significantly (e.g., 1.0 down to 0.2)
                bgAudio.volume = 0.2; 
                bgAudio.style.transition = 'volume 0.3s ease-in-out';
            }
        };

        // 2. Restore the volume when speech ends
        utterance.onend = () => {
            if (bgAudio) {
                // Restore original volume
                bgAudio.volume = 1.0; 
            }
        };

        // Optional: Set voice properties for a clearer sound
        utterance.rate = 1.0; 
        utterance.volume = 1.0; // The actual speech volume
        
        // This command tells the browser to speak the text
        window.speechSynthesis.speak(utterance);
    } else {
        console.warn("Text-to-Speech not supported in this browser.");
    }
}
// --- SCENE RESET HELPER ---
function resetScene() {
    const sun = document.querySelector('.sun');
    const cloudSmall1 = document.getElementById('cloudSmall1');
    const cloudSmall2 = document.getElementById('cloudSmall2');
    const darkCloud = document.getElementById('darkCloud'); 

    if (darkCloud) {
        // 1. Blur Out (Transition enabled)
        darkCloud.style.transition = 'filter 0.5s ease-out'; // Transition only the blur
        darkCloud.style.filter = 'blur(15px)'; // Blur the cloud immediately
        
        // 2. Schedule the Slide-Out and Hide (Transition enabled)
        setTimeout(() => {
            darkCloud.style.transition = 'all 0.5s ease-in'; // Transition position and opacity
            darkCloud.style.opacity = '0';
            darkCloud.style.top = '-100px'; 
            darkCloud.style.left = '-100px';
        }, 500); // Wait 500ms for the blur effect to finish
    }
    
    // Restore sun brightness and small clouds (run after a brief delay)
    setTimeout(() => {
        sun.style.opacity = '1'; 
        cloudSmall1.style.opacity = '0.2'; 
        cloudSmall2.style.opacity = '0.2'; 
        document.getElementById('cycleStatus').textContent = "Cycle step complete. Choose the next step or start the challenge.";
    }, 1000); // Wait 1 second (longer than the blur-out and slide-out)
}
function startChallengeOne() {
    showChallenge("one");

    challengeContainer.innerHTML = `
        <div class="challenge-box">
            <h3>Water Cycle Challenge 1</h3>
            <p><strong>Question 1:</strong> What is the first step of the water cycle?</p>
            <button class="answer-btn" onclick="answerQuestion('evaporation')">Evaporation</button>
            <button class="answer-btn" onclick="answerQuestion('condensation')">Condensation</button>
            <button class="answer-btn" onclick="answerQuestion('precipitation')">Precipitation</button>
        </div>
    `;

    actionButton.style.display = "none";
}
/**
 * Displays the final results, calculates points, and handles data saving.
 */
function finishChallenge() {
    const container = document.getElementById('challengeContainer');
    isChallengeActive = false;
    enableCycleButtons(); // Re-enable simulation buttons
    
    let message, pointsEarned;
    // Determine reward based on score
    if (challengeScore === questions.length) {
        message = "Perfect Score! Mission Complete! Unlocking next destination...";
        pointsEarned = EARTH_LEVEL.points;
        userDataCache.unlockedPlanets.push(EARTH_LEVEL.next);
        updateUserData({ fuelPoints: userDataCache.fuelPoints + pointsEarned, unlockedPlanets: userDataCache.unlockedPlanets });
    } else if (challengeScore >= questions.length * 0.7) {
        message = "Mission Successful! You passed the core concepts.";
        pointsEarned = Math.floor(EARTH_LEVEL.points * 0.7);
        updateUserData({ fuelPoints: userDataCache.fuelPoints + pointsEarned });
    } else {
        message = "Mission Incomplete. Review the water cycle and try again!";
        pointsEarned = 0;
    }

    // Render results to the UI
    container.innerHTML = `
        <div class="question-card" style="background:#e8f5e9;">
            <h2 class="text-2xl font-bold text-green-700">Challenge Results</h2>
            <p class="text-xl mt-2">Score: ${challengeScore} / ${questions.length}</p>
            <p class="text-lg font-semibold mt-4">${message}</p>
            ${pointsEarned > 0 ? `<p class="text-lg text-blue-600 mt-2">Fuel Points Earned: +${pointsEarned}</p>` : ''}
            <button class="cycle-btn bg-yellow-600 hover:bg-yellow-700 mt-4" onclick="startGameUI(userDataCache)">Back to Mission Map</button>
        </div>
    `;
    // Re-enable the Start Challenge button for replays (if applicable)
    const challengeBtn = document.querySelector('button[onclick*="startChallengeOne"]');
    if (challengeBtn) challengeBtn.disabled = false;
}
