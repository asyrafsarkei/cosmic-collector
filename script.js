// ====================================================================
// CRITICAL: PASTE YOUR FIREBASE CONFIG SNIPPET HERE 
// ====================================================================
const firebaseConfig = {
    apiKey: "AIzaSyC1yRE-ql0TzjcdtVfRJxCGfMwikF9oBos",
    authDomain: "cosmiccollectorapp.firebaseapp.com",
    projectId: "cosmiccollectorapp", 
    // ... other fields (Optional: storageBucket, messagingSenderId, appId)
};
// ====================================================================

// Initialize Firebase Services (These are safe to run immediately)
const app = firebase.initializeApp(firebaseConfig);
const db = app.firestore();    
const auth = app.auth();        

// --- NEW GLOBAL VARIABLES FOR ELEMENTS (Defined globally, but populated later)
let statusElement;
let loginButton;
let logoutButton;
let gameContainer;
let missionTitle;
let challengeArea;
let startLevelButton;

// --- 1. DATA AND LEVEL DEFINITIONS (SAFE to run immediately) ---
// ... (All your EARTH_LEVEL_DATA and defaultNewUserProgress objects remain here) ...

const EARTH_LEVEL_DATA = { /* ... */ }; 
const defaultNewUserProgress = { /* ... */ }; 

// --- DATA HANDLING FUNCTIONS (Also safe to run immediately) ---
const saveUserData = (userId, data) => { /* ... */ };
const loadUserData = async (userId) => { /* ... */ };


// --- 2. GAME LOGIC FUNCTIONS (Also safe to run immediately) ---
// NOTE: These functions will use the globally defined variables above once they are populated.

const startEarthLevel = () => {
    // 1. Show the game UI
    gameContainer.style.display = 'block';
    // ... (rest of startEarthLevel logic remains the same) ...
    missionTitle.textContent = EARTH_LEVEL_DATA.title;
    const isCompleted = window.currentPlayerData.unlockedPlanets.includes(EARTH_LEVEL_DATA.nextPlanetId);
    
    if (isCompleted) {
        challengeArea.innerHTML = "<p>✅ **Mission Complete!** You have already explored Earth. Head to the Moon next!</p>";
        startLevelButton.textContent = "Go to Planet Map";
        startLevelButton.onclick = null; 
    } else {
        challengeArea.innerHTML = `<p>Welcome, Commander! Your mission is to master the **Water Cycle** 

[Image of the Water Cycle]
. Correctly answer the challenges to earn ${EARTH_LEVEL_DATA.rewardPoints} Fuel Points!</p>`;
        startLevelButton.textContent = "Start Challenge 1";
        startLevelButton.onclick = startChallengeOne; 
    }
};

const startChallengeOne = () => {
    challengeArea.innerHTML = "<h2>Starting Challenge 1... (Need to build the ordering game)</h2>";
};

const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch((error) => {
        console.error("Login Error:", error.message);
    });
};


// ====================================================================
// 🔥 CRITICAL FIX: WAIT FOR THE HTML TO LOAD BEFORE FINDING ELEMENTS!
// ====================================================================
document.addEventListener('DOMContentLoaded', () => {

    // Get references to HTML elements (NOW SAFE TO CALL)
    statusElement = document.getElementById('status');
    loginButton = document.getElementById('loginButton');
    logoutButton = document.getElementById('logoutButton');

    // --- NEW GAME UI ELEMENTS ---
    gameContainer = document.getElementById('gameContainer');
    missionTitle = document.getElementById('missionTitle');
    challengeArea = document.getElementById('challengeArea');
    startLevelButton = document.getElementById('startLevelButton');

    // --- 3. STATUS LISTENER (Triggers on login/logout) ---
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Logged In
            statusElement.textContent = `Mission Control: Welcome, Commander ${user.displayName}!`;
            loginButton.style.display = 'none';
            logoutButton.style.display = 'block';
            
            // Wait for loadUserData to complete before starting the game
            loadUserData(user.uid).then(() => {
                startEarthLevel(); 
            });

        } else {
            // Logged Out
            statusElement.textContent = "Please Sign In to Begin Your Mission.";
            loginButton.style.display = 'block';
            logoutButton.style.display = 'none';
            window.currentPlayerData = null; // Clear data when logged out
            
            // Hide game container when logged out
            if (gameContainer) {
                gameContainer.style.display = 'none';
            }
        }
    });

    // --- 4. ATTACH EVENT LISTENERS (NOW SAFE TO CALL) ---
    loginButton.addEventListener('click', signInWithGoogle);
    logoutButton.addEventListener('click', () => auth.signOut());
});
// ====================================================================
