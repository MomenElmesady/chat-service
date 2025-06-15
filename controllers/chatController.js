const User = require("../models/user.model")
const Chat = require("../models/chat.model")
const UserChat = require("../models/userChat.model")
const Message = require("../models/message.model")
const sequelize = require("../config/database")
const { Op } = require('sequelize');
const Status = require("../models/status.model")
const MessageHistory = require("../models/messageHistory.model")
const MessageReact = require("../models/messageReact.model")
const redis = require('../config/redis');

exports.createChat = async (req, res, next) => {
  try {
    const userId = req.userId
    const scUserId = req.body.userId
    const type = req.body.type
    if (userId == scUserId){
      return res.status(400).json({ message: "repeated user id" })
    }
    if (type == "chat") {
      let [chat] = await sequelize.query(
        `
      SELECT chat_id
      FROM user_chats
      WHERE user_id IN (:userId1, :userId2)
      GROUP BY chat_id
      HAVING COUNT(DISTINCT user_id) = 2
      LIMIT 1
      `,
        {
          replacements: { userId1: userId, userId2: scUserId },
          type: sequelize.QueryTypes.SELECT
        }
      );
      if (chat) {
        return res.status(400).json({ message: "the chat already found", data: chat })
      }
      chat = await Chat.create({ admin_id: userId })
      await UserChat.create({ chat_id: chat.id, user_id: userId })
      await UserChat.create({ chat_id: chat.id, user_id: scUserId })
      return res.status(200).json({ message: "chat created successfully", chatId: chat.id })
    }
    else {

    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "somthing went wrong!" })
  }
}

exports.getUserChats = async (req, res, next) => {
  try {
    const userId = req.userId;

    const chats = await Chat.findAll({
      attributes: ['id', 'type'],
      include: [
        {
          model: User,
          as: 'users',
          required: true,
          through: {
            model: UserChat,
            // where: { user_id: { [Op.ne]: userId } },
            attributes: ['is_pinned', 'is_favorite', 'pinned_at']
          },
          attributes: ['id', 'name', 'profile_image']
        },
        {
          model: Message,
          as: "messages",
          attributes: ['id', 'content', 'createdAt', 'status', 'type', 'user_id'],
          separate: true,
          limit: 1,
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: User,
              as: "user",
              attributes: ['id']
            }
          ]
        }
      ],
      logging: console.log,
    });

    // Add the `isFromMe` flag based on message.user.id
    const chatsWithFlags = chats.map(chat => {
      const lastMessage = chat.messages?.[0] || null;
      if (lastMessage) {
        lastMessage.setDataValue('isFromMe', lastMessage.user?.id === userId);
      }

      // Extract pinned/favorite info from the pivot
      const currentUserData = chat.users.find(u => u.id === userId);
      // console.log(currentUserData,"][")
      const pinned = currentUserData.chat.dataValues.is_pinned || false;
      const pinnedAt = currentUserData.chat.dataValues.pinned_at || null;

      chat.setDataValue('is_pinned', pinned);
      chat.setDataValue('pinned_at', pinnedAt);
      chat.setDataValue('lastMessageCreatedAt', lastMessage?.createdAt || null);

      return chat;
      const redis = require('../config/redis');
    });

    // Sort chats: pinned first by pinned_at DESC, then by lastMessageCreatedAt DESC
    chatsWithFlags.sort((a, b) => {
      if (a.getDataValue('is_pinned') && b.getDataValue('is_pinned')) {
        return new Date(b.getDataValue('pinned_at')) - new Date(a.getDataValue('pinned_at'));
      }

      if (a.getDataValue('is_pinned')) return -1;
      if (b.getDataValue('is_pinned')) return 1;

      // If neither are pinned, sort by latest message createdAt
      return new Date(b.getDataValue('lastMessageCreatedAt')) - new Date(a.getDataValue('lastMessageCreatedAt'));
    });

    res.status(200).json(chatsWithFlags);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong!" });
  }
};
exports.pinChat = async (req, res, next) => {
  try {
    const userId = req.userId;
    const chatId = req.params.chatId;
    await UserChat.update({
      is_pinned: true,
      pinned_at: new Date()
    }, {
      where: {
        user_id: userId,
        chat_id: chatId
      }
    })

    res.status(200).json({ message: "chat pinned successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

exports.markMessageAsdeliverd = async (req, res, next) => {
  try {
    const { messageId } = req.body;
    const message = await Message.findByPk(messageId)
    if (!message) {
      res.status(404).json({ message: "cant find message" });
    }
    if (message.status == 'deliverd') {
      res.status(200).json("message allready deliverd")
    }
    message.status = 'deliverd'
    await Message.save()

    const senderSocketId = await redis.get(`user:${message.reciever_id}`);
    if (senderSocketId) {
      io.to(senderSocketId).emit('status_update', { messageId: message.id, status: 'delivered' });
    }
    res.status(200).json("message marked as deliverd")

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

exports.unPinChat = async (req, res, next) => {
  try {
    const userId = req.userId;
    const chatId = req.params.chatId;
    await UserChat.update({
      is_pinned: false,
      pinned_at: null
    }, {
      where: {
        user_id: userId,
        chat_id: chatId
      }
    })

    res.status(200).json({ message: "chat unPinned successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong!" });
  }
};
exports.getChatMessages = async (req, res, next) => {
  try {
    const userId = req.userId;
    const chatId = req.params.chatId;
    const messages = await Message.findAll({
      where: { chat_id: chatId },
      attributes: ['id', 'content', 'user_id', 'media_url', 'type', 'status', 'createdAt'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'profile_image']
        },
        {
          model: Status,
          as: 'statuss',
          required: false,
          attributes: ['id', 'content', 'media_url', 'isActive', 'user_id']
        },
        {
          model: Message,
          as: 'parent',
          required: false,
          attributes: ['id', 'content', 'media_url', 'user_id']
        },
        // this show the react it self and can add include user to show yhe actual react with its user 
        {
          model: MessageReact,
          as: 'reacts',
          required: false,
          attributes: ['id']
        },
      ]
    })

    messages.forEach(m => {
      m.setDataValue('isFromMe', m.user?.id === userId);
      const reactCount = m.reacts?.length || 0;
      m.setDataValue('reacts_count', reactCount);
    });
    res.status(200).json({ messages });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

exports.getMessageHistory = async (req, res, next) => {
  try {
    const userId = req.userId;
    const messageId = req.params.messageId;
    const history = await MessageHistory.findAll({
      where: { message_id: messageId },
      attributes: ['message_id', 'user_id', 'action', 'createdat'],
      include: [
        {
          model: User,
          as: "user",
          attributes: ['id', 'name', 'profile_image']
        }
      ]
    })
    res.status(200).json({ history })
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong!" });
  }
};
exports.getMessageReacts = async (req, res, next) => {
  try {
    const userId = req.userId;
    const messageId = req.params.messageId;
    const reacts = await MessageReact.findAll({
      where: { message_id: messageId },
      attributes: ['message_id', 'user_id', 'react', 'createdat'],
      include: [
        {
          model: User,
          as: "user",
          attributes: ['id', 'name', 'profile_image']
        }
      ]
    })
    res.status(200).json({ reacts })
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong!" });
  }
};
exports.uploadChatImage = async (req, res, next) => {
  const imageUrl = req.file?.path; // Cloudinary URL is returned here
  console.log(req.file)
  if (imageUrl) {
    return res.json({ url: imageUrl });
  } else {
    return res.status(400).json({ error: 'Image upload failed' });
  }
}

