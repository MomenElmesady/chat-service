// testClient.js

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJqb2huZG9lQGV4YW1wZTYuY29tIiwiaWF0IjoxNzQ0OTgxOTY3LCJleHAiOjE3NDUwNjgzNjd9.qMf1UK1JpOGaDK7B1-OcWsXy0eB34Om0AVk0-ccVp_g"
const { io } = require("socket.io-client");

const receiverId = 2;

const socket = io("http://localhost:3000", {
  auth: {
    token: token
  }
});

socket.emit('mark_chat_as_read', { chatId: 6 });


socket.on("connect", () => {
  console.log("Receiver connected", socket.id);
});


socket.on("friend_status_update",({userId,status})=>{
  console.log("User status, id:", userId,status);
})
socket.on("receive_message", (message) => {
  console.log("📨 New message received:", message);
});

socket.on("disconnect", () => {
  console.log("Receiver disconnected");
});
