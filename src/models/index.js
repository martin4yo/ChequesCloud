const { sequelize } = require("../../config"); // 
const Banco = require('./Banco');
const Cheque = require('./Cheque');
const Chequera = require('./Chequera');
const Usuario = require('./Usuario');

// Ejecutar sincronización de modelos con la BD
const db = {
  sequelize,
  Banco,
  Cheque,
  Chequera,
  Usuario,
};

module.exports = db;
