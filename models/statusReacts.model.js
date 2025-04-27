const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcrypt")

const StatusReact = sequelize.define("StatusReacts", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true, // Enables createdAt and updatedAt
});

module.exports = StatusReact;
