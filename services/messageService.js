const Message = require('../models/message.model');
const { Op } = require('sequelize');
const redis = require('../config/redis');
const Contact = require('../models/contact.model');
const UserStatus = require('../models/userStatus.model');
const MessageReact = require('../models/messageReact.model');
const UserChat = require('../models/userChat.model');

const saveMessage = async (senderId, receiverId, message, isDelivered) => {
  // type is enum ("text","image","voice")
  // media_url included through separated enpoint to upload image
  console.log(
    isDelivered,
    senderId,
    message.content,
    isDelivered ? 'deliverd' : 'sent',
    message.chatId,
    message.parent_id || null,
    message.statusId || null,
    message.type,
    message.media_url,
    receiverId

  )
  console.log(senderId)

  const newMessage = await Message.create({
    user_id: senderId,
    content: message.content,
    status: isDelivered ? 'deliverd' : 'sent',
    chat_id: message.chatId,
    parent_id: message.parent_id || null,
    statusId: message.statusId || null,
    type: message.type,
    media_url: message.media_url,
    reciever_id: receiverId
  });
  return newMessage;
};


const updateUserStatusToOnline = async (userId, io) => {
  const friends = await Contact.findAll({
    where: {
      contact_id: userId
    },
    attributes: ['user_id'],
    raw: true
  });
  await UserStatus.update({ isOnline: true }, {
    where: {
      user_id: userId
    }
  })
  await Promise.all(
    friends.map(async (friend) => {
      const friendSocketId = await redis.get(`user:${friend.user_id}`);
      if (friendSocketId) {
        io.to(friendSocketId).emit('friend_status_update', {
          userId,
          status: 'online',
        });
      }
    })
  );

};
const updateUserStatusToOffline = async (userId, io) => {
  const friends = await Contact.findAll({
    where: {
      contact_id: userId
    }, attributes: ['user_id']
  });
  await UserStatus.update({ isOnline: false, last_seen: new Date() }, {
    where: {
      user_id: userId
    }
  })
  await Promise.all(
    friends.map(async (friend) => {
      const friendSocketId = await redis.get(`user:${friend.user_id}`);
      if (friendSocketId) {
        io.to(friendSocketId).emit('friend_status_update', {
          userId,
          status: 'offline',
        });
      }
    })
  );

};
const createMessageReact = async (messageId, react, userId, io) => {
  try {
    const message = await Message.findOne({ where: { id: messageId } });
    if (!message) return;
    const chatId = message.chat_id;
    const otherUser = await UserChat.findOne({
      where: {
        chat_id: chatId,
        user_id: {
          [Op.ne]: userId
        }
      },
      attributes: ['user_id']
    });

    if (!otherUser) return;

    const otherUserId = otherUser.user_id;
    const friendSocketId = await redis.get(`user:${otherUserId}`);


    const existingReact = await MessageReact.findOne({
      where: { message_id: messageId, user_id: userId },
    });
    if (existingReact) {
      if (existingReact.react === react) {
        await existingReact.destroy();
        if (friendSocketId) {
          io.to(friendSocketId).emit("message_react", {
            messageId,
            react,
            userId,
            action: "deleted",
          })
        }
        return;
      } else {
        existingReact.react = react; // Update to new reaction
        await existingReact.save();
      }
    } else {
      await MessageReact.create({ message_id: messageId, user_id: userId, react });
    }

    if (friendSocketId) {
      io.to(friendSocketId).emit("message_react", {
        messageId,
        react,
        userId,
        action: "created_or_updated",
      })
    }
  } catch (error) {
    console.error("createMessageReact error:", error);
    throw error;
  }
};

const editMessage = async (messageId, content, userId, io) => {
  try {
    if (!content?.trim()) return; // prevent empty edit
    const message = await Message.findOne({ where: { id: messageId } });
    if (!message) return;
    const receiverId = message.reciever_id
    const friendSocketId = await redis.get(`user:${receiverId}`);
    await Message.update({ content, updatedAt: new Date(),isUpdated: true }, {
      where: {
        id: messageId,
        user_id: userId
      }
    })

    if (friendSocketId) {
      io.to(friendSocketId).emit("edit_message", {
        messageId,
        content,
        userId,
        updatedAt: new Date()
      })
    }
  } catch (error) {
    console.error("editMessage error:", error);
    throw error;
  }
};

