// -------------------------------
// 1. FIREBASE SETUP
// -------------------------------// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// -------------------------------
// 2. LOGIN & REGISTER
// -------------------------------// Agent key
const SECRET_KEY = "£4890##Ais4apple51#";

// login handler
function attemptLogin() {
    const emailVal = email.value.trim();
    const keyVal = agentKey.value.trim();
    const oath = document.getElementById("oathCheck").checked;

    if (!emailVal) return popup("Enter your email.");
    if (!keyVal) return popup("Enter the agent key.");
    if (keyVal !== SECRET_KEY) return popup("❌ Wrong agent key.");
    if (!oath) return popup("Please accept the oath to continue.");

    // Now perform Firebase login/registration
    auth.signInWithEmailAndPassword(emailVal, "defaultpass123")
        .then(() => {
            saveProfile();
            enterChat();
        })
        .catch(() => {
            // If user doesn't exist, create it
            auth.createUserWithEmailAndPassword(emailVal, "defaultpass123")
                .then(() => {
                    saveProfile();
                    enterChat();
                })
                .catch(err => popup("Login Error: " + err.message));
        });
}

// professional popup
function popup(msg) {
    let box = document.createElement("div");
    box.className = "popup";
    box.innerHTML = `<p>${msg}</p>`;
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 2500);
}

// Load profile preview
function loadProfile(event) {
    let file = event.target.files[0];
    let reader = new FileReader();
    reader.onload = e => {
        profilePreview.src = e.target.result;
        localStorage.setItem("profilePhoto", e.target.result);
    };
    reader.readAsDataURL(file);
}

// Save profile image so others can see your avatar name
function saveProfile() {
    const emailVal = email.value.trim();
    const pp = localStorage.getItem("profilePhoto") || "";

    db.ref("profiles/" + auth.currentUser.uid).set({
        email: emailVal,
        photo: pp
    });
}



// -------------------------------
// 3. WEBRTC INITIALIZATION
// -------------------------------
let pc, dataChannel;

function setupRTC() {
  pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  dataChannel = pc.createDataChannel("data");
  dataChannel.binaryType = "arraybuffer";

  dataChannel.onopen = () => console.log("Data channel ready");
  dataChannel.onmessage = e => handleIncoming(e.data);

  pc.onicecandidate = e => {
    if (e.candidate) {
      db.ref("room/ice").push(e.candidate);
    }
  };

  createOffer();
}

// -------------------------------
// 4. OFFER / ANSWER SIGNALING
// -------------------------------
async function createOffer() {
  let offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  db.ref("room/offer").set(JSON.parse(JSON.stringify(offer)));

  // Listen for answer
  db.ref("room/answer").on("value", async snap => {
    let ans = snap.val();
    if (ans && !pc.currentRemoteDescription) {
      await pc.setRemoteDescription(ans);
    }
  });

  // Listen for ice
  db.ref("room/ice").on("child_added", snap => {
    pc.addIceCandidate(snap.val());
  });
}

// -------------------------------
// 5. CHAT MESSAGES
// -------------------------------
function sendMessage() {
  let msg = msgBox.value.trim();
  if (!msg) return;

  let payload = JSON.stringify({ type: "text", msg });

  dataChannel.send(payload);
  addMessage(auth.currentUser.email, msg);

  msgBox.value = "";
}

function handleIncoming(data) {
  if (typeof data === "string") {
    let obj = JSON.parse(data);

    if (obj.type === "text") {
      addMessage("User", obj.msg);
    }
  } else {
    receiveFile(data);
  }
}

// UI
function addMessage(user, msg) {
  let div = document.createElement("div");
  div.innerHTML = `<b>${user}:</b> ${msg}`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// -------------------------------
// 6. FILE SHARING (📸)
// -------------------------------
let fileBuffer = [];
function sendSelectedFile() {
  let file = fileInput.files[0];
  let chunkSize = 16 * 1024;

  const reader = new FileReader();
  reader.onload = e => {
    let buffer = e.target.result;

    for (let i = 0; i < buffer.byteLength; i += chunkSize) {
      dataChannel.send(buffer.slice(i, i + chunkSize));
    }
    dataChannel.send("EOF");
  };

  reader.readAsArrayBuffer(file);
}

function receiveFile(data) {
  if (data === "EOF") {
    let blob = new Blob(fileBuffer);
    fileBuffer = [];

    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = "file";
    a.click();
    return;
  }

  fileBuffer.push(data);
}

// -------------------------------
// 7. VOICE CHAT (🎙️)
// -------------------------------
async function startVoice() {
  let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach(t => pc.addTrack(t, stream));
  alert("Voice streaming active");
}

// -------------------------------
// 8. EMOJIS
// -------------------------------
const emojis = "😀😁😂🤣😃😄😅😉😊😍😘😎😡😭😴😇🙌🙏🔥💯🎉❤️💀".split("");

emojiBtn.onclick = () => {
  emojiPanel.innerHTML = "";
  emojis.forEach(e => {
    let span = document.createElement("span");
    span.style.fontSize = "22px";
    span.style.margin = "6px";
    span.innerText = e;
    span.onclick = () => msgBox.value += e;
    emojiPanel.appendChild(span);
  });
  emojiPanel.classList.toggle("hidden");
};
