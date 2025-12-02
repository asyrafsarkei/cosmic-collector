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


// Initialize Firebase Services (Safe to run immediately)
const app = firebase.initializeApp(firebaseConfig);
const db = app.firestore();    
const auth = app.auth();        

// --- GLOBAL ELEMENT REFERENCES (Populated inside DOMContentLoaded) ---
let statusElement;
let loginButton;
let logoutButton;
let gameContainer;
let missionTitle;
let challengeArea;
let startLevelButton;


// --- 1. DATA AND LEVEL DEFINITIONS ---

// --- EARTH LEVEL DATA ---
const EARTH_LEVEL_DATA = {
    levelId: "earth",
    nextPlanetId: "moon", // The next destination after completing Earth
    title: "Mission 1: The Water Cycle",
    rewardCard: "rain_cycle",
    rewardPoints: 100, // Total points for completing the level
    challenges: [
        {
            type: "ordering",
            question: "Order the 4 main stages of the Water Cycle:",
            correctOrder: ["evaporation", "condensation", "precipitation", "collection"],
            elements: [
                { id: "evaporation", name: "Evaporation" },
                { id: "condensation", name: "Condensation" },
                { id: "precipitation", name: "Precipitation" },
                { id: "collection", name: "Collection/Runoff" }
            ]
        },
        {
            type: "matching",
            question: "Match the term to its definition (Question 2):",
            correctAnswer: "Condensation is the process of water vapor turning into liquid droplets to form clouds.",
            term: "Condensation"
        }
    ]
};

// The default progress for a new child astronaut.
const defaultNewUserProgress = {
    lastPlanetId: "earth",
    fuelPoints: 0,
    cardCollection: [],
    totalProblemsSolved: 0,
    unlockedPlanets: ["earth"] // User starts with Earth unlocked
};

/**
 * Saves the user's current progress to Firestore.
 */
const saveUserData = (userId, data) => {
    db.collection("users").doc(userId).set(data)
        .then(() => {
            console.log("SUCCESS: Progress saved!");
        })
        .catch((error) => {
            console.error("ERROR: Could not save progress:", error);
        });
};

/**
 * Loads user progress or creates a default record if they are new.
 * NOTE: This function is async and RETURNS the loaded or default data.
 */
const loadUserData = async (userId) => {
    const userDocRef = db.collection("users").doc(userId);
    const doc = await userDocRef.get();

    let userData;

    if (doc.exists) {
        userData = doc.data();
        console.log("SUCCESS: Loaded existing progress:", userData);
    } else {
        userData = defaultNewUserProgress;
        saveUserData(userId, userData); 
        console.log("SUCCESS: Created new user progress:", userData);
    }
    
    // Store the data globally (still useful for other functions)
    window.currentPlayerData = userData; 

    // Update the UI status with current data
    statusElement.textContent = statusElement.textContent.split(' Your current fuel:')[0]; 
    statusElement.textContent += ` Your current fuel: ${userData.fuelPoints}.`;

    //FIX 1: Explicitly RETURN the data to the .then() block
    return userData;
};


// --- 2. GAME LOGIC FUNCTIONS ---

/**
 * Starts the Earth Level, receiving userData directly.
 */
const startEarthLevel = (userData) => { // 🔥 FIX 2: Accepts userData as argument
    // 1. Show the game UI
    gameContainer.style.display = 'block';
    
    // 2. Load the level data
    missionTitle.textContent = EARTH_LEVEL_DATA.title;
    
    // 3. Check if the user has already completed this level
    const isCompleted = userData.unlockedPlanets.includes(EARTH_LEVEL_DATA.nextPlanetId); // 🔥 FIX 3: Uses argument userData
    
    if (isCompleted) {
        challengeArea.innerHTML = "<p>✅ **Mission Complete!** You have already explored Earth. Head to the Moon next!</p>";
        startLevelButton.textContent = "Go to Planet Map";
        startLevelButton.onclick = null; 
    } else {
        // If not completed, start the first challenge setup
        challengeArea.innerHTML = `<p>Welcome, Commander! Your mission is to master the **Water Cycle** 

[Image of the Water Cycle]
. Correctly answer the challenges to earn ${EARTH_LEVEL_DATA.rewardPoints} Fuel Points!</p>`;
        startLevelButton.textContent = "Start Challenge 1";
        
        // We'll define startChallengeOne next
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
// FIX: WAIT FOR THE HTML TO LOAD BEFORE FINDING ELEMENTS
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
            
            // Wait for loadUserData to complete, and RECEIVE the data
            loadUserData(user.uid).then((data) => {
                startEarthLevel(data); // Pass the loaded data
            });

        } else {
            // Logged Out
            statusElement.textContent = "Please Sign In to Begin Your Mission.";
            loginButton.style.display = 'block';
            logoutButton.style.display = 'none';
            window.currentPlayerData = null; 
            
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
