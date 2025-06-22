const socket = io();

const form = document.getElementById("chat-form");
const input = document.getElementById("message-input");
const messagesDiv = document.getElementById("messages");

let lastSender = null;

function getCookie(name) {
  const cookieArr = document.cookie.split(";");
  for (let cookie of cookieArr) {
    let [key, value] = cookie.trim().split("=");
    if (key === name) return decodeURIComponent(value);
  }
  return null;
}

let username = getCookie("username");
if (!username) window.location.href = "/login";

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const content = input.value.trim();
  if (content !== "") {
    socket.emit("chat message", { username, content });
    input.value = "";
  }
});

function appendMessage(msg) {
  const isOwnMessage = msg.username === username;
  const time = new Date(msg.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  if (lastSender !== msg.username) {
    const userLine = document.createElement("div");
    userLine.classList.add("chat-username");
    if (isOwnMessage) userLine.classList.add("align-right");
    userLine.textContent = msg.username;
    messagesDiv.appendChild(userLine);
  }

  const bubble = document.createElement("div");
  bubble.classList.add(
    "message-bubble",
    isOwnMessage ? "my-message" : "other-message",
  );

  const text = document.createElement("div");
  text.classList.add("message-text");
  text.textContent = msg.content;

  const timeStamp = document.createElement("div");
  timeStamp.classList.add("timestamp");
  timeStamp.textContent = time;

  bubble.appendChild(text);
  bubble.appendChild(timeStamp);
  messagesDiv.appendChild(bubble);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  lastSender = msg.username;
}

socket.on("chat message", appendMessage);
socket.on("chat history", (messages) => {
  messages.forEach(appendMessage);
});

const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    document.cookie = "username=; max-age=0; path=/";
    window.location.href = "/login";
  });
}
