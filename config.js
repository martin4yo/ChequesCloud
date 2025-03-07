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
    logging : true,
  },
};

const sequelize = new Sequelize(
    config.db.name, 
    config.db.user, 
    config.db.password, 
    {
    host: config.db.host,
    dialect: config.db.dialect,
    timezone: '+00:00', // Almacenar y recuperar en UTC sin conversión
    dialectOptions: {
      useUTC: true,  // Asegura que se guarden en UTC
      dateStrings: true, // Devuelve fechas como strings sin conversión a objeto Date
      typeCast: function (field, next) { // Maneja las conversiones manualmente
        if (field.type === "DATETIME") {
          return field.string(); // Devuelve la fecha como string "YYYY-MM-DD HH:mm:ss"
        }
        return next();
      }
    },
    logging: config.db.logging,
  });

  module.exports = { sequelize, config };