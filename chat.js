// Firebase Setup
const firebaseConfig = {
  apiKey: "AIzaSyD6T_Vasbdw4oA657ywJcbRVwoZVpIBH3U",
  authDomain: "the-invisible-chat.firebaseapp.com",
  projectId: "the-invisible-chat",
  databaseURL: "https://the-invisible-chat-default-rtdb.firebaseio.com",
  storageBucket: "the-invisible-chat.firebasestorage.app"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// User Info from localStorage
const userEmail = localStorage.getItem("email");
const userPhoto = localStorage.getItem("profilePhoto") || "assets/default.jpg";

// -------------------------------
// MEMBERS LIST
// -------------------------------
db.ref("members/" + btoa(userEmail)).set({
    email: userEmail,
    photo: userPhoto,
    active: true
});

db.ref("members").on("value", snap => {
    let box = document.getElementById("memberList");
    box.innerHTML = "";

    snap.forEach(child => {
        let u = child.val();
        box.innerHTML += `
            <div class="member">
                <img src="${u.photo}">
                <span>${u.email}</span>
            </div>
        `;
    });
});

// -------------------------------
// EMOJI PICKER
// -------------------------------
const allEmojis = "😀😁😂🤣😃😄😅😆😉😊😋😎😍😘😗😙😚🙂🤗🤩🤔🤨😐😑🙄😶😏😣😥😮🤐😯😪😫😴😌😛😜😝🤤😒😓😔😕🙃🤑😲☹️🙁😖😞😟😤😢😭😦😧😨😩🤯😬😰😱😳🤪😵😡😠🤬"
let emojiBox = document.getElementById("emojiBox");

function openEmojiPicker() {
    emojiBox.style.display = (emojiBox.style.display === "grid") ? "none" : "grid";
}

allEmojis.split("").forEach(e => {
    let btn = document.createElement("button");
    btn.textContent = e;
    btn.onclick = () => {
        document.getElementById("msgInput").value += e;
        emojiBox.style.display = "none";
    };
    emojiBox.appendChild(btn);
});

// -------------------------------
// SEND TEXT MESSAGE
// -------------------------------
function sendMessage() {
    let msg = document.getElementById("msgInput").value.trim();
    if (!msg) return;

    db.ref("messages").push({
        type: "text",
        text: msg,
        sender: userEmail,
        photo: userPhoto,
        time: Date.now()
    });

    document.getElementById("msgInput").value = "";
}

// -------------------------------
// RENDER MESSAGES
// -------------------------------
db.ref("messages").on("child_added", snap => {
    let m = snap.val();
    renderMessage(m);
});

function renderMessage(m) {
    let box = document.getElementById("messages");

    if (m.type === "text") {
        box.innerHTML += `
        <div class="msg">
            <img src="${m.photo}">
            <div>
                <b>${m.sender}</b>
                <p>${m.text}</p>
            </div>
        </div>`;
    }

    if (m.type === "file") {
        box.innerHTML += `
        <div class="msg">
            <img src="${m.photo}">
            <div>
                <b>${m.sender}</b><br>
                <a href="${m.data}" download="${m.name}">${m.name}</a>
            </div>
        </div>`;
    }

    if (m.type === "audio") {
        box.innerHTML += `
        <div class="msg">
            <img src="${m.photo}">
            <div>
                <b>${m.sender}</b><br>
                <audio controls src="${m.data}"></audio>
            </div>
        </div>`;
    }

    box.scrollTop = box.scrollHeight;
}

// -------------------------------
// FILE SENDER (Local only, no Firebase storage cost)
// -------------------------------
function sendFile(input) {
    let file = input.files[0];
    let reader = new FileReader();

    reader.onload = function(e) {
        db.ref("messages").push({
            type: "file",
            name: file.name,
            data: e.target.result,
            sender: userEmail,
            photo: userPhoto,
            time: Date.now()
        });
    };

    reader.readAsDataURL(file);
}

// -------------------------------
// VOICE MESSAGE USING WebRTC
// -------------------------------
let recorder;

function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        recorder = RecordRTC(stream, { type: "audio" });
        recorder.startRecording();
        alert("Recording... tap 🎙️ again to stop.");
        document.getElementById("recordBtn").onclick = stopRecording;
    });
}

function stopRecording() {
    recorder.stopRecording(() => {
        let audio = recorder.getBlob();
        let reader = new FileReader();

        reader.onload = function(e) {
            db.ref("messages").push({
                type: "audio",
                data: e.target.result,
                sender: userEmail,
                photo: userPhoto,
                time: Date.now()
            });
        };

        reader.readAsDataURL(audio);
    });

    document.getElementById("recordBtn").onclick = startRecording;
}
