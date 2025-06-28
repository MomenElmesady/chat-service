const redis = require('../config/redis');
const { verifyToken } = require('../utils/verifyJWT');
const { updateMessageToRead, deleteMessage, editMessage, createMessageReact, sentTypingEvent,markMessageAsRead, saveMessage, markChatAsRead, markUserMessagesAsDelivered, updateUserStatusToOnline, updateUserStatusToOffline } = require('../services/messageService');
const { publishNotification } = require("../helpers/pushNotification")
module.exports = (io) => {
  // Middleware to authenticate socket connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error("Authentication error"));
    try {
      const decoded = verifyToken(token);
      socket.user = decoded;
      return next();
    } catch (err) {
      return next(new Error("Authentication error"));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket?.user?.id;

    // Notify friends and search for storing it 
    await updateUserStatusToOnline(userId, io)


    // Mark user as online in Redis
    await redis.set(`user:${userId}`, socket.id);
    console.log(`User ${userId} is online`);
    await markUserMessagesAsDelivered(userId, io) 


    socket.on('send_message', async ({ receiverId, message }) => {
      try {
        const receiverSocketId = await redis.get(`user:${receiverId}`);
        const senderSocketId = await redis.get(`user:${userId}`);
        const messageObj = await saveMessage(userId, receiverId, message, receiverSocketId);

        // Notify recipient's device
        io.to(senderSocketId).emit('status_update', { messageId: message.id, status: 'sent' });

        if (receiverSocketId) {
          // send message to the reciver
          io.to(receiverSocketId).emit('receive_message', messageObj);
          // Update sender's status to "Delivered"
          io.to(senderSocketId).emit('status_update', { messageId: message.id, status: 'delivered' });
        } else {
          await publishNotification({
            receiverId,
            senderId: userId,
            messageId: messageObj.id,
            content: message,
          });
          // rabbitMQ
          // Trigger Notification Service (e.g., via HTTP or queue)
          // if the notification sent -> updateMessageToDeliverd()
        }
      } catch (err) {
        console.error('send_message error:', err);
        socket.emit('error_occurred', {
          type: 'SEND_MESSAGE_ERROR',
          message: 'Failed to send your message. Please try again.',
        });
      }
    });


    socket.on('mark_chat_as_read', async ({ chatId }) => {
      try {
        await markChatAsRead(chatId, userId, io)
        socket.emit("all messages readed successfully", { chatId })
      } catch (err) {
        console.error('send_message error:', err);
        socket.emit('error_occurred', {
          type: 'mark_chat_as_read Error',
          message: 'Failed to mark_chat_as_read. Please try again.',
        });
      }
    });

    // TODO -> do service, handle sender socketId
    socket.on('message_read', async ({ messageId, chatId, senderId }) => {
      // Update the message in DB
      await markMessageAsRead(messageId)
      await updateMessageToRead(messageId)
    });

    socket.on("typing", async ({ userId, chatId }) => {
      if (!userId || !chatId) {
        return socket.emit('error_occurred', {
          type: 'typing Error',
          message: 'Invalid data provided for typing event.'
        });
      }

      try {
        await sentTypingEvent(userId, chatId, 'typing', io);
      } catch (error) {
        console.error('Typing event error:', error);
        socket.emit('error_occurred', {
          type: 'typing Error',
          message: 'Failed to send typing status. Please try again.',
        });
      }
    });
    socket.on("stop_typing", async ({ userId, chatId }) => {
      if (!userId || !chatId) {
        return socket.emit('error_occurred', {
          type: 'typing Error',
          message: 'Invalid data provided for typing event.'
        });
      }

      try {
        await sentTypingEvent(userId, chatId, 'stop_typing', io);
      } catch (error) {
        console.error('Typing event error:', error);
        socket.emit('error_occurred', {
          type: 'typing Error',
          message: 'Failed to send typing status. Please try again.',
        });
      }
    });

    socket.on("editMessage", async ({ messageId }) => {
      try {
        await editMessage(messageId, userId, io)
        socket.emit("message_edited_successfully", { messageId })
      } catch (error) {
        console.error('message_react event error:', error);
        socket.emit('error_occurred', {
          type: 'typing Error',
          message: 'Failed to send message_react. Please try again.',
        });
      }
    })

    socket.on("deleteMessage", async ({ messageId, content }) => {
      try {
        await deleteMessage(messageId, content, userId, io)
        socket.emit("message_edited_successfully", { messageId })
      } catch (error) {
        console.error('message_react event error:', error);
        socket.emit('error_occurred', {
          type: 'typing Error',
          message: 'Failed to send message_react. Please try again.',
        });
      }
    })


    socket.on("message_react", async ({ messageId, react }) => {
      try {
        await createMessageReact(messageId, react, userId, io)
        socket.emit("message_deleted_successfully", { messageId })
      } catch (error) {
        console.error('message_react event error:', error);
        socket.emit('error_occurred', {
          type: 'typing Error',
          message: 'Failed to send message_react. Please try again.',
        });
      }
    })

    socket.on('disconnect', async () => {
      await redis.del(`user:${userId}`);
      console.log(`User ${userId} is offline`);

      await updateUserStatusToOffline(userId, io)
    })

  });
};
