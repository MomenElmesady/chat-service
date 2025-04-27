const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MessageReact = sequelize.define("message_react", {
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
  react: {
    type: DataTypes.ENUM("love","like","haha"),
    defaultValue: 'love'
  },

}, {
  timestamps: true, // Enables createdAt and updatedAt
});

module.exports = MessageReact;
