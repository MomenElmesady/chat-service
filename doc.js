// Simplified example
socket.on("join", async ({ userId, token }) => {
  const isValid = verifyJWT(token); // Use same secret as User Service
  if (!isValid) return socket.emit("error", "Unauthorized");

  await redis.set(`user:${userId}`, socket.id); // Mark online
});

socket.on("send_message", async ({ senderId, receiverId, message }) => {
  const receiverSocketId = await redis.get(`user:${receiverId}`);
  const msgData = { senderId, receiverId, message, timestamp: Date.now() };

  if (receiverSocketId) {
    io.to(receiverSocketId).emit("receive_message", msgData);
    // Save to DB with status "delivered"
  } else {
    // Save to DB with status "undelivered"
    // Trigger Notification Service (e.g., HTTP or message queue)
  }
});
