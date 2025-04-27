const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Reaction = sequelize.define("reaction", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  message_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    // references: {
    //   model: "message",
    //   key: "id",
    // },
    onDelete: "CASCADE"
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    // references: {
    //   model: "User",
    //   key: "id",
    // },
    onDelete: "CASCADE"
  },
  type: {
    type: DataTypes.ENUM("like", "love", "laugh", "wow", "angry", "sad"),
    allowNull: false,
  },
}, {
  timestamps: true,
});

module.exports = Reaction;
