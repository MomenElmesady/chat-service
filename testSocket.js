// testClient.js


const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWwiOiJtb21lbmVsbWVzYWR5NDgwM0BnbWFpbC5jb20iLCJpYXQiOjE3NDQ5ODE4ODcsImV4cCI6MTc0NTA2ODI4N30.5Lzo2SypLzWtL_L3IEexwqyYXEX50ZWJp3vQdjILUD4"; // Make sure verifyToken(token) can handle this
const { io } = require("socket.io-client");

const socket = io("http://localhost:3000", {
  auth: {
    token: token
  }
});

socket.on("connect", () => {
  console.log("Sender connected", socket.id);

  // Send message to receiver
  socket.emit("send_message", {
    receiverId: 2, // the receiver user ID
    message: {
      chatId: 6,
      content: "Hello from sender",
      type: "text",
      media_url: null
    }
  });
  console.log('message sent')
});

socket.on("message_sent_ack", ({ messageId }) => {
  console.log("Message sent, id:", messageId);
});
socket.on("friend_status_update",({userId,status})=>{
  console.log("User status, id:", userId,status);
})
socket.on("messageDelivered", ({ messageId,receiverId }) => {
  console.log("Message deliverd, id:", messageId,receiverId);
});
socket.on("message_read", ({ messageId,readerId }) => {
  console.log("Message readed, id:", messageId);
});

socket.on("disconnect", () => {
  console.log("Sender disconnected");
});
