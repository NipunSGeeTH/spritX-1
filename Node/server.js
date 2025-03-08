const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const cors = require("cors");
const jwt = require('jsonwebtoken');
app.use(express.json());
app.use(cors());
require("dotenv").config();
app.use(bodyParser.json());

// MongoDB connection URL
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
})
  .then(() => { console.log("Connected to Database"); })
  .catch((e) => console.log(e));

require("./userDetails");

const User = mongoose.model("UserInfo");

// Register route
app.post('/register', async (req, res) => {
  let { username, password } = req.body;
  username = username.toLowerCase(); // Convert username to lowercase
  const encryptedPassword = await bcrypt.hash(password, 10);

  try {
    const oldUser = await User.findOne({ username });

    if (oldUser) {
      return res.json({ status: "error", error: "Username already exists" });
    }

    await User.create({
      username,
      password: encryptedPassword,
    });

    res.send({ status: "ok" });
  } catch (error) {
    res.send({ status: "error", message: "Server error" });
  }
});

  
// Login route
app.post('/login-user', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const user = await User.findOne({ username });
  
      if (!user) {
        return res.json({ status: "error", error: "Username not found" });
      }
  
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.json({ status: "error", error: "Incorrect password" });
      }
  
      const token = jwt.sign({ id: user._id }, 'your-secret-key', { expiresIn: '1h' });
  
      res.json({
        status: "ok",
        token: token,
      });
    } catch (error) {
      res.send({ status: "error", message: "Server error" });
    }
});
  
// User data route
app.post('/userData', async (req, res) => {
    const { token } = req.body;
  
    if (!token) {
      return res.json({ status: "error", message: "No token provided" });
    }
  
    try {
      const decoded = jwt.verify(token, 'your-secret-key');
      const userId = decoded.id;
  
      const user = await User.findById(userId);
      if (!user) {
        return res.json({ status: "error", message: "User not found" });
      }
  
      res.json({
        status: "ok",
        data: user,
      });
    } catch (error) {
      res.json({ status: "error", message: "Invalid token or server error" });
    }
});
  
// Start the server
app.listen(3000, () => {
  console.log("Server Started on http://localhost:3000");
});
