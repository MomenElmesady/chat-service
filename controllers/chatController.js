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
    if (userId == scUserId) {
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
        const results = await sequelize.query(
          `
          SELECT 
            c.id AS chat_id,
            u.id AS user_id,
            u.name AS user_name,
            u.profile_image,
            m.content,
            m.status,
            m.createdAt,
            m.type,
            m.id AS message_id,
            m.user_id AS sender,
            uc.user_id AS current_user_id,
            uc.is_pinned,
            uc.is_favorite,
            uc.pinned_at,
            (
              SELECT COUNT(*)
              FROM messages m2
              WHERE m2.chat_id = c.id
                AND m2.status != 'read'
                AND m2.user_id != :userId
            ) AS unread_count
          FROM chats c
          JOIN user_chats uc ON c.id = uc.chat_id AND uc.user_id = :userId
          LEFT JOIN user_chats uc2 ON uc2.chat_id = c.id AND uc2.user_id != :userId
          LEFT JOIN users u ON u.id = uc2.user_id 
          LEFT JOIN messages m ON m.id = (
            SELECT id
            FROM messages
            WHERE chat_id = c.id
            ORDER BY createdAt DESC
            LIMIT 1
          )
            where c.id = :chatId
          ORDER BY m.createdAt DESC;
          `,
          {
            replacements: { userId, chatId: chat.chat_id },
            type: sequelize.QueryTypes.SELECT,
          }
        );
        results.sort((a, b) => {
          if (b.is_pinned !== a.is_pinned) {
            return b.is_pinned - a.is_pinned;
          }
          // fallback to message createdAt desc if both have same pinned state
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

        // Group chats
        const chatsMap = {};

        for (const row of results) {
          const chatId = row.chat_id;

          if (!chatsMap[chatId]) {
            chatsMap[chatId] = {
              chatId: row.chat_id,
              lastMessage: row.content
                ? {
                  content: row.content,
                  status: row.status,
                  createdAt: row.createdAt,
                  type: row.type,
                  senderId: row.sender,
                  isMine: row.sender === userId,
                  messageId: row.message_id
                }
                : null,
              unreadCount: row.unread_count,
              isPinned: !!row.is_pinned,
              isFavorite: !!row.is_favorite,
              pinnedAt: row.pinned_at,
              participants: [],
            };
          }

          if (row.user_id) {
            chatsMap[chatId].participants.push({
              userId: row.user_id,
              name: row.user_name,
              profile_image: row.profile_image
            });
          }
        }
        const chats = Object.values(chatsMap);

        return res.status(200).json({ message: "the chat already found", data: chats[0] });
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

    const results = await sequelize.query(
      `
      SELECT 
        c.id AS chat_id,
        u.id AS user_id,
        u.name AS user_name,
        u.profile_image,
        m.content,
        m.status,
        m.createdAt,
        m.type,
        m.id as message_id,
        m.isDeleted,
        m.user_id AS sender,
        uc.user_id AS current_user_id,
        uc.is_pinned,
        uc.is_favorite,
        uc.pinned_at,
        (
          SELECT COUNT(*)
          FROM messages m2
          WHERE m2.chat_id = c.id
            AND m2.status != 'read'
            AND m2.user_id != :userId
        ) AS unread_count
      FROM chats c
      JOIN user_chats uc ON c.id = uc.chat_id AND uc.user_id = :userId
      LEFT JOIN user_chats uc2 ON uc2.chat_id = c.id AND uc2.user_id != :userId
      LEFT JOIN users u ON u.id = uc2.user_id 
      LEFT JOIN messages m ON m.id = (
        SELECT id
        FROM messages
        WHERE chat_id = c.id
        ORDER BY createdAt DESC
        LIMIT 1
      )
      ORDER BY m.createdAt DESC;
      `,
      {
        replacements: { userId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Sort pinned chats first
    results.sort((a, b) => {
      if (b.is_pinned !== a.is_pinned) {
        return b.is_pinned - a.is_pinned;
      }
      // fallback to message createdAt desc if both have same pinned state
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    // Group chats
    const chatsMap = {};

    for (const row of results) {
      const chatId = row.chat_id;

      if (!chatsMap[chatId]) {
        chatsMap[chatId] = {
          chatId: row.chat_id,
          lastMessage: row.content
            ? {
              content: row.content,
              status: row.status,
              createdAt: row.createdAt,
              type: row.type,
              senderId: row.sender,
              isMine: row.sender === userId,
              messageId: row.message_id,
              isdeleted: row.isDeleted ? true : false
            }
            : null,
          unreadCount: row.unread_count,
          isPinned: !!row.is_pinned,
          isFavorite: !!row.is_favorite,
          pinnedAt: row.pinned_at,
          participants: [],
        };
      }

      if (row.user_id) {
        chatsMap[chatId].participants.push({
          userId: row.user_id,
          name: row.user_name,
          profile_image: row.profile_image
        });
      }
    }

    const chats = Object.values(chatsMap);
    res.status(200).json(chats);

  } catch (error) {
    console.error(error);
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
      attributes: ['id', 'content', 'user_id', 'media_url', 'type', 'status', 'createdAt', 'updatedAt','isDeleted','isUpdated'],
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
          attributes: ['id', 'content', 'media_url', 'user_id','isDeleted']
        },
        // this show the react it self and can add include user to show yhe actual react with its user 
        {
          model: MessageReact,
          as: 'reacts',
          required: false,
          attributes: ['id', 'createdAt','react'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['name', 'id', 'profile_image']
            }
          ]
        },
      ]
    })

    messages.forEach(m => {
      console.log(m.createdAt.toISOString() !== m.updatedAt.toISOString())
      console.log(m)
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

