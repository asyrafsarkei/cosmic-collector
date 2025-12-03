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
    const doc = await docRef.get();
    
    let userData;

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

    // Update UI
    playerStatus.textContent += ` | Fuel: ${userData.fuelPoints}`;
    
    // START THE LEVEL UI
    startGameUI(userData);
}

// --- GAME UI ---
function startGameUI(userData) {
    gameArea.style.display = "block";
    missionTitle.textContent = EARTH_LEVEL.title;

    if (userData.unlockedPlanets.includes(EARTH_LEVEL.next)) {
        challengeContainer.innerHTML = "<p>✅ Mission Complete!</p>";
        actionButton.style.display = "none";
    } else {
        challengeContainer.innerHTML = `
            <p>Welcome! Master the Water Cycle to earn fuel.</p>
        `;
        actionButton.textContent = "Start Challenge 1";
        actionButton.onclick = () => {
            challengeContainer.innerHTML = "<h3>Challenge 1 Started!</h3>";
        };
    }
}
