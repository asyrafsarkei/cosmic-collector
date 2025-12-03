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
                <div class="cloud" id="cloudMain" style="opacity:0.3; top: 30px; right: 50px; font-size: 60px;">☁️</div>
                <div class="cloud" id="cloudSmall1" style="opacity:0.2; top: 80px; left: 150px; font-size: 30px;">☁️</div>
                <div class="cloud" id="cloudSmall2" style="opacity:0.2; top: 50px; right: 10px; font-size: 40px;">☁️</div>
                <div id="mountain"></div>
                <div id="river"></div>
                </div>

            <div style="text-align:center;">
                <button class="cycle-btn" onclick="animateEvaporation()">1. Evaporation 🔥</button>
                <button class="cycle-btn" onclick="animateCondensation()">2. Condensation ☁️</button>
                <button class="cycle-btn" onclick="animatePrecipitation()">3. Precipitation 🌧️</button>
            </div>
            
            <p id="cycleStatus" style="text-align:center; font-style:italic; height: 30px;">Waiting for input...</p>
        `;
        
        actionButton.textContent = "I'm Ready! Start Challenge";
        
        // Define what happens when clicking Start
        actionButton.onclick = () => {
            startChallengeOne();
        };
    }
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
    document.getElementById('cycleStatus').textContent = "The clouds get heavy and water falls as Rain!";
    
    // Create falling drops
    for(let i=0; i<3; i++) {
        setTimeout(() => {
            const drop = document.createElement('div');
            drop.textContent = '💧';
            drop.className = 'water-drop';
            drop.style.top = '70px';
            drop.style.right = (80 + (i*20)) + 'px'; // Stagger position
            scene.appendChild(drop);

            setTimeout(() => {
                drop.style.top = '250px'; // Fall down
            }, 50);

            setTimeout(() => { drop.remove(); }, 2000);
        }, i * 300); // Stagger timing
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
