const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize("ChequesCloud", "sa", "Q27G4B98", {
    host: "KEYSOFT-I7\\SQLEXPRESS",
    dialect: "mssql",
    timezone: "-03:00",  // UTC-3 (Argentina, Brasil, Uruguay, etc.)
    dialectOptions: {
      typeCast: function (field, next) {
          if (field.type === "DATETIME") {
              return new Date(field.string());
          }
          return next();
      },
    },
    logging: false,
  });

  module.exports = sequelize;