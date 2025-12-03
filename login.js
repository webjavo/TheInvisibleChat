// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD6T_Vasbdw4oA657ywJcbRVwoZVpIBH3U",
  authDomain: "the-invisible-chat.firebaseapp.com",
  projectId: "the-invisible-chat",
  storageBucket: "the-invisible-chat.firebasestorage.app",
  messagingSenderId: "930784219484",
  appId: "1:930784219484:web:9c3c63b8190f6ea2b83199",
  measurementId: "G-JVHL0SBR10"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

const SECRET_KEY = "£4890##Ais4apple51#";

// Load profile photo
function loadPhoto(e) {
    let reader = new FileReader();
    reader.onload = function(evt) {
        document.getElementById("profilePreview").src = evt.target.result;
        localStorage.setItem("profilePhoto", evt.target.result);
    }
    reader.readAsDataURL(e.target.files[0]);
}

function popup(msg) {
    alert(msg); // you can replace with custom UI later
}

function attemptLogin() {
    const email = document.getElementById("email").value.trim();
    const agentKey = document.getElementById("agentKey").value.trim();
    const oath = document.getElementById("oathCheck").checked;

    if (!email) return popup("Enter your email.");
    if (!agentKey) return popup("Enter the agent key.");
    if (agentKey !== SECRET_KEY) return popup("❌ Wrong agent key.");
    if (!oath) return popup("You must accept the oath.");

    // Try login
    auth.signInWithEmailAndPassword(email, "defaultPass123")
        .then(() => {
            saveProfile(email);
            window.location.href = "areafour.html"; // redirect
        })
        .catch(err => {
            // If account does not exist → register
            auth.createUserWithEmailAndPassword(email, "defaultPass123")
                .then(() => {
                    saveProfile(email);
                    window.location.href = "areafour.html";
                })
                .catch(e => popup(e.message));
        });
}

function saveProfile(email) {
    let p = localStorage.getItem("profilePhoto") || "";
    let uid = auth.currentUser ? auth.currentUser.uid : "unknown";

    db.ref("users/" + uid).set({
        email: email,
        photo: p
    });
}
