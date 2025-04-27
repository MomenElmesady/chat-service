const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: "mysql",
        logging: false,
    }
);

// sequelize.sync({ alter: true }) // Use { force: true } to drop and recreate tables
//     .then(() => console.log("All tables synchronized successfully!"))
//     .catch((err) => console.error("Error syncing tables:", err));

module.exports = sequelize;
