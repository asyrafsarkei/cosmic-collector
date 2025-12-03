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

    // 🔥 IMMEDIATE FEEDBACK: Tell the user we are trying to connect.
    playerStatus.textContent += ` | Connecting to Mission Database...`;
    
    try {
        // This is the line that might time out (up to 10 seconds)
        const doc = await docRef.get();
        
        if (doc.exists) {
            userData = doc.data();
        } else {
            // Create Default Data and set it
            userData = { 
                fuelPoints: 0, 
                unlockedPlanets: ["earth"] 
            };
            await docRef.set(userData);
        }

        // SUCCESS: Update UI with loaded data
        playerStatus.textContent = playerStatus.textContent.replace(' | Connecting to Mission Database...', '');
        playerStatus.textContent += ` | Fuel: ${userData.fuelPoints}`;
        
        // START THE LEVEL UI
        startGameUI(userData);

    } catch (error) {
        // FAILURE: Handle the error gracefully
        console.error("Firestore Load Error:", error);
        
        // Use default data to ensure the animations/challenge loads
        userData = { fuelPoints: 0, unlockedPlanets: ["earth"] };

        playerStatus.textContent = playerStatus.textContent.replace(' | Connecting to Mission Database...', '');
        playerStatus.textContent += " | ❌ ERROR: Offline Mode (Game Data Defaulted)";

        // START THE LEVEL UI with default data
        startGameUI(userData);
    }
}

