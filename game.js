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
        // Show Intro
        challengeContainer.innerHTML = `
            <p>Welcome! Your mission is to master the <strong>Water Cycle</strong>.</p>
            <p>Look at this diagram to understand how water moves on Earth:</p>
            

[Image of the Water Cycle]

            <p>Earn ${EARTH_LEVEL.points} fuel points by completing the challenge.</p>
        `;
        actionButton.textContent = "Start Challenge 1";
        
        // Define what happens when clicking Start
        actionButton.onclick = () => {
            startChallengeOne();
        };
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
