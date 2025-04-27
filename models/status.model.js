const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcrypt")

const Status = sequelize.define("Status", {
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
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  expired_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true, // Enables createdAt and updatedAt
});

module.exports = Status;
