// models/ChatUser.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UserChat = sequelize.define("user_chat", {
  chat_id: {
    type: DataTypes.INTEGER,
    // references: {
    //   model: "chat",
    //   key: "id",
    // },
  },
  user_id: {
    type: DataTypes.INTEGER,
    // references: {
    //   model: "User", // make sure this matches your User model table name
    //   key: "id",
    // },
  },
  is_pinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_favorite: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  pinned_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
});

module.exports = UserChat;
