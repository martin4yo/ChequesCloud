const { DataTypes } = require("sequelize");
const sequelize = require("../../config"); // 
const Banco = require('./Banco')

const Chequera = sequelize.define("Chequera", {
  banco: {
    type: DataTypes.INTEGER,
    references: {
      model: Banco, // Referencia al modelo Banco
      key: "id",
    },
    allowNull: false,
    },
    codigo: { type: DataTypes.STRING(20) },
    numdesde: { type: DataTypes.BIGINT },
    numhasta: { type: DataTypes.BIGINT },
    habilitada : { type: DataTypes.BOOLEAN }
  });

  Chequera.belongsTo(Banco, { foreignKey: "banco" }); // Una chequera pertenece a un banco

module.exports = Chequera;