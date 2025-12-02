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


// Initialize Firebase Services
const app = firebase.initializeApp(firebaseConfig);
const db = app.firestore();    
const auth = app.auth();        

// Get references to HTML elements (MUST match your index.html)
const statusElement = document.getElementById('status');
const loginButton = document.getElementById('loginButton');
const logoutButton = document.getElementById('logoutButton');

// --- NEW GAME UI ELEMENTS ---
const gameContainer = document.getElementById('gameContainer');
const missionTitle = document.getElementById('missionTitle');
const challengeArea = document.getElementById('challengeArea');
const startLevelButton = document.getElementById('startLevelButton');


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
            // The correct order of the elements is the array of IDs
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
    // Saves to: users/{userId}
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
 * NOTE: This function is async and returns a promise.
 */
const loadUserData = async (userId) => {
    const userDocRef = db.collection("users").doc(userId);
    const doc = await userDocRef.get();

    let userData;

    if (doc.exists) {
        // User exists! Load their saved progress.
        userData = doc.data();
        console.log("SUCCESS: Loaded existing progress:", userData);
    } else {
        // New User! Create the starting progress.
        userData = defaultNewUserProgress;
        // Save the default data immediately
        saveUserData(userId, userData); 
        console.log("SUCCESS: Created new user progress:", userData);
    }
    
    // Store the data globally for the rest of the game code to use.
    window.currentPlayerData = userData; 

    // Update the UI status with current data
    statusElement.textContent = statusElement.textContent.split(' Your current fuel:')[0]; // Clear old fuel status
    statusElement.textContent += ` Your current fuel: ${userData.fuelPoints}.`;
};


// --- 2. GAME LOGIC FUNCTIONS ---

const startEarthLevel = () => {
    // 1. Show the game UI
    gameContainer.style.display = 'block';
    
    // 2. Load the level data
    missionTitle.textContent = EARTH_LEVEL_DATA.title;
    
    // 3. Check if the user has already completed this level (by checking if the next planet is unlocked)
    const isCompleted = window.currentPlayerData.unlockedPlanets.includes(EARTH_LEVEL_DATA.nextPlanetId);
    
    if (isCompleted) {
        challengeArea.innerHTML = "<p>✅ **Mission Complete!** You have already explored Earth. Head to the Moon next!</p>";
        startLevelButton.textContent = "Go to Planet Map";
        // ToDo: Implement map button functionality later
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

// --- We will define startChallengeOne and subsequent challenge functions here ---
const startChallengeOne = () => {
    challengeArea.innerHTML = "<h2>Starting Challenge 1... (Need to build the ordering game)</h2>";
    // ToDo: Build the ordering game structure and validation
};


// --- 3. AUTHENTICATION (LOGIN/LOGOUT) FUNCTIONS ---

const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch((error) => {
        console.error("Login Error:", error.message);
    });
};

// --- 4. STATUS LISTENER (Triggers on login/logout) ---
auth.onAuthStateChanged((user) => {
    if (user) {
        // Logged In
        statusElement.textContent = `Mission Control: Welcome, Commander ${user.displayName}!`;
        loginButton.style.display = 'none';
        logoutButton.style.display = 'block';
        
        // **NEW:** Wait for loadUserData to complete before starting the game
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


// --- 5. ATTACH EVENT LISTENERS ---
loginButton.addEventListener('click', signInWithGoogle);
logoutButton.addEventListener('click', () => auth.signOut());
