const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const mongoose = require("mongoose");
const Message = require("./models/Message");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const User = require("./models/User");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signup.html"));
});

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  try {
    const userExists = await User.findOne({ username });
    if (userExists) return res.send("Username already taken");

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.cookie("username", username, { maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Signup failed");
  }
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.send("Invalid username or password");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send("Invalid username or password");

    res.cookie("username", username, { maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Login failed");
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  if (!req.cookies.username) {
    return res.redirect("/login");
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Send chat history
  Message.find()
    .sort({ timestamp: 1 })
    .limit(50)
    .then((messages) => {
      socket.emit("chat history", messages);
    });

  // Save and broadcast message
  socket.on("chat message", async (msg) => {
    const message = new Message({
      username: msg.username,
      content: msg.content,
    });
    await message.save();
    io.emit("chat message", message);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