// Global variable to hold the loop ID for clearing
let currentAnimationInterval;
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
                <p>Commander! Let's examine each step of the water cycle closely.</p>
                <p><strong>Click a button below</strong> to see that single process loop 5 times!</p>
            </div>

            <div class="scene-container" id="waterScene">
                <div class="sun">☀️</div>
                <div class="cloud" id="cloudMain" style="opacity:0.3; top: 30px; right: 50px; font-size: 60px;">☁️</div>
                <div class="cloud" id="cloudSmall1" style="opacity:0.2; top: 80px; left: 150px; font-size: 30px;">☁️</div>
                <div class="cloud" id="cloudSmall2" style="opacity:0.2; top: 50px; right: 10px; font-size: 40px;">☁️</div>
                </div>

            <div style="text-align:center;">
                <button class="cycle-btn" onclick="startLoop('evaporation')" id="btnEvap">1. Evaporation (Loop) 🔥</button>
                <button class="cycle-btn" onclick="startLoop('condensation')" id="btnCond">2. Condensation (Loop) ☁️</button>
                <button class="cycle-btn" onclick="startLoop('precipitation')" id="btnPrecip">3. Precipitation (Loop) 🌧️</button>
                <button class="cycle-btn" onclick="stopLoop()" style="background-color: #f44336; margin-top: 10px;">🛑 Stop Animation</button>
            </div>
            
            <p id="cycleStatus" style="text-align:center; font-style:italic; height: 30px;">Waiting for input...</p>
        `;
        
        actionButton.textContent = "I'm Ready! Start Challenge";
        
        // Define what happens when clicking Start Challenge
        actionButton.onclick = () => {
            startChallengeOne();
        };
    }
}
// Global variable to hold the loop ID for clearing
let currentAnimationInterval;

// --- LOOP CONTROLS ---

function stopLoop() {
    if (currentAnimationInterval) {
        clearInterval(currentAnimationInterval);
        document.getElementById('cycleStatus').textContent = "Animation stopped.";
        currentAnimationInterval = null;
        // Re-enable all buttons
        document.getElementById('btnEvap').disabled = false;
        document.getElementById('btnCond').disabled = false;
        document.getElementById('btnPrecip').disabled = false;
    }
}

function startLoop(animationType) {
    // 1. Stop any currently running loop
    stopLoop(); 
    
    // 2. Disable buttons and set status
    document.getElementById('btnEvap').disabled = true;
    document.getElementById('btnCond').disabled = true;
    document.getElementById('btnPrecip').disabled = true;
    document.getElementById('cycleStatus').textContent = `Starting ${animationType} loop...`;

    const loopCount = 5;
    let counter = 0;
    let animationFunction;
    let delay; // Time to wait before restarting the loop

    switch (animationType) {
        case 'evaporation':
            animationFunction = animateEvaporation;
            delay = 3000; // 3 seconds (longer than the 2.6s animation)
            break;
        case 'condensation':
            animationFunction = animateCondensation;
            delay = 2500; // 2.5 seconds (longer than the 2.0s animation)
            break;
        case 'precipitation':
            animationFunction = animatePrecipitation;
            delay = 1800; // 1.8 seconds (longer than the 1.6s animation)
            break;
        default:
            return;
    }
    
    // 3. Define the repeating function
    const loopAction = () => {
        if (counter >= loopCount) {
            stopLoop(); // Finished 5 loops
            document.getElementById('cycleStatus').textContent = `${animationType} loop finished 5 times!`;
            return;
        }

        // Run the animation
        animationFunction(); 
        counter++;
    };

    // 4. Start the loop
    loopAction(); // Run the first time immediately
    currentAnimationInterval = setInterval(loopAction, delay);
}
// --- CYCLE SEQUENCER ---
function startWaterCycleLoop() {
    const loopButton = document.getElementById('loopButton');
    loopButton.disabled = true; // Prevent re-clicking during the loop
    loopButton.textContent = "🔁 Cycle Running...";

    const totalLoops = 10;
    let currentLoop = 0;

    // The function that runs one full cycle
    const runOneCycle = () => {
        if (currentLoop >= totalLoops) {
            loopButton.disabled = false;
            loopButton.textContent = "✅ Cycle Complete!";
            document.getElementById('cycleStatus').textContent = "The cycle finished 10 times! Ready for the challenge.";
            return;
        }

        currentLoop++;
        document.getElementById('cycleStatus').textContent = `Starting Loop ${currentLoop} of ${totalLoops}...`;

        // 1. EVAPORATION (Takes ~2.6s)
        animateEvaporation();

        // 2. CONDENSATION (Starts after 3s delay)
        setTimeout(() => {
            animateCondensation();
        }, 3000); // Wait 3.0s (longer than 2.6s evaporation)

        // 3. PRECIPITATION (Starts after 5.5s delay)
        setTimeout(() => {
            animatePrecipitation();
        }, 5500); // Wait 5.5s (3.0s + 2.0s condensation + buffer)

        // 4. REPEAT (Starts after 7.5s delay)
        setTimeout(() => {
            runOneCycle(); // Calls itself to start the next loop
        }, 7500); // Total cycle time is ~7.5 seconds
    };

    // Start the first cycle
    runOneCycle();
}
// --- ANIMATION HELPER FUNCTIONS ---
// These make the emojis move on the screen

window.animateEvaporation = function() {
    const scene = document.getElementById('waterScene');
    document.getElementById('cycleStatus').textContent = "The Sun warms the ocean, turning water into vapor (Gas)! Look at all the water rising! 💧🔥";
    
    // Use a loop to create and animate three drops
    for(let i = 0; i < 3; i++) {
        // Stagger the drops to start slightly apart in time and position
        setTimeout(() => {
            const drop = document.createElement('div');
            drop.textContent = '💧';
            drop.className = 'water-drop';
            
            // Randomize starting position slightly
            const startX = 25 + (i * 10); // Start drops near 25% to 45% horizontal position
            drop.style.bottom = '20px';
            drop.style.left = startX + '%';
            scene.appendChild(drop);

            // Force browser to realize element is there before moving it
            setTimeout(() => {
                // Animate to a different, higher position
                drop.style.bottom = '220px'; 
                drop.style.left = (startX + 5) + '%';
                drop.style.opacity = '0';    // Fade out
                drop.style.transitionDuration = '2.5s'; // Make rise slightly longer
            }, 50);

            // Clean up element after animation
            setTimeout(() => { drop.remove(); }, 2600);
        }, i * 400); // Stagger the start time by 400ms
    }
}

window.animateCondensation = function() {
    document.getElementById('cycleStatus').textContent = "Water vapor cools down high up and gathers to form BIGGER CLOUDS! ☁️☁️☁️";
    
    const cloudMain = document.getElementById('cloudMain');
    const cloudSmall1 = document.getElementById('cloudSmall1');
    const cloudSmall2 = document.getElementById('cloudSmall2');

    // Make main cloud grow and darken
    cloudMain.style.opacity = '1';
    cloudMain.style.transform = "scale(2.0)"; // Grow significantly
    cloudMain.style.color = "#bbbbbb"; // Change color slightly (visual cue)

    // Make small clouds join (move toward the main cloud and disappear)
    cloudSmall1.style.opacity = '0';
    cloudSmall2.style.opacity = '0';
    cloudSmall1.style.transitionDuration = '1.5s';
    cloudSmall2.style.transitionDuration = '1.5s';

    // Reset after animation
    setTimeout(() => { 
        cloudMain.style.transform = "scale(1.0)"; 
        cloudMain.style.color = ""; 
    }, 2000); // 2 seconds to show the growth
}

window.animatePrecipitation = function() {
    const scene = document.getElementById('waterScene');
    document.getElementById('cycleStatus').textContent = "The clouds are too heavy! RAIN is pouring down, carried by the wind! ⛈️";
    
    const dropCount = 10; // More drops for a shower effect

    for(let i = 0; i < dropCount; i++) {
        // Stagger the drops to fall sequentially over a short time
        setTimeout(() => {
            const drop = document.createElement('div');
            drop.textContent = '💧';
            
            // 🔥 Use the new 'raining' class to trigger the wind animation
            drop.className = 'water-drop raining'; 
            
            // Randomize starting horizontal position
            const startRight = Math.floor(Math.random() * 80) + 10; // Between 10px and 90px from the right
            
            drop.style.top = '70px'; // Start under the cloud
            drop.style.right = startRight + 'px'; 
            scene.appendChild(drop);

            // Clean up element after the animation is finished
            // The animation itself takes 1.5s, so we remove it shortly after
            setTimeout(() => { drop.remove(); }, 1600); 

        }, i * 150); // Stagger the start time every 150ms to create a shower effect
    }
}

function startChallengeOne() {
    // Update the UI for the actual question
    challengeContainer.innerHTML = `
        <div class="challenge-box">
            <h3>Question 1: Ordering</h3>
            <p>Put the water cycle stages in order (Evaporation -> Condensation -> Precipitation -> Collection)</p>
            <p><em>(Drag and Drop Game coming soon...)</em></p>
        </div>
    `;
    
    // Hide the start button since the game has started
    actionButton.style.display = "none"; 
}
