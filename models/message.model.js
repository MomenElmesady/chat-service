const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Message = sequelize.define("message", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  media_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  chat_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reciever_id: {
    type: DataTypes.INTEGER,
    allowNull: true // in case the message in group
  },
  status: {
    type: DataTypes.ENUM("sent", "deliverd", "read"),
    defaultValue: "sent"
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM("text", "image", "voice"),
    defaultValue: "text"
  },
  statusId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isUpdated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }

}, {
  timestamps: true, // Enables createdAt and updatedAt
});

module.exports = Message;
