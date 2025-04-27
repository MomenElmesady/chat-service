const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MessageHistory = sequelize.define("message_history", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  message_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  action: {
    type: DataTypes.ENUM("sent","delieverd","read"),
    allowNull: false
  },

}, {
  timestamps: true, // Enables createdAt and updatedAt
});

module.exports = MessageHistory;
