const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcrypt")

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  profile_image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  discription: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: true
  },
  otpExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  fcm_token: {
    type: DataTypes.TEXT,
    defaultValue: null
  }
}, {
  timestamps: true, // Enables createdAt and updatedAt
  hooks: {
    beforeCreate: async (user, options) => {
      user.password = await hashPassword(user.password);
    }
  },
});

async function hashPassword(password) {
  return await bcrypt.hash(password, 12)
}
module.exports = User;
