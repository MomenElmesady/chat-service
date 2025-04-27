const express = require('express');
const { protect } = require("../helpers/protect")
const chatController = require("../controllers/chatController")
const router = express.Router();
const multer = require('multer');
const { uploadChat } = require("../config/cloudinaryStorage")

router.post("/", protect, chatController.createChat)
router.get("/", protect, chatController.getUserChats)
router.patch("/pin/:chatId", protect, chatController.pinChat)
router.patch("/unPin/:chatId", protect, chatController.unPinChat)

router.get("/messages/:chatId", protect, chatController.getChatMessages)
router.get("/message/:messageId/history", protect, chatController.getMessageHistory)
router.get("/message/:messageId/reacts", protect, chatController.getMessageReacts)

router.post("/uploadChatImage", uploadChat.single('image'), chatController.uploadChatImage)

router.post('/api/messages/delivered', chatController.markMessageAsdeliverd);



module.exports = router