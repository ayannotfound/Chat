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

function getInitials(name) {
  return name
    .split(" ")
    .map((part) => part[0].toUpperCase())
    .join("");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const content = input.value.trim();
  if (content !== "") {
    socket.emit("chat message", { username, content });
    input.value = "";
  }
});

let typingTimeout;

input.addEventListener("input", () => {
  socket.emit("typing", username);

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit("stop typing", username);
  }, 2000);
});

function appendMessage(msg) {
  const isOwnMessage = msg.username === username;
  const time = new Date(msg.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const isNewBlock = lastSender !== msg.username;

  if (isNewBlock) {
    const nameTag = document.createElement("div");
    nameTag.classList.add("chat-username");
    nameTag.classList.add(isOwnMessage ? "align-right" : "align-left");
    nameTag.textContent = msg.username;
    messagesDiv.appendChild(nameTag);
  }

  const messageRow = document.createElement("div");
  messageRow.classList.add(
    "message-row",
    isOwnMessage ? "my-row" : "other-row",
  );

  const avatar = document.createElement("div");
  avatar.classList.add("avatar");
  avatar.textContent = getInitials(msg.username);
  if (!isNewBlock) {
    avatar.classList.add("invisible");
  }
  messageRow.appendChild(avatar);

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
  messageRow.appendChild(bubble);

  messagesDiv.appendChild(messageRow);
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

const typingIndicator = document.createElement("div");
typingIndicator.id = "typing-indicator";
typingIndicator.classList.add("typing-indicator");
const chatContainer = document.getElementById("chat-container");
const chatForm = document.getElementById("chat-form");
chatContainer.insertBefore(typingIndicator, chatForm);

let currentlyTyping = new Set();

socket.on("typing", (user) => {
  if (user === username) return;
  currentlyTyping.add(user);
  updateTypingDisplay();
});

socket.on("stop typing", (user) => {
  currentlyTyping.delete(user);
  updateTypingDisplay();
});

function updateTypingDisplay() {
  if (currentlyTyping.size === 0) {
    typingIndicator.textContent = "";
    return;
  }
  console.log("Currently typing:", [...currentlyTyping]);

  const names = Array.from(currentlyTyping).join(", ");
  typingIndicator.textContent = `${names} ${currentlyTyping.size > 1 ? "are" : "is"} typing...`;
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
