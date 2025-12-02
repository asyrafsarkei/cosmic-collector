// ====================================================================
// CRITICAL: PASTE YOUR FIREBASE CONFIG SNIPPET HERE 
// (The one you copied after registering the web app)
// ====================================================================
const firebaseConfig = {
  apiKey: "AIzaSyC1yRE-ql0TzjcdtVfRJxCGfMwikF9oBos",
  authDomain: "cosmiccollectorapp.firebaseapp.com",
  projectId: "cosmiccollectorapp", 
  // ... other fields
};
// ====================================================================


// Initialize Firebase Services
const app = firebase.initializeApp(firebaseConfig);
const db = app.firestore();    
const auth = app.auth();        

// Get references to HTML elements
const statusElement = document.getElementById('status');
const loginButton = document.getElementById('loginButton');
const logoutButton = document.getElementById('logoutButton');


// --- 1. DATA HANDLING FUNCTIONS ---

// The default progress for a new child astronaut.
const defaultNewUserProgress = {
    lastPlanetId: "earth",
    fuelPoints: 0,
    cardCollection: [],
    totalProblemsSolved: 0,
    unlockedPlanets: ["earth"]
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

    // Example of using the loaded data:
    statusElement.textContent += ` Your current fuel: ${userData.fuelPoints}.`;
};


// --- 2. AUTHENTICATION (LOGIN/LOGOUT) FUNCTIONS ---

const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch((error) => {
        console.error("Login Error:", error.message);
    });
};

// --- 3. STATUS LISTENER (Triggers on login/logout) ---
auth.onAuthStateChanged((user) => {
    if (user) {
        // Logged In
        statusElement.textContent = `Mission Control: Welcome, Commander ${user.displayName}!`;
        loginButton.style.display = 'none';
        logoutButton.style.display = 'block';
        
        // **CRITICAL STEP:** Load or create the user's data record
        loadUserData(user.uid); 

    } else {
        // Logged Out
        statusElement.textContent = "Please Sign In to Begin Your Mission.";
        loginButton.style.display = 'block';
        logoutButton.style.display = 'none';
        window.currentPlayerData = null; // Clear data when logged out
    }
});


// --- 4. ATTACH EVENT LISTENERS ---
loginButton.addEventListener('click', signInWithGoogle);
logoutButton.addEventListener('click', () => auth.signOut());