const { DataTypes } = require("sequelize");
const sequelize = require("../../config"); // 
const Banco = require('./Banco')

const Cheque = sequelize.define("Cheque", {
    banco: {
        type: DataTypes.INTEGER,
        references: {
          model: Banco, // Referencia al modelo Banco
          key: "id",
        },
        allowNull: false,
      },
    numero: { type: DataTypes.STRING(50) },
    emision: { type: DataTypes.DATE },
    vencimiento : { type: DataTypes.DATE},
    importe : { type: DataTypes.DOUBLE },
    nombre :{ type: DataTypes.STRING(250) },
    conciliado : { type: DataTypes.BOOLEAN },
    fechaconciliacion : { type: DataTypes.DATE },
});

Cheque.belongsTo(Banco, { foreignKey: "banco" }); // Una chequera pertenece a un banco

module.exports = Cheque;