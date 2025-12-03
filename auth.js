// ====================================================================
// PASTE YOUR FIREBASE CONFIG HERE
// ====================================================================
const firebaseConfig = {
    apiKey: "AIzaSyC1yRE-ql0TzjcdtVfRJxCGfMwikF9oBos",
    authDomain: "cosmiccollectorapp.firebaseapp.com",
    projectId: "cosmiccollectorapp", 
};
// ====================================================================

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = app.auth();

const statusElement = document.getElementById('status');
const loginButton = document.getElementById('loginButton');

// 1. Check if user is already logged in
auth.onAuthStateChanged((user) => {
    if (user) {
        statusElement.textContent = `Welcome back, Commander ${user.displayName}. Launching Mission...`;
        // REDIRECT TO THE GAME PAGE
        window.location.href = "game.html";
    } else {
        statusElement.textContent = "Please Identify Yourself.";
        loginButton.style.display = "inline-block";
    }
});

// 2. Handle Login Click
loginButton.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch((error) => {
        console.error("Login Failed:", error);
        statusElement.textContent = "Login Failed: " + error.message;
    });
});
