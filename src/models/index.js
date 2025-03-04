const sequelize = require("../../config"); // 
const Banco = require('./Banco');
const Cheque = require('./Cheque');
const Chequera = require('./Chequera');

// Ejecutar sincronización de modelos con la BD
const db = {
  sequelize,
  Banco,
  Cheque,
  Chequera,
};

module.exports = db;
