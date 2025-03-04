const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize("ChequesCloud", "sa", "Q27G4B98", {
    host: "KEYSOFT-I7\\SQLEXPRESS",
    dialect: "mssql",
  });

  module.exports = sequelize;