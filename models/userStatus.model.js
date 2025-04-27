const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcrypt")

const UserStatus = sequelize.define("user_status", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  last_seen: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isOnline: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  timestamps: true, // Enables createdAt and updatedAt
  indexes: [
    {
      unique: true,
      fields: ["user_id"],
    },
  ]
});

module.exports = UserStatus;