const deleteMessage = async (messageId, userId, io) => {
  try {
    const message = await Message.findOne({ where: { id: messageId } });
    if (!message) return;
    const receiverId = message.reciever_id
    const friendSocketId = await redis.get(`user:${receiverId}`);
    await Message.update({ content: null, media_url: null, isDeleted: true }, {
      where: {
        id: messageId,
        user_id: userId
      }
    })

    if (friendSocketId) {
      io.to(friendSocketId).emit("deleteMessage", {
        messageId,
        userId
      })
    }
  } catch (error) {
    console.error("editMessage error:", error);
    throw error;
  }
};


const updateMessageToRead = async (messageId, senderId, chatId, io) => {
  try {
    await Message.update({ status: 'read' }, { where: { id: messageId } });
    const senderSocketId = await redis.get(`user:${senderId}`);
    if (senderSocketId) {
      io.to(senderSocketId).emit('status_update', {
        messageId,
        status: "read",
        chatId
      });
    }
  } catch (error) {
    console.error("updateMessageToRead error:", error);
    throw error;
  }
};



const markUserMessagesAsDelivered = async (userId, io) => {
  try {
    const undeliveredMessages = await Message.findAll({
      where: { reciever_id: userId, status: 'sent' }, // fix field name spelling here
    });

    if (undeliveredMessages.length === 0) return;

    await Message.update(
      { status: 'deliverd' },
      { where: { reciever_id: userId, status: 'sent' } }
    );
    // Do Redis gets in parallel for better performance
    await Promise.all(
      undeliveredMessages.map(async (msg) => {
        const senderSocketId = await redis.get(`user:${msg.dataValues.user_id}`);
        if (senderSocketId) {
          io.to(senderSocketId).emit('messageDelivered', {
            messageId: msg.id,
            receiverId: msg.reciever_id,
          });
        }
      })
    );
  } catch (err) {
    console.error("Error in markUserMessagesAsDelivered:", err);
  }
};

const markChatAsRead = async (chatId, userId, io) => {
  try {
    const unreadMessages = await Message.findAll({
      where: {
        chat_id: chatId,
        status: 'deliverd',
        user_id: {
          [Op.ne]: userId
        }
      }
    });

    await Message.update(
      { status: 'read' },
      {
        where: {
          chat_id: chatId,
          user_id: {
            [Op.ne]: userId
          }
        }
      }
    );
    const senderId = unreadMessages[0]?.user_id
    const senderSocketId = await redis.get(`user:${senderId}`);
    if (senderSocketId) {
      unreadMessages.forEach(msg => {
        io.to(senderSocketId).emit('message_read', {
          messageId: msg.id,
          readerId: msg.reciever_id,
          chatId
        });
      });
    }
  } catch (err) {
    console.error("Error in markUserMessagesAsDelivered:", err);
  }
};
const markMessageAsRead = async (messageId, io) => {
  try {
    const message = await Message.findOne({
      where: {
        id: messageId
      }
    });

    await Message.update(
      { status: 'read' },
      {
        where: {
          id: messageId,
        }
      }
    );
    const senderId = message.senderId
    const senderSocketId = await redis.get(`user:${senderId}`);
    if (senderSocketId) {
      io.to(senderSocketId).emit('message_read', {
        messageId,
        readerId: message.reciever_id,
      });
    }
  } catch (err) {
    console.error("Error in markUserMessagesAsDelivered:", err);
  }
};

const sentTypingEvent = async (userId, chatId, status, io) => {
  try {
    const otherUser = await UserChat.findOne({
      where: {
        chat_id: chatId,
        user_id: {
          [Op.ne]: userId
        }
      },
      attributes: ['user_id']
    });

    if (!otherUser) return;

    const otherUserId = otherUser.user_id;

    const eventName = status === 'typing' ? 'typing' : 'stop_typing';

    const senderSocketId = await redis.get(`user:${otherUserId}`);
    io.to(senderSocketId).emit(eventName, {
      from: userId,
      chatId
    });

  } catch (err) {
    console.error("Error in sentTypingEvent:", err);
  }
};


module.exports = { markMessageAsRead, updateMessageToRead, deleteMessage, editMessage, createMessageReact, sentTypingEvent, saveMessage, markUserMessagesAsDelivered, markChatAsRead, updateUserStatusToOnline, updateUserStatusToOffline };
