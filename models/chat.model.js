const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Chat = sequelize.define("chat", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  admin_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM("chat","group"),
    defaultValue: "chat"
  }

}, {
  timestamps: true, // Enables createdAt and updatedAt
});

module.exports = Chat;
