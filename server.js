require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const registerSocketEvents = require('./socket/socket');
const chatRouter = require("./routers/chatRouter")
const app = express();
const server = http.createServer(app);
const asc = require("./models/asc")
const io = socketIO(server, {
  cors: {
    origin: '*',
  }
});
app.use(express.json());

app.use("/api/chat", chatRouter)
registerSocketEvents(io);
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { io }
