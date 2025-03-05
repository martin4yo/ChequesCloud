const { Sequelize } = require("sequelize");

require("dotenv").config();

const config = {
  api: {
    baseUrl: process.env.API_URL || "http://localhost:8080", // URL de la API
  },
  db: {
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || "mssql", // Cambia según el motor: mysql, postgres, etc.
    port: process.env.DB_PORT || 1433,
  },
};

const sequelize = new Sequelize("ChequesCloud", 
    config.db.user, 
    config.db.password, 
    {
    host: config.db.host,
    dialect: config.db.dialect,
    timezone: "-03:00",  // UTC-3 (Argentina, Brasil, Uruguay, etc.)
    dialectOptions: {
      typeCast: function (field, next) {
          if (field.type === "DATETIME") {
              return new Date(field.string());
          }
          return next();
      },
    },
    logging: true,
  });

  module.exports = { sequelize, config };