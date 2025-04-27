const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcrypt")

const Contact = sequelize.define("Contact", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  contact_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  is_mutual: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  timestamps: true, // Enables createdAt and updatedAt
  indexes: [
    {
      unique: true,
      fields: ["user_id", "contact_id"], // Unique index on user_id and contact_id
    },
  ]
});

module.exports = Contact;
